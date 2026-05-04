import { NextApiRequest, NextApiResponse } from 'next';
import executeQuery from '@/lib/db';
import { withAuth, AuthenticatedRequest } from '@/middleware/authMiddleware';

interface Producto {
  id: number;
  Articulo: string;
  Nombre: string;
  Talla: string | null;
  Color: string | null;
  C_Barras: string;
  PVP: number;
}

/**
 * API endpoint para buscar productos de carnet de mascota
 * Busca por código de artículo, nombre o código de barras
 */
async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  // Solo permitir GET
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      message: 'Método no permitido'
    });
  }

  try {
    // Verificar rol del usuario
    const userRole = await req.user?.getRole();
    if (userRole !== "administrador" && userRole !== "admin" && userRole !== "cajero") {
      return res.status(403).json({
        success: false,
        message: "No tienes permiso para acceder a esta funcionalidad"
      });
    }

    const { query: searchQuery, limit = '20' } = req.query;
    const queryStr = String(searchQuery || '').trim();
    const limitNum = Math.min(parseInt(String(limit)) || 20, 100);

    // Si no hay query, devolver los productos más recientes
    if (!queryStr) {
      const productos = await executeQuery({
        query: `
          SELECT id, Articulo, Nombre, Talla, Color, C_Barras, PVP
          FROM productos_carnet_mascota
          WHERE activo = 1
          ORDER BY fecha_creacion DESC
          LIMIT ?
        `,
        values: [limitNum]
      }) as Producto[];

      return res.status(200).json({
        success: true,
        productos: productos,
        total: productos.length,
        searchType: 'recent'
      });
    }

    // Buscar por código de artículo, nombre o código de barras
    // El código de barras tiene prioridad en la búsqueda exacta
    const productos = await executeQuery({
      query: `
        SELECT id, Articulo, Nombre, Talla, Color, C_Barras, PVP
        FROM productos_carnet_mascota
        WHERE activo = 1
          AND (
            -- Búsqueda exacta por código de barras
            C_Barras = ?
            -- Búsqueda exacta por código de artículo
            OR Articulo = ?
            -- Búsqueda parcial por código de barras
            OR C_Barras LIKE ?
            -- Búsqueda parcial por código de artículo
            OR Articulo LIKE ?
            -- Búsqueda parcial por nombre (case insensitive)
            OR LOWER(Nombre) LIKE LOWER(?)
          )
        ORDER BY
          -- Priorizar coincidencia exacta de código de barras
          CASE WHEN C_Barras = ? THEN 1
               WHEN Articulo = ? THEN 2
               ELSE 3
          END,
          -- Luego ordenar por coincidencia en nombre
          CASE WHEN LOWER(Nombre) LIKE LOWER(?) THEN 1 ELSE 2 END,
          Nombre ASC
        LIMIT ?
      `,
      values: [
        queryStr,
        queryStr,
        `%${queryStr}%`,
        `%${queryStr}%`,
        `%${queryStr}%`,
        queryStr,  // Para ORDER BY
        queryStr,  // Para ORDER BY
        `${queryStr}%`,  // Para ORDER BY - nombre que empieza con el query
        limitNum
      ]
    }) as Producto[];

    return res.status(200).json({
      success: true,
      productos: productos,
      total: productos.length,
      searchType: 'search',
      query: queryStr
    });

  } catch (error) {
    console.error('Error al buscar productos de carnet:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
}

export default withAuth(handler);
