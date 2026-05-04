import { NextApiRequest, NextApiResponse } from 'next';
import executeQuery from '@/lib/db';
import { withAuth, AuthenticatedRequest } from '@/middleware/authMiddleware';

/**
 * API para buscar producto por código de barras
 * GET /api/cajero/productos-carnet/barcode?codigoBarras=xxx
 */
async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      message: 'Método no permitido'
    });
  }

  try {
    const userRole = await req.user?.getRole();
    if (userRole !== "administrador" && userRole !== "admin" && userRole !== "cajero") {
      return res.status(403).json({
        success: false,
        message: "No tienes permiso para acceder a esta funcionalidad",
      });
    }

    const { codigoBarras } = req.query;
    if (!codigoBarras || typeof codigoBarras !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Código de barras no proporcionado'
      });
    }

    const productos = await executeQuery({
      query: `
        SELECT id, Articulo, Nombre, Talla, Color, C_Barras, PVP
        FROM productos_carnet_mascota
        WHERE activo = 1 AND C_Barras = ?
        LIMIT 1
      `,
      values: [codigoBarras]
    }) as any[];

    if (!productos || productos.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    return res.status(200).json({
      success: true,
      producto: productos[0]
    });
  } catch (error) {
    console.error('Error al buscar producto por código de barras:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
}

export default withAuth(handler);
