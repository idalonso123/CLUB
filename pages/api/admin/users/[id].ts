import { NextApiResponse } from "next";
import { withAuth, AuthenticatedRequest } from "@/middleware/authMiddleware";
import executeQuery from "@/lib/db";

async function getUserHandler(req: AuthenticatedRequest, res: NextApiResponse) {
  // Verificar que el usuario sea administrador usando getRole()
  const userRole = await req.user?.getRole();
  if (userRole !== "administrador" && userRole !== "admin") {
    return res.status(403).json({
      success: false,
      message: "No tienes permiso para acceder a esta funcionalidad",
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

  // Solo permitir método GET
  if (req.method !== "GET") {
    return res.status(405).json({
      success: false,
      message: "Método no permitido",
    });
  }

  try {
    // Consulta para obtener información completa del usuario
    const userResult = await executeQuery({
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
        WHERE p.codigo = ?
      `,
      values: [id],
    });

    const users = userResult as any[];

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado",
      });
    }

    // Convertir el campo status a booleano
    const user = {
      ...users[0],
      status: users[0].status === 1,
      enabled: users[0].status === 1  // Añadir enabled para consistencia
    };

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Error al obtener usuario:", error);
    return res.status(500).json({
      success: false,
      message: "Error al obtener los datos del usuario",
      error: (error as Error).message,
    });
  }
}

export default withAuth(getUserHandler);
