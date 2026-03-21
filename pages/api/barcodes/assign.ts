import { NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '@/middleware/authMiddleware';
import executeQuery from '@/lib/db';

async function assignBarcodeHandler(req: AuthenticatedRequest, res: NextApiResponse) {
  // Verificar que el usuario sea administrador o cajero
  const role = await req.user?.getRole?.();
  if (!role || !['admin', 'administrador', 'cajero'].includes(role)) {
    return res.status(403).json({ success: false, message: 'Acceso denegado' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Método no permitido' });
  }

  try {
    const { redemptionId, barcode, visibleCode } = req.body;
    
    if (!redemptionId || !barcode) {
      return res.status(400).json({ 
        success: false, 
        message: 'ID de canje y código de barras son requeridos' 
      });
    }
    
    // Verificar si el canje existe
    const canjeExistente = await executeQuery({
      query: 'SELECT id, recompensa_id FROM canjes_recompensas WHERE id = ?',
      values: [redemptionId]
    }) as any[];
    
    if (canjeExistente.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Canje no encontrado' 
      });
    }
    
    // Verificar si el código de barras existe para esta recompensa
    const recompensaId = canjeExistente[0].recompensa_id;
    const codigoDisponible = await executeQuery({
      query: `
        SELECT id FROM codigos_barras 
        WHERE recompensa_id = ? AND codigo = ?
      `,
      values: [recompensaId, barcode]
    }) as any[];
    
    // Actualizar el canje con el código de barras
    await executeQuery({
      query: `
        UPDATE canjes_recompensas 
        SET codigo_barras_asignado = ?, codigo_visible = ? 
        WHERE id = ?
      `,
      values: [barcode, visibleCode || barcode, redemptionId]
    });
    
    // Ya no marcamos los códigos como usados para que puedan ser reutilizados
    
    return res.status(200).json({ 
      success: true, 
      message: 'Código de barras asignado correctamente'
    });
  } catch (error) {
    console.error('Error al asignar código de barras:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error al asignar código de barras' 
    });
  }
}

export default withAuth(assignBarcodeHandler);
