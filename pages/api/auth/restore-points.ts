import { NextApiRequest, NextApiResponse } from 'next';
import executeQuery from '@/lib/db';
import oldCustomerCache from '../../../services/oldCustomerCache';

async function removeCustomerFromCSV(email?: string, phone?: string, tarjeta_cliente?: string): Promise<boolean> {
  console.log('Eliminando cliente del CSV:', { email, phone, tarjeta_cliente });
  try {
    const removed = oldCustomerCache.removeCustomer(tarjeta_cliente, email, phone);
    if (!removed) {
      return false;
    }
    console.log('Cliente eliminado del CSV correctamente');
    return true;
  } catch (error) {
    console.error('Error al eliminar cliente del CSV:', error);
    return false;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }
  try {
    const { userId, points, email, phone, tarjeta_cliente } = req.body;
    if (!userId || (!email && !phone && !tarjeta_cliente)) {
      return res.status(400).json({ success: false, message: 'Faltan datos requeridos' });
    }
    const user = await executeQuery({
      query: 'SELECT * FROM personas WHERE codigo = ?',
      values: [userId],
    }) as any[];
    if (!user || user.length === 0) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }
    const foundCustomer = oldCustomerCache.findCustomer(tarjeta_cliente, email, phone);
    if (!foundCustomer) {
      return res.status(404).json({ success: false, message: 'Cliente antiguo no encontrado' });
    }
    try {
      const updateResult = await executeQuery({
        query: `UPDATE personas SET puntos = puntos + ? WHERE codigo = ?`,
        values: [foundCustomer.puntos, userId]
      });
      if (!updateResult || (updateResult as any).affectedRows === 0) {
        console.log('Error: No se pudieron actualizar los puntos');
        return res.status(500).json({ success: false, message: 'Error al actualizar puntos' });
      }
    } catch (dbError) {
      console.error('Error en la base de datos:', dbError);
      return res.status(500).json({
        success: false,
        message: 'Error en la base de datos al actualizar puntos'
      });
    }
    if (email || phone || tarjeta_cliente) {
      await removeCustomerFromCSV(email, phone, tarjeta_cliente);
    }
    return res.status(200).json({
      success: true,
      message: 'Puntos restaurados correctamente',
      puntos: foundCustomer.puntos
    });
  } catch (error: any) {
    console.error('Error al restaurar puntos:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error al restaurar puntos', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}