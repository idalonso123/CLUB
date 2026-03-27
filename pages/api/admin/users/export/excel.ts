import { NextApiResponse } from "next";
import { withAuth, AuthenticatedRequest } from "@/middleware/authMiddleware";
import { getExportData } from "./index";
import executeQuery from "@/lib/db";
import ExcelJS from 'exceljs';

async function exportExcelHandler(req: AuthenticatedRequest, res: NextApiResponse) {
  try {
    // Verificar permisos usando getRole()
    const userRole = await req.user?.getRole();
    if (userRole !== "administrador" && userRole !== "admin") {
      return res.status(403).json({
        success: false,
        message: "No tienes permiso para acceder a esta funcionalidad",
      });
    }

    // Solo permitir método GET
    if (req.method !== "GET") {
      return res.status(405).json({
        success: false,
        message: "Método no permitido",
      });
    }

    // Obtener datos filtrados de usuarios
    const userData = await getExportData(req);
    
    if (!userData.length) {
      return res.status(404).json({
        success: false,
        message: "No se encontraron usuarios para exportar",
      });
    }

    // Crear un nuevo libro y hoja de trabajo
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Usuarios');
    
    // Definir las columnas
    worksheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'CIF', key: 'cif', width: 12 },
      { header: 'Nombre', key: 'firstName', width: 20 },
      { header: 'Apellidos', key: 'lastName', width: 25 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Teléfono', key: 'phone', width: 15 },
      { header: 'Fecha Nacimiento', key: 'birthDate', width: 15 },
      { header: 'Puntos', key: 'points', width: 10 },
      { header: 'Rol', key: 'role', width: 15 },
      { header: 'Estado', key: 'status', width: 10 },
      { header: 'Fecha Registro', key: 'registrationDate', width: 15 },
      { header: 'País', key: 'country', width: 15 },
      { header: 'Ciudad', key: 'city', width: 20 },
      { header: 'Código Postal', key: 'postalCode', width: 10 },
      { header: 'Animales', key: 'animals', width: 25 },
      { header: 'Características de Vivienda', key: 'housingFeatures', width: 30 },
    ];
    
    // Dar estilo a la cabecera
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE2EFDA' } // Color verde claro
    };
    
    // Añadir los datos
    userData.forEach(user => {
      worksheet.addRow({
        id: user.id,
        cif: user.cif || '',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        birthDate: user.birthDate ? new Date(user.birthDate).toLocaleDateString() : '',
        points: user.points || 0,
        role: user.role || '',
        status: user.status ? 'Activo' : 'Inactivo',
        registrationDate: user.registrationDate ? new Date(user.registrationDate).toLocaleDateString() : '',
        country: user.country || '',
        city: user.city || '',
        postalCode: user.postalCode || '',
        animals: user.animales || '',
        housingFeatures: user.housingFeatures || ''
      });
    });
    
    // Configuración para autoajustar celdas
    worksheet.columns.forEach(column => {
      if (column.key && column.width) {
        column.width = Math.max(column.width, 10);
      }
    });
    
    // Generar el archivo Excel
    const buffer = await workbook.xlsx.writeBuffer();
    
    // Configurar cabeceras HTTP para descarga
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, "").slice(0, 14);
    const filename = `usuarios_${timestamp}.xlsx`;

    // Registrar la exportación en el log
    try {
      await executeQuery({
        query: `
          INSERT INTO logs_export (
            user_id, export_type, format, filters, record_count, ip_address, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, NOW())
        `,
        values: [
          req.user?.userId || 0, // Corregir el error de req.user posiblemente undefined
          'users',
          'excel',
          JSON.stringify(req.query),
          userData.length,
          req.socket.remoteAddress || ''
        ]
      });
    } catch (logError) {
      console.error('Error registrando exportación:', logError);
      // Continuamos a pesar del error para no interrumpir la exportación
    }

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
    
    // Enviar el archivo Excel como un Buffer
    res.status(200).send(buffer);
  } catch (error) {
    console.error("Error al exportar a Excel:", error);
    return res.status(500).json({
      success: false,
      message: "Error al exportar a Excel",
      error: (error as Error).message,
    });
  }
}

export default withAuth(exportExcelHandler);
