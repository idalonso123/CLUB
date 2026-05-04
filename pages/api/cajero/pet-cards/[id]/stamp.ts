import { NextApiRequest, NextApiResponse } from 'next';
import executeQuery from '@/lib/db';
import { withAuth, AuthenticatedRequest } from '@/middleware/authMiddleware';
import { getExpirationConfig } from '@/lib/configHelpers';

/**
 * RENDIMIENTO: Endpoint optimizado para añadir sellos a carnets de mascotas
 * - Evita queries redundantes usando los datos del primer SELECT
 * - Calcula fechas directamente sin necesidad de reconsulta
 */

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  try {
    const userRole = await req.user?.getRole();
    if (userRole !== "administrador" && userRole !== "admin" && userRole !== "cajero") {
      return res.status(403).json({
        success: false,
        message: "No tienes permiso para acceder a esta funcionalidad",
      });
    }
    if (req.method !== 'POST') {
      return res.status(405).json({ success: false, message: 'Método no permitido' });
    }
    const { id } = req.query;
    if (!id || isNaN(Number(id))) {
      return res.status(400).json({ success: false, message: 'ID de carnet inválido' });
    }
    
    // Obtener configuración de caducidad una sola vez
    const expirationConfig = await getExpirationConfig();
    const sellosRequeridos = expirationConfig.sellos_requeridos_carnet || 6;

    // RENDIMIENTO: Una sola consulta SELECT para obtener el estado actual
    const petCards = await executeQuery({
      query: `SELECT * FROM pet_cards WHERE id = ?`,
      values: [Number(id)]
    });
    
    if (!petCards || (petCards as any[]).length === 0) {
      return res.status(404).json({ success: false, message: 'Carnet animal no encontrado' });
    }
    
    const petCard = (petCards as any[])[0];
    
    // Validaciones usando los datos ya obtenidos
    if (petCard.completed) {
      return res.status(400).json({ success: false, message: 'Este carnet ya está completado' });
    }

    if (petCard.stamps >= sellosRequeridos) {
      return res.status(400).json({ success: false, message: `Este carnet ya tiene ${sellosRequeridos} sellos` });
    }
    
    // Procesar stamp_dates usando los datos ya obtenidos
    let stampDates: string[] = [];
    try {
      if (petCard.stamp_dates) {
        if (typeof petCard.stamp_dates === 'string') {
          stampDates = JSON.parse(petCard.stamp_dates);
        } else if (Array.isArray(petCard.stamp_dates)) {
          stampDates = petCard.stamp_dates;
        }
      }
    } catch (e) {
      console.error('Error al parsear stamp_dates:', e);
      stampDates = [];
    }
    
    if (!Array.isArray(stampDates)) {
      console.warn('stamp_dates no es un array, inicializando como array vacío');
      stampDates = [];
    }
    
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    stampDates.push(now);
    
    // Calcular fechas usando la configuración obtenida (sin consultas adicionales)
    const expirationDate = new Date();
    expirationDate.setMonth(expirationDate.getMonth() + expirationConfig.caducidad_carnet_inactividad_meses);
    const expirationDateFormatted = expirationDate.toISOString().slice(0, 19).replace('T', ' ');
    
    // Calcular maxExpirationDate usando la fecha de creación ya obtenida
    let maxExpirationDate: string | null = null;
    if (petCard.createdAt) {
      const createdDate = new Date(petCard.createdAt);
      createdDate.setMonth(createdDate.getMonth() + expirationConfig.caducidad_carnet_antiguedad_meses);
      maxExpirationDate = createdDate.toISOString().slice(0, 19).replace('T', ' ');
    }
    
    // Actualizar el carnet
    await executeQuery({
      query: `
        UPDATE pet_cards 
        SET stamps = stamps + 1, stamp_dates = ?, updatedAt = ?, expirationDate = ?, isExpired = 0
        WHERE id = ?
      `,
      values: [JSON.stringify(stampDates), now, expirationDateFormatted, Number(id)]
    });
    
    // Verificar si se alcanzó el último sello - completar automáticamente
    const newStamps = petCard.stamps + 1;
    if (newStamps >= sellosRequeridos) {
      console.log(`Carnet ${id} completado con ${newStamps} sellos - Generando recompensa automáticamente`);
      
      // Calcular fecha de expiración para la recompensa
      let fechaExpiracion = null;
      const rewardTemplateResult = await executeQuery({
        query: `SELECT expiracion_activa, duracion_meses FROM recompensas WHERE tipo_recompensa = 'carnet' LIMIT 1`
      }) as any[];
      
      if (rewardTemplateResult && rewardTemplateResult.length > 0 && rewardTemplateResult[0].expiracion_activa === 1) {
        const duracionMeses = rewardTemplateResult[0].duracion_meses || 1;
        const expDate = new Date();
        expDate.setMonth(expDate.getMonth() + duracionMeses);
        fechaExpiracion = expDate.toISOString().slice(0, 19).replace('T', ' ');
      }
      
      // Marcar el carnet como completado
      await executeQuery({
        query: `UPDATE pet_cards SET completed = 1, updatedAt = ? WHERE id = ?`,
        values: [now, Number(id)]
      });
      
      // Buscar el precio del producto en la tabla productos_carnet_mascota usando el código de barras
      let productPvp = 0;
      let productArticulo = null;
      
      if (petCard.codigo_barras) {
        const productResult = await executeQuery({
          query: `SELECT Articulo, PVP FROM productos_carnet_mascota WHERE C_Barras = ? LIMIT 1`,
          values: [petCard.codigo_barras]
        }) as any[];
        
        if (productResult && productResult.length > 0) {
          productPvp = parseFloat(productResult[0].PVP) || 0;
          productArticulo = productResult[0].Articulo;
        }
      }
      
      // Crear la recompensa en recompensas_carnet_mascota
      if (petCard.userId) {
        await executeQuery({
          query: `
            INSERT INTO recompensas_carnet_mascota 
            (user_id, pet_card_id, product_articulo, product_nombre, product_barcode, product_pvp, pet_name, pet_type, fecha_expiracion)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `,
          values: [
            petCard.userId,
            Number(id),
            productArticulo,
            petCard.productName,
            petCard.codigo_barras || null,
            productPvp,
            petCard.petName,
            petCard.petType,
            fechaExpiracion
          ]
        });
        console.log(`Recompensa generada automáticamente para usuario ${petCard.userId} - Producto: ${petCard.productName} - Precio: ${productPvp}€`);
      }
    }
    
    // RENDIMIENTO: Construir la respuesta directamente usando los datos modificados
    // Ya no necesitamos hacer otra consulta SELECT
    const transformedPetCard = {
      ...petCard,
      stamps: newStamps,
      stampDates: stampDates,
      updatedAt: now,
      expirationDate: expirationDateFormatted,
      isExpired: false,
      maxExpirationDate: maxExpirationDate,
      completed: newStamps >= sellosRequeridos
    };
    
    return res.status(200).json({
      success: true,
      message: 'Sello añadido correctamente',
      petCard: transformedPetCard,
    });
  } catch (error) {
    console.error('Error al añadir sello:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
}

export default withAuth(handler);