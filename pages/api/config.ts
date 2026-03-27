import type { NextApiRequest, NextApiResponse } from 'next';
import executeQuery from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Solo permitir GET
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      message: 'Método no permitido' 
    });
  }

  try {
    // Obtener el parámetro "monto" de la consulta
    const { monto } = req.query;
    
    // Consultar el valor de euros por punto
    const configQuery = await executeQuery({
      query: "SELECT clave, valor FROM config_default_puntos WHERE clave IN ('euros_por_punto', 'puntos_bienvenida')",
      values: []
    });

    let eurosPorPunto = 3.50;
    let puntosBienvenida = 5;
    
    if (Array.isArray(configQuery)) {
      configQuery.forEach(item => {
        if (item.clave === 'euros_por_punto') {
          eurosPorPunto = parseFloat(item.valor);
        } else if (item.clave === 'puntos_bienvenida') {
          puntosBienvenida = parseInt(item.valor, 10);
        }
      });
    }

    // Consultar la configuración de recompensas para el cajero
    const tellerRewardsQuery = await executeQuery({
      query: "SELECT valor FROM config_rewards_teller WHERE clave = 'teller_rewards'",
      values: []
    });

    // Parsear la configuración de recompensas o usar valores predeterminados
    let tellerRewards = { showAllRewards: true, rewardIds: [] };
    if (Array.isArray(tellerRewardsQuery) && tellerRewardsQuery.length > 0) {
      try {
        tellerRewards = JSON.parse(tellerRewardsQuery[0].valor);
      } catch (e) {
        console.error('Error al parsear la configuración de recompensas:', e);
      }
    }

    // Preparar la respuesta con la configuración completa
    const response: any = {
      success: true,
      config: {
        eurosPorPunto,
        puntosBienvenida,
        tellerRewards
      }
    };

    // Si se proporcionó un monto, calcular los puntos
    if (monto && !isNaN(Number(monto))) {
      response.puntos = Math.floor(Number(monto) / response.config.eurosPorPunto);
    }

    return res.status(200).json(response);
  } catch (error) {
    console.error('Error al obtener la configuración:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error al obtener la configuración',
      error: (error as Error).message
    });
  }
}