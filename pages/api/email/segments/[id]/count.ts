import type { NextApiRequest, NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '@/middleware/authMiddleware';
import executeQuery from '@/lib/db';
import { buildSegmentCountQuery, getFilterPreview, EmailSegmentFilters } from '@/lib/segmentUtils';

interface EmailSegment {
  id: number;
  name: string;
  description: string | null;
  criteria: string;
  is_active: boolean;
  created_by: number | null;
  created_at: string;
  updated_at: string;
}

interface ApiResponse {
  success: boolean;
  count?: number;
  preview?: string;
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

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Método no permitido' });
  }

  try {
    const { id } = req.query;
    const segmentId = parseInt(id as string, 10);

    if (isNaN(segmentId)) {
      return res.status(400).json({ success: false, error: 'ID de segmento inválido' });
    }

    // Obtener el segmento
    const segments = await executeQuery({
      query: 'SELECT * FROM email_segments WHERE id = ?',
      values: [segmentId]
    }) as EmailSegment[];

    if (!segments || segments.length === 0) {
      return res.status(404).json({ success: false, error: 'Segmento no encontrado' });
    }

    const segment = segments[0];

    // Parsear los criterios del segmento
    let filters: EmailSegmentFilters;
    try {
      filters = typeof segment.criteria === 'string' 
        ? JSON.parse(segment.criteria) 
        : segment.criteria;
    } catch (parseError) {
      console.error('Error al parsear criterios del segmento:', parseError);
      return res.status(500).json({ success: false, error: 'Error al leer los filtros del segmento' });
    }

    // Generar previsualización de filtros
    const preview = getFilterPreview(filters);

    // Construir la consulta de conteo
    const { query, params } = buildSegmentCountQuery(filters);

    // Ejecutar consulta para obtener el conteo
    const countResult = await executeQuery({
      query,
      values: params
    }) as [{ total: number }];

    const count = countResult[0]?.total || 0;

    return res.status(200).json({
      success: true,
      count,
      preview,
      segment
    });

  } catch (error: any) {
    console.error('Error al contar usuarios del segmento:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

export default withAuth(handler);
