import { NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '@/middleware/authMiddleware';
import executeQuery from '@/lib/db';

async function adminRewardsHandler(req: AuthenticatedRequest, res: NextApiResponse) {
  // Verificar que el usuario sea administrador
  const userRole = await req.user?.getRole();
  if (userRole !== 'administrador' && userRole !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'No tienes permiso para acceder a esta funcionalidad'
    });
  }

  // GET: Obtener todas las recompensas (incluidas las no disponibles)
  if (req.method === 'GET') {
    try {
      // Obtener todas las recompensas para administración
      const query = `
        SELECT 
          id,
          nombre AS name,
          descripcion AS description,
          puntos AS points,
          imagen_url AS imageUrl,
          disponible AS available,
          categoria AS category,
          stock,
          canjeo_multiple AS canjeoMultiple,
          expiracion_activa AS expiracionActiva,
          duracion_meses AS duracionMeses,
          fecha_creacion AS createdAt,
          fecha_modificacion AS updatedAt
        FROM recompensas
        ORDER BY id DESC
      `;

      const rewards = await executeQuery({
        query,
        values: []
      });

      // Formatear respuesta
      const formattedRewards = (rewards as any[]).map(reward => ({
        ...reward,
        available: reward.available === 1,
        canjeoMultiple: reward.canjeoMultiple === 1,
        expiracionActiva: reward.expiracionActiva === 1,
        createdAt: reward.createdAt ? new Date(reward.createdAt).toISOString() : null,
        updatedAt: reward.updatedAt ? new Date(reward.updatedAt).toISOString() : null
      }));

      return res.status(200).json({
        success: true,
        rewards: formattedRewards
      });
    } catch (error) {
      console.error('Error al obtener recompensas:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al obtener las recompensas',
        error: (error as Error).message
      });
    }
  }

  // POST: Crear una nueva recompensa
  if (req.method === 'POST') {
    try {
      const { 
        name, 
        description, 
        points, 
        imageUrl, 
        available: requestAvailable = true, 
        category, 
        stock = 0,
        canjeoMultiple = false,
        expiracionActiva = false,
        duracionMeses = 1,
        barcodes = []
      } = req.body;
      
      // Si el stock es 0, la recompensa no debe estar disponible
      const available = stock === 0 ? false : requestAvailable;

      // Validar datos obligatorios
      if (!name || !points === undefined || !category) {
        return res.status(400).json({
          success: false,
          message: 'Faltan campos obligatorios: nombre, puntos y categoría son requeridos'
        });
      }
      
      // Validar que se haya proporcionado al menos un código de barras
      if (!barcodes || !Array.isArray(barcodes) || barcodes.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Debes añadir al menos un código de barras'
        });
      }

      // Insertar nueva recompensa
      const result = await executeQuery({
        query: `
          INSERT INTO recompensas 
          (nombre, descripcion, puntos, imagen_url, disponible, categoria, stock, canjeo_multiple, expiracion_activa, duracion_meses)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        values: [
          name,
          description || null,
          points,
          imageUrl || null,
          available ? 1 : 0,
          category,
          stock,
          canjeoMultiple ? 1 : 0,
          expiracionActiva ? 1 : 0,
          duracionMeses || 1
        ]
      });

      const rewardId = (result as any).insertId;

      // Insertar códigos de barras si se proporcionaron
      
      const savedBarcodes = [];

      if (barcodes && Array.isArray(barcodes) && barcodes.length > 0) {
        for (const barcode of barcodes) {
          try {
            // Verificar que el código no exista ya
            const existingCode = await executeQuery({
              query: 'SELECT id FROM codigos_barras WHERE codigo = ?',
              values: [barcode.codigo]
            }) as any[];

            if (existingCode.length === 0) {
              const barcodeResult = await executeQuery({
                query: 'INSERT INTO codigos_barras (recompensa_id, codigo, descripcion) VALUES (?, ?, ?)',
                values: [rewardId, barcode.codigo, barcode.descripcion || '']
              }) as any;

              savedBarcodes.push({
                id: barcodeResult.insertId,
                codigo: barcode.codigo,
                descripcion: barcode.descripcion || ''
              });
            }
          } catch (error) {
            console.error('Error al insertar código de barras:', error);
            // Continuar con el siguiente código aunque haya error
          }
        }
      }

      // Registrar la acción en logs_rewards en lugar de logs_admin
      await executeQuery({
        query: `
          INSERT INTO logs_rewards 
          (user_id, action, reward_id, details, created_at) 
          VALUES (?, 'create', ?, ?, NOW())
        `,
        values: [
          req.user?.userId || 0,
          rewardId,
          JSON.stringify({
            name,
            points,
            category,
            expiracionActiva,
            duracionMeses,
            barcodesCount: savedBarcodes.length
          })
        ]
      });

      return res.status(201).json({
        success: true,
        message: 'Recompensa creada correctamente',
        reward: {
          id: rewardId,
          name,
          description,
          points,
          imageUrl,
          available,
          category,
          stock,
          canjeoMultiple,
          expiracionActiva,
          duracionMeses,
          barcodes: savedBarcodes,
          createdAt: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error al crear recompensa:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al crear la recompensa',
        error: (error as Error).message
      });
    }
  }

  return res.status(405).json({
    success: false,
    message: 'Método no permitido'
  });
}

export default withAuth(adminRewardsHandler);
