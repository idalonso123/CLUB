import { NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '@/middleware/authMiddleware';
import executeQuery from '@/lib/db';

async function refreshHandler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Método no permitido'
    });
  }

  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    const userResult = await executeQuery({
      query: `
        SELECT 
          p.codigo as id,
          p.nombres as firstName,
          p.apellidos as lastName,
          p.mail as email,
          p.telefono as phone,
          p.foto_url as photoUrl,
          p.rol as role,
          p.status as status
        FROM personas p
        WHERE p.codigo = ?
      `,
      values: [req.user.userId]
    });

    const users = userResult as any[];
    
    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    const user = {
      id: users[0].id,
      firstName: users[0].firstName,
      lastName: users[0].lastName,
      email: users[0].email,
      phone: users[0].phone,
      photoUrl: users[0].photoUrl,
      role: users[0].role,
      enabled: users[0].status === 1
    };

    return res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error al refrescar datos del usuario',
      error: (error as Error).message
    });
  }
}

export default withAuth(refreshHandler);
