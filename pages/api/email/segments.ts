import type { NextApiRequest, NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '@/middleware/authMiddleware';
import executeQuery from '../../../lib/db';

interface EmailSegment {
  id: number;
  name: string;
  description: string | null;
  filters: string;
  query_preview: string | null;
  estimated_count: number;
  is_active: boolean;
  created_by: number | null;
  created_at: string;
  updated_at: string;
}

interface ApiResponse {
  success: boolean;
  data?: EmailSegment[];
  segment?: EmailSegment;
  error?: string;
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
      const { active } = req.query;

      let query = 'SELECT * FROM email_segments WHERE 1=1';
      const params: any[] = [];

      if (active !== undefined) {
        query += ' AND is_active = ?';
        params.push(active === 'true');
      }

      query += ' ORDER BY created_at DESC';

      const segments = await executeQuery({ query, values: params });

      return res.status(200).json({ success: true, data: segments as EmailSegment[] });
    } catch (error: any) {
      console.error('Error al obtener segmentos:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  if (req.method === 'POST') {
    try {
      const { name, description, criteria, is_active = true } = req.body;

      if (!name || !criteria) {
        return res.status(400).json({
          success: false,
          error: 'Faltan campos requeridos: name, criteria'
        });
      }

      const query = `
        INSERT INTO email_segments (name, description, filters, is_active, created_by)
        VALUES (?, ?, ?, ?, ?)
      `;

      const result = await executeQuery({
        query,
        values: [
          name,
          description || null,
          typeof criteria === 'string' ? criteria : JSON.stringify(criteria),
          is_active,
          req.user?.userId
        ]
      });

      const insertResult = result as any;
      const newSegment = await executeQuery({
        query: 'SELECT * FROM email_segments WHERE id = ?',
        values: [insertResult.insertId]
      });

      return res.status(201).json({
        success: true,
        segment: (newSegment as any[])[0] as EmailSegment
      });
    } catch (error: any) {
      console.error('Error al crear segmento:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  return res.status(405).json({ success: false, error: 'Método no permitido' });
}

export default withAuth(handler);
