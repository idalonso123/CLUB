import { NextApiRequest, NextApiResponse } from 'next';
import { API_CONFIG, COMPANY_CONFIG } from '@/lib/config';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Método no permitido' });
  }
  
  try {
    const { code, country } = req.query;
    
    if (!code || typeof code !== 'string' || !country || typeof country !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Debe proporcionar un código postal y país válidos'
      });
    }
    
    // Es importante incluir un User-Agent personalizado como solicita Nominatim
    // y respetar su límite de uso de 1 petición por segundo
    const response = await fetch(
      `${API_CONFIG.geolocation.nominatimUrl}/search?postalcode=${code}&country=${country}&format=json&addressdetails=1`,
      {
        headers: {
          'User-Agent': API_CONFIG.geolocation.userAgent
        }
      }
    );
    
    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        message: `Error al consultar el servicio de geocodificación: ${response.statusText}`
      });
    }
    
    const data = await response.json();
    
    if (!data || data.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No se encontró información para el código postal proporcionado'
      });
    }
    
    // Extraer información relevante
    const address = data[0].address;
    
    return res.status(200).json({
      success: true,
      data: {
        city: address.city || address.town || address.village || '',
        state: address.state || '',
        country: address.country || ''
      }
    });
    
  } catch (error) {
    console.error('Error al procesar la solicitud:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno al procesar la solicitud',
      error: (error as Error).message
    });
  }
}