import { NextApiRequest, NextApiResponse } from 'next';
import oldCustomerCache from '../../../services/oldCustomerCache';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }
  try {
    const { email, phone, tarjeta_cliente } = req.body;
    if (!email && !phone && !tarjeta_cliente) {
      return res.status(400).json({ success: false, message: 'Se requiere email, teléfono o tarjeta de cliente' });
    }
    const oldCustomer = oldCustomerCache.findCustomer(tarjeta_cliente, email, phone);
    if (oldCustomer) {
      let puntos = 0;
      try {
        puntos = oldCustomer.puntos;
        if (isNaN(puntos)) {
          puntos = 0;
        }
      } catch (error) {
        puntos = 0;
      }
      return res.status(200).json({ 
        success: true, 
        customer: {
          email: oldCustomer.email,
          telefono: oldCustomer.telefono,
          puntos: puntos,
          tarjeta_cliente: oldCustomer.tarjeta_cliente || ''
        }
      });
    } else {
      return res.status(200).json({ success: true, found: false });
    }
  } catch (error) {
    console.error('Error al verificar cliente antiguo:', error);
    return res.status(500).json({ success: false, message: 'Error al verificar cliente antiguo' });
  }
}