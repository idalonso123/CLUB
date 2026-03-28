import executeQuery from './db';

interface ExpirationConfig {
  caducidad_puntos_meses: number;
  caducidad_carnet_inactividad_meses: number;
  caducidad_carnet_antiguedad_meses: number;
}

interface FullConfig {
  eurosPorPunto: number;
  puntosBienvenida: number;
  expiration: ExpirationConfig;
}

/**
 * Obtiene la configuración de caducidad desde la base de datos
 * con valores por defecto si no existen
 */
export async function getExpirationConfig(): Promise<ExpirationConfig> {
  try {
    const caducidadPuntosResult = await executeQuery({
      query: "SELECT valor FROM config_default_puntos WHERE clave = 'caducidad_puntos_meses' LIMIT 1",
      values: [],
    }) as Array<{ valor: string }>;

    const caducidadInactividadResult = await executeQuery({
      query: "SELECT valor FROM config_default_puntos WHERE clave = 'caducidad_carnet_inactividad_meses' LIMIT 1",
      values: [],
    }) as Array<{ valor: string }>;

    const caducidadAntiguedadResult = await executeQuery({
      query: "SELECT valor FROM config_default_puntos WHERE clave = 'caducidad_carnet_antiguedad_meses' LIMIT 1",
      values: [],
    }) as Array<{ valor: string }>;

    return {
      caducidad_puntos_meses: Array.isArray(caducidadPuntosResult) && caducidadPuntosResult.length > 0
        ? parseInt(caducidadPuntosResult[0].valor)
        : 12,
      caducidad_carnet_inactividad_meses: Array.isArray(caducidadInactividadResult) && caducidadInactividadResult.length > 0
        ? parseInt(caducidadInactividadResult[0].valor)
        : 6,
      caducidad_carnet_antiguedad_meses: Array.isArray(caducidadAntiguedadResult) && caducidadAntiguedadResult.length > 0
        ? parseInt(caducidadAntiguedadResult[0].valor)
        : 24,
    };
  } catch (error) {
    console.error('Error al obtener configuración de caducidad, usando valores por defecto:', error);
    return {
      caducidad_puntos_meses: 12,
      caducidad_carnet_inactividad_meses: 6,
      caducidad_carnet_antiguedad_meses: 24,
    };
  }
}

/**
 * Obtiene la configuración completa del sistema
 */
export async function getFullConfig(): Promise<FullConfig> {
  try {
    // Obtener euros por punto
    const eurosPorPuntoResult = await executeQuery({
      query: "SELECT valor FROM config_default_puntos WHERE id = 1 LIMIT 1",
      values: [],
    }) as Array<{ valor: string }>;

    // Obtener puntos de bienvenida
    const puntosBienvenidaResult = await executeQuery({
      query: "SELECT valor FROM config_default_puntos WHERE clave = 'puntos_bienvenida' LIMIT 1",
      values: [],
    }) as Array<{ valor: string }>;

    const expiration = await getExpirationConfig();

    return {
      eurosPorPunto: Array.isArray(eurosPorPuntoResult) && eurosPorPuntoResult.length > 0
        ? parseFloat(eurosPorPuntoResult[0].valor)
        : 3.5,
      puntosBienvenida: Array.isArray(puntosBienvenidaResult) && puntosBienvenidaResult.length > 0
        ? parseInt(puntosBienvenidaResult[0].valor)
        : 5,
      expiration,
    };
  } catch (error) {
    console.error('Error al obtener configuración completa, usando valores por defecto:', error);
    return {
      eurosPorPunto: 3.5,
      puntosBienvenida: 5,
      expiration: {
        caducidad_puntos_meses: 12,
        caducidad_carnet_inactividad_meses: 6,
        caducidad_carnet_antiguedad_meses: 24,
      },
    };
  }
}
