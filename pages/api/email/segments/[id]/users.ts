import type { NextApiRequest, NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '@/middleware/authMiddleware';
import executeQuery from '@/lib/db';
import { buildSegmentQuery, buildSegmentCountQuery, EmailSegmentFilters } from '@/lib/segmentUtils';

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

interface UserResult {
  codigo: number;
  cif: string;
  apellidos: string | null;
  nombres: string | null;
  fecha_nacimiento: Date | null;
  mail: string | null;
  telefono: string | null;
  puntos: number;
  rol: string;
  creado_en: Date;
  status: number;
}

interface ApiResponse {
  success: boolean;
  users?: UserResult[];
  total?: number;
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

    // Parsear los criterios del segmento - intentar primero 'filters', luego 'criteria'
    const criteriaData = (segment as any).filters || (segment as any).criteria;
    
    if (!criteriaData) {
      console.error('No se encontraron criterios en el segmento');
      return res.status(500).json({ success: false, error: 'El segmento no tiene filtros definidos' });
    }

    let filters: EmailSegmentFilters;
    try {
      filters = typeof criteriaData === 'string' 
        ? JSON.parse(criteriaData) 
        : criteriaData;
    } catch (parseError) {
      console.error('Error al parsear criterios del segmento:', parseError);
      return res.status(500).json({ success: false, error: 'Error al leer los filtros del segmento' });
    }

    // Verificar que los filtros se parsearon correctamente
    if (!filters || typeof filters !== 'object') {
      console.error('Los criterios del segmento no son válidos:', criteriaData);
      return res.status(500).json({ success: false, error: 'Los filtros del segmento están corruptos' });
    }

    // Obtener parámetros de paginación
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 100;
    const offset = (page - 1) * limit;

    // Construir la consulta dinámica
    const { query, params } = buildSegmentQuery(filters);
    
    // Añadir paginación
    const paginatedQuery = `${query}\nLIMIT ? OFFSET ?`;
    const paginatedParams = [...params, limit, offset];

    // Ejecutar consulta para obtener usuarios
    const users = await executeQuery({
      query: paginatedQuery,
      values: paginatedParams
    }) as UserResult[];

    // Obtener el total de usuarios que coinciden con los filtros
    const { query: countQuery, params: countParams } = buildSegmentCountQuery(filters);
    const countResult = await executeQuery({
      query: countQuery,
      values: countParams
    }) as [{ total: number }];

    const total = countResult[0]?.total || 0;

    return res.status(200).json({
      success: true,
      users,
      total,
      segment
    });

  } catch (error: any) {
    console.error('Error al obtener usuarios del segmento:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

export default withAuth(handler);
