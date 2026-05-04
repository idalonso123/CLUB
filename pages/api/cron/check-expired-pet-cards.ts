import { NextApiRequest, NextApiResponse } from 'next';
import executeQuery from '@/lib/db';
import { getExpirationConfig } from '@/lib/configHelpers';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Solo permitir método GET y verificar origen local
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      message: 'Método no permitido' 
    });
  }
  
  // Verificar que es una petición local o tiene el token de verificación
  const cronToken = req.headers['x-cron-token'] as string;
  const expectedToken = process.env.CRON_SECRET_TOKEN;
  
  // Permitir peticiones locales sin token, o verificar token si está configurado
  const isLocalRequest = req.headers.host?.includes('localhost') || 
                         req.headers.host?.includes('127.0.0.1');
  
  if (!isLocalRequest && expectedToken && cronToken !== expectedToken) {
    return res.status(403).json({ 
      success: false, 
      message: 'Acceso no autorizado' 
    });
  }
  
  try {
    console.log(`[${new Date().toISOString()}] Iniciando verificación de carnets de mascota caducados...`);
    
    // Obtener configuración de caducidad
    const expirationConfig = await getExpirationConfig();
    
    // REGLA 1: Marcar como expirados los que han superado los meses de inactividad desde el último sello
    // (expirationDate se actualiza cada vez que se añade un sello)
    await executeQuery({
      query: `
        UPDATE pet_cards 
        SET isExpired = 1 
        WHERE completed = 0 
        AND expirationDate IS NOT NULL 
        AND expirationDate < NOW()
        AND isExpired = 0
      `
    });
    
    // REGLA 2: Marcar como expirados los que han superado el límite de antigüedad desde la creación
    // (máximo absoluto, sin importar si tienen sellos recientes) usando configuración dinámica
    await executeQuery({
      query: `
        UPDATE pet_cards 
        SET isExpired = 1 
        WHERE completed = 0 
        AND createdAt < DATE_SUB(NOW(), INTERVAL ? MONTH)
        AND isExpired = 0
      `,
      values: [expirationConfig.caducidad_carnet_antiguedad_meses]
    });
    
    // Contar carnets que deben eliminarse
    const result = await executeQuery({
      query: `
        SELECT COUNT(*) as count FROM pet_cards 
        WHERE completed = 0 
        AND isExpired = 1
      `
    });
    
    const expiredCount = ((result as any[])[0]?.count || 0);
    
    // Eliminar los carnets expirados
    const deleteResult = await executeQuery({
      query: `
        DELETE FROM pet_cards 
        WHERE completed = 0 
        AND isExpired = 1
      `
    });
    
    const deletedCount = (deleteResult as any).affectedRows || 0;
    
    console.log(`[${new Date().toISOString()}] Carnets marcados como expirados: ${expiredCount}`);
    console.log(`[${new Date().toISOString()}] Carnets eliminados: ${deletedCount}`);
    
    return res.status(200).json({
      success: true,
      message: `Se eliminaron ${deletedCount} carnets caducados`,
      expiredCount: expiredCount,
      deletedCount: deletedCount,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error al eliminar carnets caducados:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
}

export default handler;
