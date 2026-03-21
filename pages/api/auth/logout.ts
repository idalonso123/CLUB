import { NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '@/middleware/authMiddleware';
import * as cookie from 'cookie';
import executeQuery from '@/lib/db';

async function logoutHandler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      message: 'Método no permitido' 
    });
  }

  try {
    // Registrar cierre de sesión en los logs
    if (req.user && req.user.userId) {
      try {
        await executeQuery({
          query: `
            INSERT INTO logs_auth (
              user_id, action, ip_address, user_agent, details, created_at
            ) VALUES (?, ?, ?, ?, ?, NOW())
          `,
          values: [
            req.user.userId,
            'logout',
            req.socket.remoteAddress || '',
            req.headers['user-agent'] || '',
            JSON.stringify({
              status: 'success'
            })
          ]
        });
      } catch (logError) {
        console.error('Error registrando cierre de sesión:', logError);
        // Continuamos a pesar del error para no interrumpir el cierre de sesión
      }
    }

    // Establecer una cookie vacía y expirada para eliminar la token
    res.setHeader('Set-Cookie', cookie.serialize('auth_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      sameSite: 'strict',
      expires: new Date(0), // Fecha en el pasado para invalidar
      path: '/'
    }));

    // Respuesta exitosa
    return res.status(200).json({
      success: true,
      message: 'Sesión cerrada correctamente'
    });
  } catch (error) {
    console.error('Error en logout:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al procesar la solicitud',
      error: (error as Error).message
    });
  }
}

export default withAuth(logoutHandler);