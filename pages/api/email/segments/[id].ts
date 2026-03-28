import type { NextApiRequest, NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '@/middleware/authMiddleware';
import executeQuery from '../../../../lib/db';

interface EmailSegment {
  id: number;
  name: string;
  description: string | null;
  filters?: string;
  criteria?: string;
  is_active: boolean;
  created_by: number | null;
  created_at: string;
  updated_at: string;
}

interface ApiResponse {
  success: boolean;
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

  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const segment = await executeQuery({
        query: 'SELECT * FROM email_segments WHERE id = ?',
        values: [id]
      });

      if ((segment as any[]).length === 0) {
        return res.status(404).json({ success: false, error: 'Segmento no encontrado' });
      }

      return res.status(200).json({
        success: true,
        segment: (segment as any[])[0] as EmailSegment
      });
    } catch (error: any) {
      console.error('Error al obtener segmento:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  if (req.method === 'PUT') {
    try {
      const { name, description, filters, is_active } = req.body;

      // Validación: el nombre es obligatorio
      if (!name || name.trim() === '') {
        return res.status(400).json({
          success: false,
          error: 'El nombre del segmento es obligatorio'
        });
      }

      // Usar 'filters' si viene, o 'criteria' como alternativa (compatibilidad hacia atrás)
      const filterData = filters || (req.body as any).criteria;

      if (!filterData) {
        return res.status(400).json({
          success: false,
          error: 'Se requieren filtros para actualizar el segmento'
        });
      }

      const query = `
        UPDATE email_segments
        SET name = ?, description = ?, filters = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;

      await executeQuery({
        query,
        values: [
          name,
          description || null,
          typeof filterData === 'string' ? filterData : JSON.stringify(filterData),
          is_active ?? true,
          id
        ]
      });

      const updatedSegment = await executeQuery({
        query: 'SELECT * FROM email_segments WHERE id = ?',
        values: [id]
      });

      return res.status(200).json({
        success: true,
        segment: (updatedSegment as any[])[0] as EmailSegment
      });
    } catch (error: any) {
      console.error('Error al actualizar segmento:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  if (req.method === 'DELETE') {
    try {
      // Verificar que el segmento existe antes de eliminar
      const existing = await executeQuery({
        query: 'SELECT * FROM email_segments WHERE id = ?',
        values: [id]
      });

      if ((existing as any[]).length === 0) {
        return res.status(404).json({ success: false, error: 'Segmento no encontrado' });
      }

      await executeQuery({
        query: 'DELETE FROM email_segments WHERE id = ?',
        values: [id]
      });

      return res.status(200).json({ success: true });
    } catch (error: any) {
      console.error('Error al eliminar segmento:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  return res.status(405).json({ success: false, error: 'Método no permitido' });
}

export default withAuth(handler);
