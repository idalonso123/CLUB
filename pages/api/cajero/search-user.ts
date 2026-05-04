import { NextApiResponse } from "next";
import { withAuth, AuthenticatedRequest } from "@/middleware/authMiddleware";
import executeQuery from "@/lib/db";

async function searchUserHandler(req: AuthenticatedRequest, res: NextApiResponse) {
  const userRole = await req.user?.getRole();
  if (userRole !== "administrador" && userRole !== "admin" && userRole !== "cajero") {
    return res.status(403).json({
      success: false,
      message: "No tienes permiso para acceder a esta funcionalidad",
    });
  }

  if (req.method !== "GET") {
    return res.status(405).json({
      success: false,
      message: "Método no permitido",
    });
  }

  const { query = "" } = req.query;

  if (!query || typeof query !== "string" || query.trim() === "") {
    return res.status(400).json({
      success: false,
      message: "Debes proporcionar un término de búsqueda",
    });
  }

  try {
    const searchTerm = `%${query.trim()}%`;
    const users = await executeQuery({
      query: `
        SELECT 
          p.codigo as id,
          p.nombres as firstName,
          p.apellidos as lastName,
          p.dni as dni,
          p.mail as email,
          p.telefono as phone,
          IFNULL(p.puntos, 0) as points
        FROM personas p
        WHERE 
          p.nombres LIKE ? OR
          p.apellidos LIKE ? OR
          p.dni LIKE ? OR
          p.mail LIKE ? OR
          p.telefono LIKE ?
        LIMIT 20
      `,
      values: [searchTerm, searchTerm, searchTerm, searchTerm, searchTerm],
    });

    return res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error al buscar usuarios",
      error: (error as Error).message,
    });
  }
}

export default withAuth(searchUserHandler);
