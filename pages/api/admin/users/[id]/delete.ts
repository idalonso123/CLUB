import { NextApiResponse } from "next";
import { withAuth, AuthenticatedRequest } from "@/middleware/authMiddleware";
import executeQuery from "@/lib/db";
import { promises as fs } from 'fs';
import path from 'path';

async function deleteUserHandler(req: AuthenticatedRequest, res: NextApiResponse) {
  // Verificar que el usuario sea administrador usando getRole()
  const userRole = await req.user?.getRole();
  if (userRole !== "administrador" && userRole !== "admin") {
    return res.status(403).json({
      success: false,
      message: "No tienes permiso para acceder a esta funcionalidad",
    });
  }

  // Solo permitir método DELETE
  if (req.method !== "DELETE") {
    return res.status(405).json({
      success: false,
      message: "Método no permitido",
    });
  }

  // Obtener ID del usuario
  const { id } = req.query;

  if (!id || Array.isArray(id)) {
    return res.status(400).json({
      success: false,
      message: "ID de usuario no válido",
    });
  }

  try {
    // Verificar si el usuario existe y obtener la URL de la foto antes de eliminarlo
    const checkUserResult = await executeQuery({
      query: "SELECT codigo, foto_url FROM personas WHERE codigo = ?",
      values: [id],
    });

    if ((checkUserResult as any[]).length === 0) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado",
      });
    }
    
    // Obtener la URL de la foto del usuario si existe
    const userPhotoUrl = (checkUserResult as any[])[0]?.foto_url;

    // Iniciar transacción
    await executeQuery({ query: "START TRANSACTION" });

    try {
      // Eliminar registros de la tabla propiedades
      try {
        await executeQuery({
          query: "DELETE FROM propiedades WHERE codigo = ?",
          values: [id],
        });
      } catch (error) {
        console.error(
          "No se pudo eliminar registros de propiedades. La tabla puede no existir o no hay registros."
        );
      }

      // Eliminar direcciones
      try {
        await executeQuery({
          query: "DELETE FROM direcciones WHERE codigo = ?",
          values: [id],
        });
      } catch (error) {
        console.error(
          "No se pudo eliminar registros de direcciones. La tabla puede no existir o no hay registros."
        );
      }

      // Eliminar persona (Esto elimina todo el usuario)
      try {
        await executeQuery({
          query: "DELETE FROM personas WHERE codigo = ?",
          values: [id],
        });
      } catch (error) {
        console.error(
          "No se pudo eliminar el usuario. Posible error de restricción de clave foránea."
        );
        throw error; // Re-lanzamos el error para que se ejecute el ROLLBACK
      }

      // Confirmar transacción
      await executeQuery({ query: "COMMIT" });

      // Eliminar la imagen de perfil si existe
      if (userPhotoUrl && userPhotoUrl !== '/default-avatar.jpg') {
        try {
          // Construir la ruta completa del archivo
          const filePath = path.join(process.cwd(), 'public', userPhotoUrl.replace(/^\//, ''));
          console.log('Intentando eliminar archivo de imagen:', filePath);
          
          // Verificar si el archivo existe
          await fs.access(filePath);
          
          // Eliminar el archivo
          await fs.unlink(filePath);
          console.log('Archivo de imagen eliminado correctamente:', userPhotoUrl);
        } catch (fileError) {
          // No interrumpir el flujo si hay un error al eliminar el archivo
          console.error('Error al eliminar la imagen de perfil:', fileError);
        }
      }

      // Guardar registro de actividad administrativa
      try {
        // Verificar que req.user existe antes de acceder a sus propiedades
        if (req.user) {
          await executeQuery({
            query: `
              INSERT INTO logs_admin (admin_id, action, entity_type, entity_id, details, created_at)
              VALUES (?, 'delete', 'user', ?, ?, NOW())
            `,
            values: [
              req.user.userId, 
              id,
              JSON.stringify({
                action: "Usuario eliminado",
                adminUser: req.user.email
              })
            ]
          });
        } else {
          console.warn("No se pudo registrar el log administrativo: req.user es undefined");
        }
      } catch (logError) {
        console.error("Error al registrar log administrativo:", logError);
        // No interrumpimos el flujo por un error en el log
      }

      return res.status(200).json({
        success: true,
        message: "Usuario eliminado correctamente",
        deletedId: id,
      });
    } catch (error) {
      // Rollback en caso de error
      await executeQuery({ query: "ROLLBACK" });
      throw error;
    }
  } catch (error) {
    console.error("Error al eliminar usuario:", error);
    return res.status(500).json({
      success: false,
      message: "Error al eliminar el usuario",
      error: (error as Error).message,
    });
  }
}

export default withAuth(deleteUserHandler);