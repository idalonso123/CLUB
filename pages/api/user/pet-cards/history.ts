import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '@/middleware/authMiddleware';
import executeQuery from '@/lib/db';

interface CarnetHistoryItem {
  id: number;
  nombrePienso: string;
  productBarcode: string | null;
  petName: string;
  petType: string;
  fechaCanje: string;
}

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  try {
    // Verificar que el usuario esté autenticado
    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    // GET: Obtener historial de carnets completados y canjeados
    if (req.method === 'GET') {
      const userId = req.user.userId;

      // Obtener el historial de la tabla historial_carnets_mascota
      // Usar las columnas que realmente existen: nombre_mascota, tipo_mascota
      const historyResult = await executeQuery({
        query: `
          SELECT 
            hcm.id,
            hcm.nombre_mascota AS petName,
            hcm.tipo_mascota AS petType,
            hcm.nombre_pienso AS nombrePienso,
            hcm.codigo_barras_producto AS productBarcode,
            hcm.fecha_canje AS fechaCanje
          FROM historial_carnets_mascota hcm
          WHERE hcm.persona_id = ?
          ORDER BY hcm.fecha_canje DESC
        `,
        values: [userId]
      }) as any[];

      // Formatear las fechas
      const history = (historyResult || []).map((item: any) => ({
        ...item,
        fechaCanje: item.fechaCanje ? new Date(item.fechaCanje).toISOString() : null
      }));

      return res.status(200).json({
        success: true,
        history: history
      });
    }

    return res.status(405).json({
      success: false,
      message: 'Método no permitido'
    });
  } catch (error) {
    console.error('Error al obtener historial de carnets:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: (error as Error).message
    });
  }
}

export default withAuth(handler);
