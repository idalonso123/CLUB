import { NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '@/middleware/authMiddleware';
import executeQuery from '@/lib/db';

async function userStatusHandler(req: AuthenticatedRequest, res: NextApiResponse) {
  // Verificar que el usuario sea administrador usando getRole()
  const userRole = await req.user?.getRole();
  if (userRole !== 'administrador' && userRole !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'No tienes permiso para acceder a esta funcionalidad'
    });
  }

  // Solo permitir método PATCH
  if (req.method !== 'PATCH') {
    return res.status(405).json({
      success: false,
      message: 'Método no permitido'
    });
  }

  // Obtener ID del usuario
  const { id } = req.query;
  
  if (!id || Array.isArray(id)) {
    return res.status(400).json({
      success: false,
      message: 'ID de usuario no válido'
    });
  }

  try {
    // Obtener el estado actual del usuario para alternarlo
    const userResult = await executeQuery({
      query: 'SELECT status FROM personas WHERE codigo = ?',
      values: [id]
    });
    
    const users = userResult as any[];
    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }
    
    // Alternar estado (si es 1 pasa a 0, si es 0 pasa a 1)
    const currentStatus = users[0].status;
    const newStatus = currentStatus === 1 ? 0 : 1;
    
    // Iniciar transacción
    await executeQuery({ query: 'START TRANSACTION' });
    
    try {
      // Actualizar estado en la base de datos
      await executeQuery({
        query: 'UPDATE personas SET status = ? WHERE codigo = ?',
        values: [newStatus, id]
      });
      
      // Registrar acción en logs_admin
      const actionType = newStatus === 1 ? 'activar_cuenta' : 'desactivar_cuenta';
      await executeQuery({
        query: `
          INSERT INTO logs_admin 
          (admin_id, action, entity_type, entity_id, details, created_at) 
          VALUES (?, ?, ?, ?, ?, NOW())
        `,
        values: [
          req.user?.userId || 0,
          'status_change',
          'user',
          id,
          JSON.stringify({
            previousStatus: currentStatus,
            newStatus: newStatus,
            action: actionType
          })
        ]
      });
      
      // Confirmar transacción
      await executeQuery({ query: 'COMMIT' });
      
      return res.status(200).json({
        success: true,
        message: newStatus === 1 ? 'Cuenta activada correctamente' : 'Cuenta desactivada correctamente',
        status: newStatus,        // Valor numérico (0 o 1) 
        enabled: newStatus === 1  // Valor booleano (true o false)
      });
    } catch (error) {
      // Revertir cambios en caso de error
      await executeQuery({ query: 'ROLLBACK' });
      throw error;
    }
  } catch (error) {
    console.error('Error al cambiar estado de cuenta:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al cambiar el estado de la cuenta',
      error: (error as Error).message
    });
  }
}

export default withAuth(userStatusHandler);