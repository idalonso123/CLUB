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
          tipo_recompensa AS tipoRecompensa,
          imagen_url AS imageUrl,
          disponible AS available,
          categoria AS category,
          stock,
          canjeo_multiple AS canjeoMultiple,
          expiracion_activa AS expiracionActiva,
          duracion_meses AS duracionMeses,
          cooldown_horas AS cooldownHoras,
          cooldown_mode AS cooldownMode,
          fecha_creacion AS createdAt,
          fecha_modificacion AS updatedAt
        FROM recompensas
        ORDER BY id DESC
      `;

      const rewards = await executeQuery({
        query,
        values: []
      });

      // Obtener todos los códigos de barras
      const barcodesQuery = `
        SELECT id, recompensa_id AS rewardId, codigo, descripcion
        FROM codigos_barras
      `;
      
      const allBarcodes = await executeQuery({
        query: barcodesQuery,
        values: []
      }) as any[];
      
      // Crear un mapa de códigos de barras por recompensa_id
      const barcodesMap: Record<number, any[]> = {};
      (allBarcodes as any[]).forEach(bc => {
        const rid = bc.rewardId;
        if (!barcodesMap[rid]) {
          barcodesMap[rid] = [];
        }
        barcodesMap[rid].push({
          id: bc.id,
          codigo: bc.codigo,
          descripcion: bc.descripcion
        });
      });

      // Formatear respuesta
      const formattedRewards = (rewards as any[]).map(reward => {
        // Determinar el cooldownMode basado en el cooldownHoras
        let cooldownMode = '24_hours';
        if (reward.cooldownHoras === 0) {
          cooldownMode = 'same_day';
        } else if (reward.cooldownHoras === 24) {
          cooldownMode = '24_hours';
        } else {
          cooldownMode = 'custom';
        }
        
        return {
          id: reward.id,
          name: reward.name,
          description: reward.description,
          points: reward.points,
          tipoRecompensa: reward.tipoRecompensa || 'puntos',
          imageUrl: reward.imageUrl,
          available: reward.available === 1,
          category: reward.category,
          stock: reward.stock,
          canjeoMultiple: reward.canjeoMultiple === 1,
          expiracionActiva: reward.expiracionActiva === 1,
          duracionMeses: reward.duracionMeses,
          cooldownHoras: reward.cooldownHoras || 24,
          cooldownMode: cooldownMode,
          createdAt: reward.createdAt ? new Date(reward.createdAt).toISOString() : null,
          updatedAt: reward.updatedAt ? new Date(reward.updatedAt).toISOString() : null,
          barcodes: barcodesMap[reward.id] || []
        };
      });

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
        tipoRecompensa = 'puntos',
        imageUrl, 
        available: requestAvailable = true, 
        category, 
        stock = 0,
        canjeoMultiple = false,
        expiracionActiva = false,
        duracionMeses = 1,
        cooldownHoras: requestCooldownHoras = 24,
        cooldownMode = '24_hours',
        barcodes = []
      } = req.body;
      
      // Calcular cooldownHoras basado en el modo seleccionado
      let cooldownHoras = requestCooldownHoras;
      if (cooldownMode === 'same_day') {
        cooldownHoras = 0;
      } else if (cooldownMode === '24_hours') {
        cooldownHoras = 24;
      }
      // Para 'custom', usar el valor proporcionado en requestCooldownHoras
      
      // Si el stock es 0, la recompensa no debe estar disponible
      const available = stock === 0 ? false : requestAvailable;

      // Validar datos obligatorios
      // Para recompensas de tipo 'carnet', points puede ser 0
      if (!name || (!points && tipoRecompensa !== 'carnet') || !category) {
        return res.status(400).json({
          success: false,
          message: tipoRecompensa === 'carnet' 
            ? 'Faltan campos obligatorios: nombre y categoría son requeridos para recompensas de carnet'
            : 'Faltan campos obligatorios: nombre, puntos y categoría son requeridos'
        });
      }
      
      // Validar que se haya proporcionado al menos un código de barras
      if (!barcodes || !Array.isArray(barcodes) || barcodes.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Debes añadir al menos un código de barras'
        });
      }

      console.log('=== DEBUG: Creando recompensa ===');
      console.log('Datos recibidos:', JSON.stringify({ name, points, category, barcodes, cooldownMode, cooldownHoras }));

      // Insertar nueva recompensa
      const result = await executeQuery({
        query: `
          INSERT INTO recompensas 
          (nombre, descripcion, puntos, tipo_recompensa, imagen_url, disponible, categoria, stock, canjeo_multiple, expiracion_activa, duracion_meses, cooldown_horas, cooldown_mode)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        values: [
          name,
          description || null,
          points || 0,
          tipoRecompensa || 'puntos',
          imageUrl || null,
          available ? 1 : 0,
          category,
          stock,
          canjeoMultiple ? 1 : 0,
          expiracionActiva ? 1 : 0,
          duracionMeses || 1,
          cooldownHoras,
          cooldownMode || '24_hours'
        ]
      });

      const rewardId = (result as any).insertId;
      console.log('Recompensa insertada con ID:', rewardId);

      // Insertar códigos de barras
      const savedBarcodes = [];

      for (const barcode of barcodes) {
        try {
          // Verificar que el código no exista ya para ESTA recompensa específica
          const existingCode = await executeQuery({
            query: 'SELECT id FROM codigos_barras WHERE recompensa_id = ? AND codigo = ?',
            values: [rewardId, barcode.codigo]
          }) as any[];

          if (existingCode.length === 0) {
            const barcodeResult = await executeQuery({
              query: 'INSERT INTO codigos_barras (recompensa_id, codigo, descripcion) VALUES (?, ?, ?)',
              values: [rewardId, barcode.codigo, barcode.descripcion || '']
            }) as any;

            const barcodeId = (barcodeResult as any).insertId;
            console.log('Código de barras insertado:', { id: barcodeId, codigo: barcode.codigo });
            
            savedBarcodes.push({
              id: barcodeId,
              codigo: barcode.codigo,
              descripcion: barcode.descripcion || ''
            });
          } else {
            console.log('Código de barras ya existe para esta recompensa:', barcode.codigo);
          }
        } catch (barcodeError) {
          console.error('Error al insertar código de barras:', barcodeError);
        }
      }

      console.log('Transacción completada. Códigos guardados:', savedBarcodes.length);

      // Registrar la acción en logs_rewards
      // Primero verificar que la tabla existe y tiene el formato correcto
      try {
        // Intentar insertar log solo si hay un user_id válido
        if (req.user?.userId) {
          await executeQuery({
            query: `
              INSERT INTO logs_rewards 
              (user_id, action, reward_id, details, created_at) 
              VALUES (?, 'create', ?, ?, NOW())
            `,
            values: [
              req.user.userId,
              rewardId,
              JSON.stringify({
                name,
                points,
                category,
                barcodesCount: savedBarcodes.length
              })
            ]
          });
        }
      } catch (logError) {
        console.error('Error al insertar log (no crítico):', logError);
        // No fallar la operación si el log falla
      }

      return res.status(201).json({
        success: true,
        message: 'Recompensa creada correctamente',
        reward: {
          id: rewardId,
          name,
          description,
          points: points || 0,
          tipoRecompensa: tipoRecompensa || 'puntos',
          imageUrl,
          available,
          category,
          stock,
          canjeoMultiple,
          expiracionActiva,
          duracionMeses,
          cooldownHoras,
          cooldownMode,
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
