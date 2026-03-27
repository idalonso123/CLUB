import type { NextApiRequest, NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '@/middleware/authMiddleware';
import executeQuery from '@/lib/db';
import { buildSegmentCountQuery, buildSegmentQuery, getFilterPreview, EmailSegmentFilters } from '@/lib/segmentUtils';

interface ApiResponse {
  success: boolean;
  count?: number;
  preview?: string;
  sample_users?: any[];
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

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Método no permitido' });
  }

  try {
    const { filters } = req.body;

    if (!filters) {
      return res.status(400).json({ 
        success: false, 
        error: 'Se requieren filtros para previsualizar' 
      });
    }

    // Parsear los filtros
    let parsedFilters: EmailSegmentFilters;
    try {
      parsedFilters = typeof filters === 'string' 
        ? JSON.parse(filters) 
        : filters;
    } catch (parseError) {
      return res.status(400).json({ 
        success: false, 
        error: 'Formato de filtros inválido' 
      });
    }

    // Generar previsualización de filtros
    const preview = getFilterPreview(parsedFilters);

    // Construir la consulta de conteo
    const { query, params } = buildSegmentCountQuery(parsedFilters);

    // Ejecutar consulta para obtener el conteo
    const countResult = await executeQuery({
      query,
      values: params
    }) as [{ total: number }];

    const count = countResult[0]?.total || 0;

    // Si se solicita muestra de usuarios
    const includeSample = req.query.sample === 'true';
    let sampleUsers: any[] | undefined = undefined;

    if (includeSample && count > 0) {
      const { query: sampleQuery, params: sampleParams } = buildSegmentQuery(parsedFilters);
      const sampleResult = await executeQuery({
        query: `${sampleQuery} LIMIT 5`,
        values: sampleParams
      });
      sampleUsers = sampleResult as any[];
    }

    return res.status(200).json({
      success: true,
      count,
      preview,
      sample_users: sampleUsers
    });

  } catch (error: any) {
    console.error('Error al previsualizar segmento:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

export default withAuth(handler);
