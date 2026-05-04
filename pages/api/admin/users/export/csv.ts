import { NextApiResponse } from "next";
import { withAuth, AuthenticatedRequest } from "@/middleware/authMiddleware";
import { getExportData } from "./index";
import executeQuery from "@/lib/db";

async function exportCsvHandler(req: AuthenticatedRequest, res: NextApiResponse) {
  try {
    // Validate that user exists first
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Usuario no autenticado",
      });
    }
    
    const userRole = await req.user.getRole();
    if (userRole !== "administrador" && userRole !== "admin") {
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

    try {
      const userData = await getExportData(req);
      
      if (!userData || !userData.length) {
        return res.status(404).json({
          success: false,
          message: "No se encontraron usuarios para exportar",
        });
      }

      const headers = [
        "ID", "Nombre", "Apellidos", "Email", "Teléfono", 
        "Fecha Nacimiento", "Puntos", "Rol", "Estado", 
        "Fecha Registro", "País", "Ciudad", "Código Postal"
      ];

      const rows = userData.map(user => [
        user.id,
        user.firstName || "",
        user.lastName || "",
        user.email || "",
        user.phone || "",
        user.birthDate ? new Date(user.birthDate).toLocaleDateString() : "",
        user.points || 0,
        user.role || "",
        user.status ? "Activo" : "Inactivo",
        user.registrationDate ? new Date(user.registrationDate).toLocaleDateString() : "",
        user.country || "",
        user.city || "",
        user.postalCode || ""
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map(row => row.map(cell => 
          typeof cell === 'string' && (cell.includes(",") || cell.includes("\"") || cell.includes("\n")) 
            ? `"${cell.replace(/"/g, '""')}"`
            : cell
        ).join(","))
      ].join("\n");
      
      try {
        await executeQuery({
          query: `
            INSERT INTO logs_export (
              user_id, export_type, format, filters, record_count, ip_address, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, NOW())
          `,
          values: [
            req.user.userId, // We can safely use this now since we validated req.user exists
            'users',
            'csv',
            JSON.stringify(req.query),
            userData.length,
            req.socket.remoteAddress || ''
          ]
        });
      } catch (logError) {
        // Continuamos a pesar del error para no interrumpir la exportación
      }
      
      const timestamp = new Date().toISOString().replace(/[^0-9]/g, "").slice(0, 14);
      const filename = `usuarios_${timestamp}.csv`;

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
      
      res.status(200).send(csvContent);
    } catch (exportError) {
      return res.status(500).json({
        success: false,
        message: "Error al obtener datos para exportación",
        error: (exportError as Error).message,
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error al exportar a CSV",
      error: (error as Error).message,
    });
  }
}

export default withAuth(exportCsvHandler);
