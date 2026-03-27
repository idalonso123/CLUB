import { NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '@/middleware/authMiddleware';
import executeQuery from '@/lib/db';

async function barcodesHandler(req: AuthenticatedRequest, res: NextApiResponse) {
  // Verificar que el usuario sea administrador o cajero
  const role = await req.user?.getRole?.();
  if (!role || !['admin', 'administrador', 'cajero'].includes(role)) {
    return res.status(403).json({ success: false, message: 'Acceso denegado' });
  }

  switch (req.method) {
    case 'GET':
      return getCodigos(req, res);
    case 'POST':
      return crearCodigo(req, res);
    default:
      return res.status(405).json({ success: false, message: 'Método no permitido' });
  }
}

// Obtener códigos de barras por recompensa
async function getCodigos(req: AuthenticatedRequest, res: NextApiResponse) {
  try {
    const { recompensaId } = req.query;
    
    if (!recompensaId) {
      return res.status(400).json({ success: false, message: 'ID de recompensa requerido' });
    }
    
    const codigos = await executeQuery({
      query: `
        SELECT cb.*, r.nombre as recompensa_nombre 
        FROM codigos_barras cb
        JOIN recompensas r ON cb.recompensa_id = r.id
        WHERE cb.recompensa_id = ?
        ORDER BY cb.fecha_creacion DESC
      `,
      values: [recompensaId]
    });
    
    return res.status(200).json({ success: true, codigos });
  } catch (error) {
    console.error('Error al obtener códigos de barras:', error);
    return res.status(500).json({ success: false, message: 'Error al obtener códigos de barras' });
  }
}

// Crear un nuevo código de barras
async function crearCodigo(req: AuthenticatedRequest, res: NextApiResponse) {
  try {
    const { recompensaId, codigo, descripcion } = req.body;
    
    if (!recompensaId || !codigo) {
      return res.status(400).json({ success: false, message: 'Recompensa ID y código son requeridos' });
    }
    
    // Verificar si el código ya existe
    const codigoExistente = await executeQuery({
      query: 'SELECT id FROM codigos_barras WHERE codigo = ?',
      values: [codigo]
    }) as any[];
    
    if (codigoExistente.length > 0) {
      return res.status(400).json({ success: false, message: 'El código de barras ya existe' });
    }
    
    // Insertar nuevo código
    const result = await executeQuery({
      query: `
        INSERT INTO codigos_barras (recompensa_id, codigo, descripcion)
        VALUES (?, ?, ?)
      `,
      values: [recompensaId, codigo, descripcion || '']
    }) as { insertId: number };
    
    return res.status(201).json({ 
      success: true, 
      message: 'Código de barras creado correctamente',
      id: result.insertId
    });
  } catch (error) {
    console.error('Error al crear código de barras:', error);
    return res.status(500).json({ success: false, message: 'Error al crear código de barras' });
  }
}

export default withAuth(barcodesHandler);
