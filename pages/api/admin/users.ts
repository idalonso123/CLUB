import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '@/middleware/authMiddleware';
import executeQuery from '@/lib/db';

/**
 * Configuración de paginación
 */
const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 100;

/**
 * Obtener parámetro de paginación de la solicitud
 */
function getPaginationParams(req: NextApiRequest): { page: number; limit: number; offset: number } {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(req.query.limit as string) || DEFAULT_PAGE_SIZE));
  const offset = (page - 1) * limit;
  
  return { page, limit, offset };
}

/**
 * Formatear usuario con campos booleanos
 */
function formatUser(user: any) {
  return {
    ...user,
    status: user.status === 1,
    enabled: user.status === 1,
    emailSubscribed: user.emailSubscribed === true || user.emailSubscribed === 1
  };
}

async function usersHandler(req: AuthenticatedRequest, res: NextApiResponse) {
  // Verificar que el usuario sea administrador usando getRole()
  const userRole = await req.user?.getRole();
  if (userRole !== 'administrador' && userRole !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'No tienes permiso para acceder a esta funcionalidad'
    });
  }

  // GET: Obtener lista de usuarios con paginación
  if (req.method === 'GET') {
    try {
      const { page, limit, offset } = getPaginationParams(req);
      
      // Consulta para obtener el total de usuarios
      const countResult = await executeQuery({
        query: 'SELECT COUNT(*) as total FROM personas',
        values: []
      });
      
      const totalUsers = (countResult as any[])[0]?.total || 0;
      const totalPages = Math.ceil(totalUsers / limit);
      
      // Consulta paginada para obtener usuarios
      const usersResult = await executeQuery({
        query: `
          SELECT 
            p.codigo as id,
            p.cif,
            p.nombres as firstName,
            p.apellidos as lastName,
            CONCAT(p.nombres, ' ', p.apellidos) as nombre,
            p.mail as email,
            p.telefono as phone,
            p.fecha_nacimiento as birthDate,
            p.puntos as points,
            p.foto_url as photoUrl,
            p.rol as role,
            p.status,
            p.creado_en as registrationDate,
            d.pais as country,
            d.ciudad as city,
            d.provincia as province,
            d.codpostal as postalCode,
            CASE 
              WHEN es.status = 'active' THEN true 
              ELSE false 
            END as emailSubscribed
          FROM personas p
          LEFT JOIN direcciones d ON p.codigo = d.codigo
          LEFT JOIN email_subscribers es ON p.mail = es.email
          ORDER BY p.codigo DESC
          LIMIT ? OFFSET ?
        `,
        values: [limit, offset]
      });
      
      // Formatear usuarios con campos booleanos
      const formattedUsers = (usersResult as any[]).map(formatUser);

      // Configurar headers de caché
      res.setHeader('Cache-Control', 'private, max-age=60');
      
      return res.status(200).json({
        success: true,
        users: formattedUsers,
        pagination: {
          page,
          limit,
          offset,
          total: totalUsers,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      });
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al obtener la lista de usuarios',
        error: (error as Error).message
      });
    }
  }

  // POST: Crear nuevo usuario (si necesitas esta funcionalidad)
  if (req.method === 'POST') {
    // Implementar la lógica para crear usuarios si es necesario
  }

  // Método no permitido
  return res.status(405).json({
    success: false,
    message: 'Método no permitido'
  });
}

export default withAuth(usersHandler);