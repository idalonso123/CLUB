import { NextApiRequest, NextApiResponse } from 'next';
import executeQuery from '@/lib/db';
import { withAuth, AuthenticatedRequest } from '@/middleware/authMiddleware';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  try {
    const userRole = await req.user?.getRole();
    if (userRole !== "administrador" && userRole !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Solo los administradores pueden eliminar carnets",
      });
    }
    if (req.method !== 'DELETE') {
      return res.status(405).json({ success: false, message: 'Método no permitido' });
    }
    const { id } = req.query;
    const petCardId = Number(id);
    if (!id || isNaN(petCardId)) {
      return res.status(400).json({ success: false, message: 'ID de carnet inválido' });
    }
    const petCards = await executeQuery({
      query: `SELECT * FROM pet_cards WHERE id = ?`,
      values: [petCardId]
    });
    if (!petCards || (petCards as any[]).length === 0) {
      return res.status(404).json({ success: false, message: 'Carnet animal no encontrado' });
    }
    await executeQuery({
      query: `DELETE FROM pet_cards WHERE id = ?`,
      values: [petCardId]
    });
    return res.status(200).json({
      success: true,
      message: 'Carnet animal eliminado correctamente'
    });
  } catch (error) {
    console.error('Error al eliminar carnet animal:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
}

export default withAuth(handler);