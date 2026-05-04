import type { NextApiRequest, NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '@/middleware/authMiddleware';
import executeQuery from '../../../../../lib/db';

interface ApiResponse {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
}

async function handler(
  req: AuthenticatedRequest,
  res: NextApiResponse<ApiResponse>
) {
  const userRole = await req.user?.getRole();
  if (userRole !== 'administrador' && userRole !== 'admin') {
    return res.status(403).json({ success: false, error: 'No autorizado' });
  }

  const { id } = req.query;

  if (!id || isNaN(Number(id))) {
    return res.status(400).json({ success: false, error: 'ID de suscriptor inválido' });
  }

  const subscriberId = Number(id);

  if (req.method === 'PUT') {
    try {
      const { action } = req.body;

      if (action === 'subscribe') {
        // Re-suscribir al usuario
        const query = `
          UPDATE email_subscribers 
          SET status = 'active', unsubscribed_at = NULL
          WHERE id = ?
        `;
        await executeQuery({ query, values: [subscriberId] });

        return res.status(200).json({
          success: true,
          message: 'Usuario suscrito correctamente',
          data: { status: 'active' }
        });
      } else if (action === 'unsubscribe') {
        // Desuscribir completamente al usuario
        const query = `
          UPDATE email_subscribers 
          SET status = 'unsubscribed', unsubscribed_at = NOW()
          WHERE id = ?
        `;
        await executeQuery({ query, values: [subscriberId] });

        return res.status(200).json({
          success: true,
          message: 'Usuario dado de baja completamente',
          data: { status: 'unsubscribed' }
        });
      } else {
        return res.status(400).json({ 
          success: false, 
          error: 'Acción no válida. Use "subscribe" o "unsubscribe"' 
        });
      }
    } catch (error: any) {
      console.error('Error al cambiar estado de suscripción:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  return res.status(405).json({ success: false, error: 'Método no permitido' });
}

export default withAuth(handler);
