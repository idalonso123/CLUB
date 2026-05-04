import { NextApiResponse } from "next";
import { withAuth, AuthenticatedRequest } from "@/middleware/authMiddleware";
import { getExportData } from "./index";
import executeQuery from "@/lib/db";
import PDFDocument from 'pdfkit';

async function exportPdfHandler(req: AuthenticatedRequest, res: NextApiResponse) {
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

    // Registrar la exportación en el log
    try {
      // Verificar que req.user está definido antes de acceder a userId
      if (!req.user) {
        throw new Error('Usuario no autenticado');
      }
      
      await executeQuery({
        query: `
          INSERT INTO logs_export (
            user_id, export_type, format, filters, record_count, ip_address, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, NOW())
        `,
        values: [
          req.user.userId,
          'users',
          'pdf',
          JSON.stringify(req.query),
          userData.length,
          req.socket.remoteAddress || ''
        ]
      });
    } catch (logError) {
      console.error('Error registrando exportación:', logError);
      // Continuamos a pesar del error para no interrumpir la exportación
    }

    // Crear el documento PDF
    const doc = new PDFDocument({
      margin: 50,
      size: 'A4',
      bufferPages: true
    });
    
    // Configurar encabezado
    doc
      .fontSize(18)
      .text('Listado de Usuarios', { align: 'center' })
      .moveDown()
      .fontSize(10)
      .text(`Fecha de generación: ${new Date().toLocaleString()}`, { align: 'center' })
      .moveDown(2);

    // Definir columnas de la tabla
    const tableTop = 150;
    const columns = [
      { title: 'ID', width: 40 },
      { title: 'Nombre', width: 120 },
      { title: 'Email', width: 170 },
      { title: 'Teléfono', width: 80 },
      { title: 'Puntos', width: 50 },
      { title: 'Estado', width: 50 }
    ];
    
    // Dibujar cabecera de la tabla
    let currentX = 50; // Margen izquierdo
    doc
      .fontSize(9)
      .fillColor('#333');
      
    columns.forEach(column => {
      doc
        .rect(currentX, tableTop, column.width, 20)
        .fill('#E2EFDA') // Color verde claro para cabecera
        .stroke('#000')
        .fillColor('#000')
        .text(column.title, currentX + 2, tableTop + 6, {
          width: column.width - 4,
          height: 20,
          align: 'center'
        });
      currentX += column.width;
    });

    // Dibujar filas de datos
    let currentY = tableTop + 20;
    let pageNumber = 1;
    const itemsPerPage = 25;

    userData.forEach((user, index) => {
      // Comprobar si necesitamos una nueva página
      if (index > 0 && index % itemsPerPage === 0) {
        // Añadir número de página
        doc.text(`Página ${pageNumber}`, 50, 780, { align: 'center' });
        
        // Nueva página
        doc.addPage();
        pageNumber++;
        currentY = 50; // Resetear posición Y al inicio

        // Repetir cabecera en la nueva página
        doc.fontSize(18).text('Listado de Usuarios (continuación)', { align: 'center' }).moveDown();
        
        // Repetir cabecera de tabla
        currentX = 50;
        doc.fontSize(9).fillColor('#333');
        columns.forEach(column => {
          doc
            .rect(currentX, currentY, column.width, 20)
            .fill('#E2EFDA')
            .stroke('#000')
            .fillColor('#000')
            .text(column.title, currentX + 2, currentY + 6, {
              width: column.width - 4,
              height: 20,
              align: 'center'
            });
          currentX += column.width;
        });
        currentY += 20;
      }

      // Dibujar fila
      const rowHeight = 20;
      const userData = [
        user.id,
        `${user.firstName || ''} ${user.lastName || ''}`,
        user.email || '',
        user.phone || '',
        user.points || 0,
        user.status ? 'Activo' : 'Inactivo'
      ];

      currentX = 50;
      
      userData.forEach((value, colIndex) => {
        doc
          .rect(currentX, currentY, columns[colIndex].width, rowHeight)
          .stroke('#000');
        
        doc
          .fillColor('#000')
          .text(
            String(value), 
            currentX + 2,
            currentY + 5,
            { 
              width: columns[colIndex].width - 4, 
              height: rowHeight,
              align: colIndex === 0 ? 'left' : 'left'
            }
          );
        
        currentX += columns[colIndex].width;
      });

      currentY += rowHeight;
    });

    // Añadir número de página a la última página
    doc.text(`Página ${pageNumber}`, 50, 780, { align: 'center' });

    // Configurar cabeceras HTTP para descarga
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, "").slice(0, 14);
    const filename = `usuarios_${timestamp}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=${filename}`);

    // Finalizar y enviar el PDF
    doc.pipe(res);
    doc.end();

  } catch (error) {
    console.error("Error al exportar a PDF:", error);
    return res.status(500).json({
      success: false,
      message: "Error al exportar a PDF",
      error: (error as Error).message,
    });
  }
}

export default withAuth(exportPdfHandler);
