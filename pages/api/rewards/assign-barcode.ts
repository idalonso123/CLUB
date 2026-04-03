import { NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '@/middleware/authMiddleware';
import executeQuery from '@/lib/db';

async function assignBarcodeHandler(req: AuthenticatedRequest, res: NextApiResponse) {
  // Solo permitir POST
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Método no permitido'
    });
  }

  try {
    const { redemptionId } = req.body;

    if (!redemptionId) {
      return res.status(400).json({
        success: false,
        message: 'ID de canje requerido'
      });
    }

    // Verificar que el canje existe y obtener la recompensa asociada
    const redemptionQuery = `
      SELECT cr.id, cr.recompensa_id, cr.codigo_barras_asignado
      FROM canjes_recompensas cr
      WHERE cr.id = ?
    `;

    const redemptionResult = await executeQuery({
      query: redemptionQuery,
      values: [redemptionId]
    }) as any[];

    if (redemptionResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Canje no encontrado'
      });
    }

    const redemption = redemptionResult[0];
    
    // Si ya tiene un código de barras asignado, devolverlo
    if (redemption.codigo_barras_asignado) {
      // Obtener el código visible si existe
      const existingCodeQuery = `
        SELECT codigo_barras_asignado, codigo_visible
        FROM canjes_recompensas
        WHERE id = ?
      `;
      
      const existingCodeResult = await executeQuery({
        query: existingCodeQuery,
        values: [redemptionId]
      }) as any[];
      
      if (existingCodeResult.length > 0) {
        return res.status(200).json({
          success: true,
          message: 'Código de barras ya asignado',
          barcode: existingCodeResult[0].codigo_barras_asignado,
          visibleCode: existingCodeResult[0].codigo_visible || existingCodeResult[0].codigo_barras_asignado
        });
      }
    }

    // Buscar un código de barras disponible para esta recompensa
    const barcodeQuery = `
      SELECT id, codigo, descripcion
      FROM codigos_barras
      WHERE recompensa_id = ?
      LIMIT 1
    `;

    const barcodeResult = await executeQuery({
      query: barcodeQuery,
      values: [redemption.recompensa_id]
    }) as any[];

    let barcode, visibleCode;

    if (barcodeResult.length > 0) {
      // Usar un código predefinido
      barcode = barcodeResult[0].codigo;
      // Generar un código visible diferente (para que no se pueda adivinar el código real)
      visibleCode = `V${redemptionId}${Math.floor(Math.random() * 10000)}`;
    } else {
      // No hay códigos predefinidos, generar uno aleatorio
      barcode = `R${redemption.recompensa_id}${Math.floor(Math.random() * 100000)}`;
      visibleCode = `V${redemptionId}${Math.floor(Math.random() * 10000)}`;
    }

    // Asignar el código al canje
    await executeQuery({
      query: `
        UPDATE canjes_recompensas
        SET codigo_barras_asignado = ?, codigo_visible = ?
        WHERE id = ?
      `,
      values: [barcode, visibleCode, redemptionId]
    });

    return res.status(200).json({
      success: true,
      message: 'Código de barras asignado correctamente',
      barcode,
      visibleCode
    });
  } catch (error) {
    console.error('Error al asignar código de barras:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al asignar código de barras',
      error: (error as Error).message
    });
  }
}

export default withAuth(assignBarcodeHandler);
