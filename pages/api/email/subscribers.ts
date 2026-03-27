import type { NextApiRequest, NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '@/middleware/authMiddleware';
import executeQuery from '../../../lib/db';

interface EmailSubscriber {
  id: number;
  email: string;
  name: string | null;
  user_id: number | null;
  status: 'active' | 'unsubscribed' | 'bounced';
  subscribed_at: string;
  unsubscribed_at: string | null;
}

interface ApiResponse {
  success: boolean;
  data?: EmailSubscriber[] | any;
  subscriber?: EmailSubscriber;
  error?: string;
  count?: number;
}

async function handler(
  req: AuthenticatedRequest,
  res: NextApiResponse<ApiResponse>
) {
  const userRole = await req.user?.getRole();
  if (userRole !== 'administrador' && userRole !== 'admin') {
    return res.status(403).json({ success: false, error: 'No autorizado' });
  }

  if (req.method === 'GET') {
    try {
      const { status, limit = 100, offset = 0 } = req.query;

      let query = 'SELECT * FROM email_subscribers WHERE 1=1';
      const params: any[] = [];

      if (status) {
        query += ' AND status = ?';
        params.push(status);
      }

      query += ' ORDER BY subscribed_at DESC LIMIT ? OFFSET ?';
      params.push(Number(limit), Number(offset));

      const subscribers = await executeQuery({ query, values: params });

      const countQuery = 'SELECT COUNT(*) as count FROM email_subscribers';
      const countResult = await executeQuery({ query: countQuery });
      const total = (countResult as any[])[0].count;

      return res.status(200).json({
        success: true,
        data: subscribers as EmailSubscriber[],
        count: total
      });
    } catch (error: any) {
      console.error('Error al obtener suscriptores:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  if (req.method === 'POST') {
    try {
      const { email, name, user_id } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          error: 'El email es requerido'
        });
      }

      const query = `
        INSERT INTO email_subscribers (email, name, user_id, status)
        VALUES (?, ?, ?, 'active')
        ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        status = 'active',
        unsubscribed_at = NULL
      `;

      await executeQuery({
        query,
        values: [email, name || null, user_id || null]
      });

      return res.status(201).json({
        success: true,
        data: {
          email,
          name,
          status: 'active'
        }
      });
    } catch (error: any) {
      console.error('Error al crear suscriptor:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  return res.status(405).json({ success: false, error: 'Método no permitido' });
}

export default withAuth(handler);
