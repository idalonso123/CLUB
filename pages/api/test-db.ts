// pages/api/test-db.ts
import { NextApiRequest, NextApiResponse } from 'next';
import executeQuery from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Una consulta simple para probar
    const results = await executeQuery({ 
      query: 'SELECT 1 as test' 
    });
    
    res.status(200).json({ success: true, data: results });
  } catch (error) {
    console.error('Error al probar la conexión:', error);
    res.status(500).json({ success: false, error: 'Error en la conexión a la base de datos' });
  }
}