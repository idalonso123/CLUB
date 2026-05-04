import { NextApiRequest, NextApiResponse } from "next";
import executeQuery from "@/lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    // Verificar autenticación
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ success: false, message: "No autenticado" });
    }

    // Verificar que es un cajero
    const userResult = await executeQuery({
      query: `
        SELECT id, mail, role 
        FROM personas 
        WHERE mail = (
          SELECT mail FROM personas WHERE id = (
            SELECT persona_id FROM auth_tokens WHERE token = ?
          )
        )
      `,
      values: [token]
    });
    
    if (!userResult || (Array.isArray(userResult) && userResult.length === 0)) {
      return res.status(401).json({ success: false, message: "Usuario no encontrado" });
    }

    const user = Array.isArray(userResult) ? userResult[0] : userResult;
    if (user.role !== "cajero" && user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Acceso denegado" });
    }

    // Obtener todos los usuarios con sus puntos
    const users = await executeQuery({
      query: `
        SELECT 
          p.id,
          p.nombre AS firstName,
          p.apellidos AS lastName,
          p.mail AS email,
          p.telefono AS phone,
          COALESCE(pp.puntos, 0) AS points
        FROM personas p
        LEFT JOIN puntos_persona pp ON p.id = pp.persona_id
        WHERE p.rol = 'cliente'
          AND p.status = 'active'
        ORDER BY p.nombre, p.apellidos
        LIMIT 500
      `,
      values: []
    });

    return res.status(200).json({
      success: true,
      users: Array.isArray(users) ? users.map((u: any) => ({
        ...u,
        id: u.id ?? u.codigo,
      })) : [],
    });
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    return res.status(500).json({
      success: false,
      message: "Error al obtener usuarios",
    });
  }
}
