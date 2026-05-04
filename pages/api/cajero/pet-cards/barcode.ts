import { NextApiRequest, NextApiResponse } from 'next';
import executeQuery from '@/lib/db';
import { withAuth, AuthenticatedRequest } from '@/middleware/authMiddleware';

/**
 * API para buscar carnets de un usuario por código de barras
 * GET /api/cajero/pet-cards/barcode?userId=xxx&codigoBarras=yyy&includeCompleted=true|false
 * Busca carnets del usuario que tengan el código de barras indicado
 * Si includeCompleted es true, incluye también los carnets completados
 */
async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      message: 'Método no permitido'
    });
  }

  try {
    const userRole = await req.user?.getRole();
    if (userRole !== "administrador" && userRole !== "admin" && userRole !== "cajero") {
      return res.status(403).json({
        success: false,
        message: "No tienes permiso para acceder a esta funcionalidad",
      });
    }

    const { userId, codigoBarras, includeCompleted } = req.query;
    
    if (!userId || isNaN(Number(userId))) {
      return res.status(400).json({
        success: false,
        message: 'ID de usuario no válido'
      });
    }

    if (!codigoBarras || typeof codigoBarras !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Código de barras no proporcionado'
      });
    }

    const includeCompletedFlag = includeCompleted === 'true';
    const now = new Date();

    // Construir la consulta según si incluimos completados o no
    let query = `
      SELECT pc.*, 
             (SELECT cs.valor FROM config_default_puntos cs WHERE cs.clave = 'sellos_requeridos_carnet') as sellos_requeridos
      FROM pet_cards pc
      WHERE pc.userId = ? 
        AND pc.codigo_barras = ?
    `;
    
    // Si no incluimos completados, filtrar solo los no completados
    if (!includeCompletedFlag) {
      query += ' AND pc.completed = 0';
    }
    
    query += ' ORDER BY pc.completed ASC, pc.createdAt DESC';

    const petCardsResult = await executeQuery({
      query: query,
      values: [Number(userId), codigoBarras]
    }) as any[];

    if (!petCardsResult || petCardsResult.length === 0) {
      return res.status(200).json({
        success: true,
        found: false,
        petCards: [],
        message: 'No se encontró ningún carnet con ese código de barras'
      });
    }

    // Verificar si los carnets están caducados (solo para los no completados)
    const petCards = petCardsResult.map(card => {
      let isCardExpired = false;
      
      // Solo verificar caducidad para carnets no completados
      if (!card.completed) {
        // Verificar caducidad por inactividad
        if (card.expirationDate && new Date(card.expirationDate) < now) {
          isCardExpired = true;
        }
        
        // Verificar caducidad por antigüedad máxima
        if (card.createdAt) {
          const maxExpDate = new Date(card.createdAt);
          maxExpDate.setMonth(maxExpDate.getMonth() + 24); // 24 meses por defecto
          if (maxExpDate < now) {
            isCardExpired = true;
          }
        }
      }
      
      return {
        ...card,
        isExpired: isCardExpired
      };
    });

    // Si no incluimos completados, filtrar solo los carnets no caducados
    let activePetCards = petCards;
    if (!includeCompletedFlag) {
      activePetCards = petCards.filter(card => !card.isExpired);
    }

    return res.status(200).json({
      success: true,
      found: activePetCards.length > 0,
      petCards: activePetCards,
      message: activePetCards.length > 0 
        ? `Se encontró ${activePetCards.length} carnet(es) con ese código de barras`
        : 'No se encontró ningún carnet activo con ese código de barras'
    });

  } catch (error) {
    console.error('Error al buscar carnet por código de barras:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
}

export default withAuth(handler);
