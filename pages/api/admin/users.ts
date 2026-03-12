import { NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '@/middleware/authMiddleware';
import executeQuery from '@/lib/db';

async function usersHandler(req: AuthenticatedRequest, res: NextApiResponse) {
  // Verificar que el usuario sea administrador usando getRole()
  const userRole = await req.user?.getRole();
  if (userRole !== 'administrador' && userRole !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'No tienes permiso para acceder a esta funcionalidad'
    });
  }

  // GET: Obtener lista de usuarios
  if (req.method === 'GET') {
    try {
      const usersResult = await executeQuery({
        query: `
          SELECT 
            p.codigo as id,
            p.cif,
            p.nombres as firstName,
            p.apellidos as lastName,
            p.mail as email,
            p.telefono as phone,
            p.fecha_nacimiento as birthDate,
            p.puntos as points,
            p.foto_url as photoUrl,
            p.rol as role,
            p.status,
            p.creado_en as registrationDate,
            d.pais as country,
            d.provincia as city,
            d.codpostal as postalCode
          FROM personas p
          LEFT JOIN direcciones d ON p.codigo = d.codigo
          ORDER BY p.codigo DESC
        `,
        values: []
      });
      
      // Convertir el campo status de numérico (1/0) a booleano (true/false) en todos los usuarios
      const formattedUsers = (usersResult as any[]).map(user => ({
        ...user,
        status: user.status === 1, // 1 = activado (true), 0 = desactivado (false)
        enabled: user.status === 1 // Añadir campo 'enabled' para consistencia con el login
      }));

      return res.status(200).json({
        success: true,
        users: formattedUsers
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