import { NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '@/middleware/authMiddleware';
import executeQuery from '@/lib/db';

async function rewardHandler(req: AuthenticatedRequest, res: NextApiResponse) {
  // Verificar que el usuario sea administrador
  const userRole = await req.user?.getRole();
  if (userRole !== 'administrador' && userRole !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'No tienes permiso para acceder a esta funcionalidad'
    });
  }

  // Obtener ID de la recompensa
  const { id } = req.query;
  
  if (!id || Array.isArray(id)) {
    return res.status(400).json({
      success: false,
      message: 'ID de recompensa no válido'
    });
  }

  // GET: Obtener una recompensa específica
  if (req.method === 'GET') {
    try {
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
          cooldown_horas AS cooldownHoras,
          fecha_creacion AS createdAt,
          fecha_modificacion AS updatedAt
        FROM recompensas
        WHERE id = ?
      `;

      const result = await executeQuery({
        query,
        values: [id]
      });

      const rewards = result as any[];
      
      if (!rewards || rewards.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Recompensa no encontrada'
        });
      }

      // Obtener los códigos de barras asociados a esta recompensa
      const barcodesQuery = `
        SELECT 
          id,
          codigo,
          descripcion
        FROM codigos_barras
        WHERE recompensa_id = ?
        ORDER BY id DESC
      `;

      const barcodesResult = await executeQuery({
        query: barcodesQuery,
        values: [id]
      });

      const barcodes = (barcodesResult as any[]).map(code => ({
        id: code.id,
        codigo: code.codigo,
        descripcion: code.descripcion
      }));

      // Convertir booleanos
      const reward = {
        ...rewards[0],
        available: rewards[0].available === 1,
        canjeoMultiple: rewards[0].canjeoMultiple === 1,
        expiracionActiva: rewards[0].expiracionActiva === 1,
        barcodes: barcodes
      };

      return res.status(200).json({
        success: true,
        reward
      });
    } catch (error) {
      console.error('Error al obtener recompensa:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al obtener la recompensa',
        error: (error as Error).message
      });
    }
  }

  // PUT: Actualizar una recompensa
  else if (req.method === 'PUT') {
    try {
      const { 
        name, 
        description, 
        points, 
        imageUrl, 
        available: requestAvailable, 
        category, 
        stock,
        canjeoMultiple,
        expiracionActiva,
        duracionMeses,
        cooldownHoras,
        barcodes
      } = req.body;
      
      // Crear una variable mutable para available
      let available = requestAvailable;

      // Validar datos obligatorios
      if (!name || points === undefined || !category) {
        return res.status(400).json({
          success: false,
          message: 'Faltan campos obligatorios: nombre, puntos y categoría son requeridos'
        });
      }
      
      // Validar que se mantenga al menos un código de barras
      if (!barcodes || !Array.isArray(barcodes) || barcodes.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Debes mantener al menos un código de barras para la recompensa'
        });
      }

      // Verificar que la recompensa existe y obtener su stock actual
      const checkResult = await executeQuery({
        query: 'SELECT stock, disponible FROM recompensas WHERE id = ?',
        values: [id]
      });

      if ((checkResult as any[]).length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Recompensa no encontrada'
        });
      }
      
      // Obtener el stock actual
      const currentStock = (checkResult as any[])[0].stock;
      
      // Si el stock actual es 0 y se está actualizando a un valor mayor que 0, activar disponibilidad
      if (currentStock === 0 && (stock > 0 || stock === -1)) {
        // Actualizar available a true si se repone el stock
        available = true;
      }

      // Actualizar la recompensa
      await executeQuery({
        query: `
          UPDATE recompensas
          SET nombre = ?,
              descripcion = ?,
              puntos = ?,
              imagen_url = ?,
              disponible = ?,
              categoria = ?,
              stock = ?,
              canjeo_multiple = ?,
              expiracion_activa = ?,
              duracion_meses = ?,
              cooldown_horas = ?,
              fecha_modificacion = NOW()
          WHERE id = ?
        `,
        values: [
          name,
          description || null,
          points,
          imageUrl || null,
          available ? 1 : 0,
          category,
          stock === -1 ? -1 : (stock || 0),
          canjeoMultiple ? 1 : 0,
          expiracionActiva ? 1 : 0,
          duracionMeses || 1,
          cooldownHoras || 24,
          id
        ]
      });

      // Actualizar los códigos de barras si se proporcionaron
      if (barcodes && Array.isArray(barcodes)) {
        // Primero, obtener los códigos actuales para comparar
        const currentBarcodesResult = await executeQuery({
          query: 'SELECT id, codigo FROM codigos_barras WHERE recompensa_id = ?',
          values: [id]
        }) as any[];

        const currentBarcodeIds = currentBarcodesResult.map(b => b.id);
        const currentBarcodeCodes = currentBarcodesResult.map(b => b.codigo);
        
        // Procesar cada código de barras en la solicitud
        for (const barcode of barcodes) {
          if (barcode.id) {
            // Si tiene ID, es un código existente que hay que actualizar
            if (currentBarcodeIds.includes(barcode.id)) {
              await executeQuery({
                query: 'UPDATE codigos_barras SET codigo = ?, descripcion = ? WHERE id = ?',
                values: [barcode.codigo, barcode.descripcion || '', barcode.id]
              });
            }
          } else {
            // Si no tiene ID, es un código nuevo que hay que insertar
            // Verificar que el código no exista ya
            if (!currentBarcodeCodes.includes(barcode.codigo)) {
              await executeQuery({
                query: 'INSERT INTO codigos_barras (recompensa_id, codigo, descripcion) VALUES (?, ?, ?)',
                values: [id, barcode.codigo, barcode.descripcion || '']
              });
            }
          }
        }
        
        // Identificar códigos a eliminar (los que están en la BD pero no en la solicitud)
        const requestedBarcodeIds = barcodes.filter(b => b.id).map(b => b.id);
        const idsToDelete = currentBarcodeIds.filter(id => !requestedBarcodeIds.includes(id));
        
        if (idsToDelete.length > 0) {
          await executeQuery({
            query: `DELETE FROM codigos_barras WHERE id IN (${idsToDelete.map(() => '?').join(',')})`,
            values: idsToDelete
          });
        }
      }

      // Registrar la acción en logs_rewards en lugar de logs_admin
      await executeQuery({
        query: `
          INSERT INTO logs_rewards 
          (user_id, action, reward_id, details, created_at) 
          VALUES (?, 'update', ?, ?, NOW())
        `,
        values: [
          req.user?.userId || 0, // Add null check with fallback to 0
          id,
          JSON.stringify({
            name,
            points,
            available,
            stock,
            canjeoMultiple,
            expiracionActiva,
            duracionMeses,
            cooldownHoras,
            barcodesCount: barcodes?.length || 0
          })
        ]
      });

      return res.status(200).json({
        success: true,
        message: 'Recompensa actualizada correctamente',
        reward: {
          id: parseInt(id),
          name,
          description,
          points,
          imageUrl,
          available: available,
          category,
          stock,
          canjeoMultiple,
          expiracionActiva,
          duracionMeses,
          cooldownHoras,
          barcodes,
          updatedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error al actualizar recompensa:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al actualizar la recompensa',
        error: (error as Error).message
      });
    }
  }

  // DELETE: Eliminar una recompensa
  else if (req.method === 'DELETE') {
    try {
      // Obtener el parámetro forceDelete de la URL
      const forceDelete = req.query.forceDelete === 'true';
      
      // Verificar que la recompensa existe
      const checkResult = await executeQuery({
        query: 'SELECT nombre FROM recompensas WHERE id = ?',
        values: [id]
      });

      const rewards = checkResult as any[];
      
      if (rewards.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Recompensa no encontrada'
        });
      }

      const rewardName = rewards[0].nombre;

      // Verificar si la recompensa ha sido canjeada
      const redemptionsResult = await executeQuery({
        query: 'SELECT COUNT(*) as count FROM canjes_recompensas WHERE recompensa_id = ?',
        values: [id]
      });

      const redemptionsCount = (redemptionsResult as any[])[0].count;

      // Si tiene canjes asociados y no se ha solicitado borrado forzado
      if (redemptionsCount > 0 && !forceDelete) {
        // Verificar si la recompensa tiene stock ilimitado (-1)
        const stockResult = await executeQuery({
          query: 'SELECT stock FROM recompensas WHERE id = ?',
          values: [id]
        });
        
        const currentStock = (stockResult as any[])[0].stock;
        
        // Si ya hay canjes, marcar como no disponible en vez de eliminar
        // Preservar el stock -1 (ilimitado) si ya estaba configurado así
        await executeQuery({
          query: 'UPDATE recompensas SET disponible = 0, stock = ? WHERE id = ?',
          values: [currentStock === -1 ? -1 : 0, id]
        });

        // Registrar la acción en logs_rewards
        await executeQuery({
          query: `
            INSERT INTO logs_rewards 
            (user_id, action, reward_id, details, created_at) 
            VALUES (?, 'disable', ?, ?, NOW())
          `,
          values: [
            req.user?.userId || 0,
            id,
            JSON.stringify({
              name: rewardName,
              reason: 'Intento de eliminación con canjes existentes'
            })
          ]
        });

        return res.status(200).json({
          success: true,
          message: 'La recompensa no puede ser eliminada porque ya ha sido canjeada. Ha sido desactivada en su lugar.',
          disabled: true
        });
      }
      
      // Si se ha solicitado borrado forzado y hay canjes, eliminar los canjes primero
      if (forceDelete && redemptionsCount > 0) {
        // Registrar la acción de eliminación forzada en logs_rewards
        await executeQuery({
          query: `
            INSERT INTO logs_rewards 
            (user_id, action, reward_id, details, created_at) 
            VALUES (?, 'delete', ?, ?, NOW())
          `,
          values: [
            req.user?.userId || 0,
            id,
            JSON.stringify({
              name: rewardName,
              redemptionsCount,
              reason: 'Eliminación forzada con canjes existentes'
            })
          ]
        });
        
        // Eliminar los canjes asociados a la recompensa
        await executeQuery({
          query: 'DELETE FROM canjes_recompensas WHERE recompensa_id = ?',
          values: [id]
        });
      } else {
        // Registrar la acción en logs_rewards ANTES de eliminar la recompensa
        await executeQuery({
          query: `
            INSERT INTO logs_rewards 
            (user_id, action, reward_id, details, created_at) 
            VALUES (?, 'delete', ?, ?, NOW())
          `,
          values: [
            req.user?.userId || 0,
            id,
            JSON.stringify({
              name: rewardName
            })
          ]
        });
      }

      // Eliminar la recompensa después de registrar la acción
      await executeQuery({
        query: 'DELETE FROM recompensas WHERE id = ?',
        values: [id]
      });

      return res.status(200).json({
        success: true,
        message: forceDelete && redemptionsCount > 0 
          ? 'Recompensa y sus canjes asociados eliminados correctamente' 
          : 'Recompensa eliminada correctamente'
      });
    } catch (error) {
      console.error('Error al eliminar recompensa:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al eliminar la recompensa',
        error: (error as Error).message
      });
    }
  }

  return res.status(405).json({
    success: false,
    message: 'Método no permitido'
  });
}

export default withAuth(rewardHandler);
