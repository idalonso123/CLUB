import { NextApiRequest, NextApiResponse } from 'next';
import executeQuery from '@/lib/db';
import { withAuth, AuthenticatedRequest } from '@/middleware/authMiddleware';
import { getExpirationConfig } from '@/lib/configHelpers';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  try {
    const userRole = await req.user?.getRole();
    if (userRole !== "administrador" && userRole !== "admin" && userRole !== "cajero") {
      return res.status(403).json({
        success: false,
        message: "No tienes permiso para acceder a esta funcionalidad",
      });
    }
    if (req.method !== 'PUT') {
      return res.status(405).json({ success: false, message: 'Método no permitido' });
    }
    const { id } = req.query;
    if (!id || isNaN(Number(id))) {
      return res.status(400).json({ success: false, message: 'ID de carnet inválido' });
    }
    const petCards = await executeQuery({
      query: `SELECT * FROM pet_cards WHERE id = ?`,
      values: [Number(id)]
    });
    if (!petCards || (petCards as any[]).length === 0) {
      return res.status(404).json({ success: false, message: 'Carnet animal no encontrado' });
    }
    const petCard = (petCards as any[])[0];
    if (petCard.completed) {
      return res.status(400).json({ success: false, message: 'Este carnet ya está completado' });
    }
    // Obtener configuración de caducidad para calcular maxExpirationDate
    const expirationConfig = await getExpirationConfig();
    const sellosRequeridos = expirationConfig.sellos_requeridos_carnet || 6;

    if (petCard.stamps < sellosRequeridos) {
      return res.status(400).json({ success: false, message: `Este carnet aún no tiene ${sellosRequeridos} sellos` });
    }
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    await executeQuery({
      query: `
        UPDATE pet_cards 
        SET completed = 1, updatedAt = ?, expirationDate = NULL, isExpired = 0
        WHERE id = ?
      `,
      values: [now, Number(id)]
    });
    const updatedPetCardsResult = await executeQuery({
      query: `SELECT * FROM pet_cards WHERE id = ?`,
      values: [Number(id)]
    });
    const rawPetCard = (updatedPetCardsResult as any[])[0];
    
    // Calcular maxExpirationDate (antigüedad máxima desde creación - no cambia al completar)
    let maxExpirationDate = null;
    if (rawPetCard.createdAt) {
      const createdDate = new Date(rawPetCard.createdAt);
      createdDate.setMonth(createdDate.getMonth() + expirationConfig.caducidad_carnet_antiguedad_meses);
      maxExpirationDate = createdDate.toISOString().slice(0, 19).replace('T', ' ');
    }
    
    // Parsear stamp_dates si existe
    let parsedStampDates: string[] = [];
    try {
      if (rawPetCard.stamp_dates) {
        if (typeof rawPetCard.stamp_dates === 'string') {
          parsedStampDates = JSON.parse(rawPetCard.stamp_dates);
        } else if (Array.isArray(rawPetCard.stamp_dates)) {
          parsedStampDates = rawPetCard.stamp_dates;
        }
      }
    } catch (e) {
      console.error('Error parseando stamp_dates:', e);
    }
    
    const completedPetCard = {
      ...rawPetCard,
      stampDates: parsedStampDates,
      maxExpirationDate: maxExpirationDate
    };
    
    // Calcular fecha de expiración para la recompensa (basada en la configuración de la recompensa plantilla)
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
    
    // Crear recompensa en recompensas_carnet_mascota
    if (completedPetCard.userId) {
      // Buscar el precio del producto en la tabla productos_carnet_mascota usando el código de barras
      let productPvp = 0;
      let productArticulo = null;
      
      if (completedPetCard.codigo_barras) {
        const productResult = await executeQuery({
          query: `SELECT Articulo, PVP FROM productos_carnet_mascota WHERE C_Barras = ? LIMIT 1`,
          values: [completedPetCard.codigo_barras]
        }) as any[];
        
        if (productResult && productResult.length > 0) {
          productPvp = parseFloat(productResult[0].PVP) || 0;
          productArticulo = productResult[0].Articulo;
        }
      }
      
      await executeQuery({
        query: `
          INSERT INTO recompensas_carnet_mascota 
          (user_id, pet_card_id, product_articulo, product_nombre, product_barcode, product_pvp, pet_name, pet_type, fecha_expiracion)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        values: [
          completedPetCard.userId,
          Number(id),
          productArticulo,
          completedPetCard.productName,
          completedPetCard.codigo_barras || null,
          productPvp,
          completedPetCard.petName,
          completedPetCard.petType,
          fechaExpiracion
        ]
      });
      console.log(`Recompensa generada para usuario ${completedPetCard.userId} - Producto: ${completedPetCard.productName} - Precio: ${productPvp}€`);
    }
    
    return res.status(200).json({
      success: true,
      message: 'Carnet completado correctamente. Recompensa generada.',
      petCard: completedPetCard,
      rewardGenerated: true
    });
  } catch (error) {
    console.error('Error al completar carnet:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
}

export default withAuth(handler);