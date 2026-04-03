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
    
    // Consultar el valor de euros por punto y caducidades
    const configQuery = await executeQuery({
      query: "SELECT clave, valor FROM config_default_puntos WHERE clave IN ('euros_por_punto', 'puntos_bienvenida', 'caducidad_puntos_meses', 'caducidad_carnet_inactividad_meses', 'caducidad_carnet_antiguedad_meses', 'sellos_requeridos_carnet')",
      values: []
    });

    let eurosPorPunto = 3.50;
    let puntosBienvenida = 5;
    let caducidad_puntos_meses = 12;
    let caducidad_carnet_inactividad_meses = 6;
    let caducidad_carnet_antiguedad_meses = 24;
    let sellos_requeridos_carnet = 6;
    
    if (Array.isArray(configQuery)) {
      configQuery.forEach(item => {
        if (item.clave === 'euros_por_punto') {
          eurosPorPunto = parseFloat(item.valor);
        } else if (item.clave === 'puntos_bienvenida') {
          puntosBienvenida = parseInt(item.valor, 10);
        } else if (item.clave === 'caducidad_puntos_meses') {
          caducidad_puntos_meses = parseInt(item.valor, 10);
        } else if (item.clave === 'caducidad_carnet_inactividad_meses') {
          caducidad_carnet_inactividad_meses = parseInt(item.valor, 10);
        } else if (item.clave === 'caducidad_carnet_antiguedad_meses') {
          caducidad_carnet_antiguedad_meses = parseInt(item.valor, 10);
        } else if (item.clave === 'sellos_requeridos_carnet') {
          sellos_requeridos_carnet = parseInt(item.valor, 10);
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

    // Consultar los niveles de cliente
    const clientLevelsQuery = await executeQuery({
      query: "SELECT nivel, nombre, icono, puntos_minimos, puntos_maximos, euros_compra_minima, activo FROM config_niveles_cliente WHERE activo = 1 ORDER BY nivel ASC",
      values: []
    });

    // Formatear los niveles de cliente
    const clientLevels = Array.isArray(clientLevelsQuery) 
      ? clientLevelsQuery.map(item => ({
          nivel: item.nivel,
          nombre: item.nombre,
          icono: item.icono,
          puntosMinimos: item.puntos_minimos,
          puntosMaximos: item.puntos_maximos,
          eurosCompraMinima: parseFloat(item.euros_compra_minima),
          activo: item.activo === 1
        }))
      : [];

    // Preparar la respuesta con la configuración completa
    const response: any = {
      success: true,
      config: {
        eurosPorPunto,
        puntosBienvenida,
        tellerRewards,
        expiration: {
          caducidad_puntos_meses,
          caducidad_carnet_inactividad_meses,
          caducidad_carnet_antiguedad_meses,
          sellos_requeridos_carnet
        },
        clientLevels
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