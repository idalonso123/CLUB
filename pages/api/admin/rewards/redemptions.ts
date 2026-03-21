import { NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '@/middleware/authMiddleware';
import executeQuery from '@/lib/db';

async function redemptionsHandler(req: AuthenticatedRequest, res: NextApiResponse) {
  // Verificar que el usuario sea administrador
  const userRole = await req.user?.getRole();
  if (userRole !== 'administrador' && userRole !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'No tienes permiso para acceder a esta funcionalidad'
    });
  }

  // Solo permitir GET para listar canjes
  if (req.method === 'GET') {
    try {
      // Verificar si solo se quiere el conteo
      const countOnly = req.query.countOnly === 'true';
      
      // Filtros opcionales
      const status = req.query.status as string;
      const userId = req.query.userId as string;
      const rewardId = req.query.rewardId as string;
      
      // Parámetros de paginación y filtrado (solo si no es countOnly)
      const page = countOnly ? 1 : (parseInt(req.query.page as string) || 1);
      const limit = countOnly ? 1 : Math.min(parseInt(req.query.limit as string) || 20, 100);
      const offset = (page - 1) * limit;
      
      // Construir la consulta base
      let query = `
        SELECT 
          cr.id,
          cr.persona_id AS userId,
          CONCAT(p.nombres, ' ', p.apellidos) AS userName,
          p.mail AS userEmail,
          cr.recompensa_id AS rewardId,
          r.nombre AS rewardName,
          r.categoria AS rewardCategory,
          cr.puntos_canjeados AS pointsSpent,
          cr.estado AS status,
          cr.direccion_envio AS shippingAddress,
          cr.notas AS notes,
          cr.fecha_canje AS redemptionDate
        FROM canjes_recompensas cr
        JOIN personas p ON cr.persona_id = p.codigo
        JOIN recompensas r ON cr.recompensa_id = r.id
        WHERE 1=1
      `;

      // Array para los valores de parámetros
      const queryParams: any[] = [];

      // Añadir filtros si se proporcionan
      if (status) {
        query += ' AND cr.estado = ?';
        queryParams.push(status);
      }

      if (userId) {
        query += ' AND cr.persona_id = ?';
        queryParams.push(userId);
      }

      if (rewardId) {
        query += ' AND cr.recompensa_id = ?';
        queryParams.push(rewardId);
      }

      // Añadir ordenación
      query += ' ORDER BY cr.fecha_canje DESC';

      // Contar el total de registros para paginación
      const countQuery = `
        SELECT COUNT(*) as total FROM canjes_recompensas cr
        WHERE 1=1
        ${status ? ' AND cr.estado = ?' : ''}
        ${userId ? ' AND cr.persona_id = ?' : ''}
        ${rewardId ? ' AND cr.recompensa_id = ?' : ''}
      `;

      const countResult = await executeQuery({
        query: countQuery,
        values: [...queryParams]
      });

      const total = (countResult as any[])[0].total;
      
      // Si solo se quiere el conteo, devolver solo el total
      if (countOnly) {
        return res.status(200).json({
          success: true,
          total
        });
      }
      
      const totalPages = Math.ceil(total / limit);

      // Añadir paginación a la consulta principal
      query += ' LIMIT ? OFFSET ?';
      queryParams.push(limit, offset);

      // Ejecutar consulta principal
      const redemptions = await executeQuery({
        query,
        values: queryParams
      });

      return res.status(200).json({
        success: true,
        redemptions,
        pagination: {
          total,
          page,
          limit,
          totalPages
        }
      });
    } catch (error) {
      console.error('Error al obtener canjes:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al obtener los canjes',
        error: (error as Error).message
      });
    }
  }

  return res.status(405).json({
    success: false,
    message: 'Método no permitido'
  });
}

export default withAuth(redemptionsHandler);
