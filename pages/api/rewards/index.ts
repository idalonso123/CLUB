import { NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '@/middleware/authMiddleware';
import executeQuery from '@/lib/db';

async function rewardsHandler(req: AuthenticatedRequest, res: NextApiResponse) {
  // Verificar que el usuario esté autenticado (middleware withAuth ya lo hace)
  if (!req.user || !req.user.userId) {
    return res.status(401).json({
      success: false,
      message: 'Usuario no autenticado'
    });
  }

  // Solo permitir método GET
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      message: 'Método no permitido'
    });
  }

  try {
    // Parámetros de filtrado opcionales
    const category = req.query.category as string;
    const minPoints = parseInt(req.query.minPoints as string) || 0;
    const maxPoints = parseInt(req.query.maxPoints as string) || 100000;
    const available = req.query.available !== 'false'; // Por defecto, mostrar solo disponibles
    
    // Consultar recompensas disponibles (excluir plantillas de carnet)
    let query = `
      SELECT 
        id,
        nombre AS name,
        descripcion AS description,
        puntos AS points,
        imagen_url AS imageUrl,
        disponible AS available,
        categoria AS category,
        stock,
        canjeo_multiple,
        expiracion_activa,
        duracion_meses,
        fecha_creacion AS createdAt,
        fecha_modificacion AS updatedAt
      FROM recompensas
      WHERE tipo_recompensa != 'carnet' AND 1=1
    `;

    // Array para los parámetros de la consulta
    const queryParams: any[] = [];

    // Añadir filtros si se proporcionan
    if (category) {
      query += ' AND categoria = ?';
      queryParams.push(category);
    }

    if (available) {
      query += ' AND disponible = 1 AND (stock > 0 OR stock = -1)';
    }

    query += ' AND puntos BETWEEN ? AND ?';
    queryParams.push(minPoints, maxPoints);

    // Ordenar por puntos ascendente (más baratos primero)
    query += ' ORDER BY puntos ASC';

    // Ejecutar la consulta
    const rewards = await executeQuery({
      query,
      values: queryParams
    });

    // Obtener las categorías disponibles para el filtro (excluir plantillas de carnet)
    const categoriesQuery = `
      SELECT DISTINCT categoria AS category
      FROM recompensas
      WHERE tipo_recompensa != 'carnet' AND disponible = 1 AND (stock > 0 OR stock = -1)
    `;

    const categories = await executeQuery({
      query: categoriesQuery,
      values: []
    });

    // Verificar las recompensas canjeadas por el usuario
    const userRedemptionsQuery = `
      SELECT recompensa_id
      FROM canjes_recompensas
      WHERE persona_id = ? AND estado != 'cancelado'
    `;

    const userRedemptions = await executeQuery({
      query: userRedemptionsQuery,
      values: [req.user.userId]
    });

    const redeemedIds = (userRedemptions as any[]).map(item => item.recompensa_id);

    // Formatear respuesta para convertir campos booleanos y añadir información de canje
    const formattedRewards = (rewards as any[]).map(reward => ({
      ...reward,
      available: reward.available === 1,
      canjeoMultiple: reward.canjeo_multiple === 1,
      expiracionActiva: reward.expiracion_activa === 1,
      duracionMeses: reward.duracion_meses,
      redeemed: redeemedIds.includes(reward.id)
    }));

    return res.status(200).json({
      success: true,
      rewards: formattedRewards,
      categories: (categories as any[]).map(cat => cat.category)
    });
    
  } catch (error) {
    console.error('Error al obtener recompensas:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener recompensas',
      error: (error as Error).message
    });
  }
}

export default withAuth(rewardsHandler);
