/**
 * Utilidades para construir consultas SQL dinámicas basadas en filtros de segmentos
 * Esto permite que los segmentos sean dinámicos, regenerando la lista de usuarios
 * en tiempo real cada vez que se utilizan
 */

export interface EmailSegmentFilters {
  // Datos personales
  name_contains?: string;
  email_contains?: string;
  phone_contains?: string;
  cif_contains?: string;
  
  // Fechas
  registration_date_from?: string;
  registration_date_to?: string;
  birth_date_from?: string;
  birth_date_to?: string;
  
  // Puntos y actividad
  points_min?: number;
  points_max?: number;
  
  // Ventas y recompensas
  sales_amount_min?: number;
  sales_amount_max?: number;
  sales_days?: number;
  
  // Inactividad (días sin acumular puntos)
  inactivity_days_min?: number;
  inactivity_days_max?: number;
  
  // Vivienda y animales
  housing_types?: string[];
  animal_types?: string[];
  
  // Estado
  is_active?: boolean;
  rol?: string[];
}

interface QueryResult {
  query: string;
  params: (string | number | boolean)[];
  joins: string[];
}

/**
 * Valida que una fecha tenga el formato correcto AAAA-MM-DD con año de exactamente 4 dígitos
 * @param dateStr - Cadena de fecha a validar
 * @returns true si es válida, false en caso contrario
 */
function isValidDateFormat(dateStr: string | undefined | null): boolean {
  if (!dateStr || dateStr === '') return true; // Vacío es válido (opcional)
  
  // Verificar formato AAAA-MM-DD con año de exactamente 4 dígitos
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;
  if (!datePattern.test(dateStr)) return false;
  
  // Verificar que el año tenga exactamente 4 dígitos (1000-9999)
  const year = parseInt(dateStr.substring(0, 4), 10);
  if (year < 1000 || year > 9999) return false;
  
  // Verificar que sea una fecha válida (año, mes, día coherentes)
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return false;
  
  // Verificar que la fecha parseada coincida con la entrada (para detectar meses/días inválidos)
  const [yearStr, monthStr, dayStr] = dateStr.split('-');
  if (
    date.getFullYear() !== parseInt(yearStr, 10) ||
    date.getMonth() + 1 !== parseInt(monthStr, 10) ||
    date.getDate() !== parseInt(dayStr, 10)
  ) {
    return false;
  }
  
  return true;
}

/**
 * Valida los filtros de segmento antes de construir la consulta
 * @param filters - Filtros a validar
 * @returns true si los filtros son válidos, false en caso contrario
 */
export function validateSegmentFilters(filters: EmailSegmentFilters): { valid: boolean; error?: string } {
  if (!filters) {
    return { valid: true }; // Filtros vacíos son válidos
  }
  
  // Validar que ambos campos de fecha de nacimiento estén preenchidos o ninguno
  const birthDateFromFilled = filters.birth_date_from && filters.birth_date_from.trim() !== '';
  const birthDateToFilled = filters.birth_date_to && filters.birth_date_to.trim() !== '';
  if (birthDateFromFilled !== birthDateToFilled) {
    return {
      valid: false,
      error: 'El rango de fechas de nacimiento está incompleto: debe rellenar tanto la fecha "Desde" como la fecha "Hasta", o dejar ambas vacías.'
    };
  }
  
  // Validar que ambos campos de fecha de registro estén preenchidos o ninguno
  const regDateFromFilled = filters.registration_date_from && filters.registration_date_from.trim() !== '';
  const regDateToFilled = filters.registration_date_to && filters.registration_date_to.trim() !== '';
  if (regDateFromFilled !== regDateToFilled) {
    return {
      valid: false,
      error: 'El rango de fechas de registro está incompleto: debe rellenar tanto la fecha "Desde" como la fecha "Hasta", o dejar ambas vacías.'
    };
  }
  
  // Validar formato de fechas
  const dateFields = [
    { field: 'registration_date_from', label: 'Fecha de registro (Desde)' },
    { field: 'registration_date_to', label: 'Fecha de registro (Hasta)' },
    { field: 'birth_date_from', label: 'Fecha de nacimiento (Desde)' },
    { field: 'birth_date_to', label: 'Fecha de nacimiento (Hasta)' },
  ];
  
  for (const { field, label } of dateFields) {
    const value = (filters as any)[field];
    if (value && !isValidDateFormat(value)) {
      return {
        valid: false,
        error: `El formato de ${label} es incorrecto. Debe ser AAAA-MM-DD con un año de exactamente 4 dígitos (ej: 2024-01-15). Valor recibido: "${value}"`
      };
    }
  }
  
  return { valid: true };
}

/**
 * Construye una consulta SQL dinámica para obtener usuarios basándose en los filtros del segmento
 * @param filters - Objeto con los filtros del segmento
 * @returns Objeto con la consulta SQL, parámetros y joins necesarios
 */
export function buildSegmentQuery(filters: EmailSegmentFilters): QueryResult {
  // Manejar el caso en que filters es undefined o null
  if (!filters) {
    console.warn('buildSegmentQuery recibió filtros undefined o null');
    filters = {};
  }

  // Validar fechas antes de construir la consulta
  const validation = validateSegmentFilters(filters);
  if (!validation.valid) {
    throw new Error(validation.error || 'Formato de fecha inválido');
  }

  const params: (string | number | boolean)[] = [];
  const joins: string[] = [];
  const conditions: string[] = [];
  
  // Condición base: solo usuarios activos
  conditions.push('p.status = 1');
  
  // Filtros de datos personales
  if (filters.name_contains) {
    conditions.push('(p.nombres LIKE ? OR p.apellidos LIKE ?)');
    const searchTerm = `%${filters.name_contains}%`;
    params.push(searchTerm, searchTerm);
  }
  
  if (filters.email_contains) {
    conditions.push('p.mail LIKE ?');
    params.push(`%${filters.email_contains}%`);
  }
  
  if (filters.phone_contains) {
    conditions.push('p.telefono LIKE ?');
    params.push(`%${filters.phone_contains}%`);
  }
  
  if (filters.cif_contains) {
    conditions.push('p.cif LIKE ?');
    params.push(`%${filters.cif_contains}%`);
  }
  
  // Filtros de fechas
  if (filters.registration_date_from) {
    conditions.push('p.creado_en >= ?');
    params.push(filters.registration_date_from);
  }
  
  if (filters.registration_date_to) {
    conditions.push('p.creado_en <= ?');
    params.push(filters.registration_date_to);
  }
  
  if (filters.birth_date_from) {
    conditions.push('p.fecha_nacimiento >= ?');
    params.push(filters.birth_date_from);
  }
  
  if (filters.birth_date_to) {
    conditions.push('p.fecha_nacimiento <= ?');
    params.push(filters.birth_date_to);
  }
  
  // Filtros de puntos
  if (filters.points_min !== undefined && filters.points_min !== null) {
    conditions.push('p.puntos >= ?');
    params.push(filters.points_min);
  }
  
  if (filters.points_max !== undefined && filters.points_max !== null) {
    conditions.push('p.puntos <= ?');
    params.push(filters.points_max);
  }
  
  // Filtros de ventas (basado en la suma de puntos canjeados en X días)
  if (filters.sales_days && (filters.sales_amount_min || filters.sales_amount_max)) {
    // Join con tabla de canjes
    joins.push('INNER JOIN canjes_recompensas cr ON p.codigo = cr.persona_id');
    
    const dateLimit = `DATE_SUB(NOW(), INTERVAL ${filters.sales_days} DAY)`;
    conditions.push(`cr.fecha_canje >= ${dateLimit}`);
    
    // Agrupar por persona para poder filtrar por suma
    // Esto requiere una subconsulta o GROUP BY
    if (filters.sales_amount_min !== undefined && filters.sales_amount_min !== null) {
      conditions.push('(SELECT SUM(cr2.puntos_canjeados) FROM canjes_recompensas cr2 WHERE cr2.persona_id = p.codigo AND cr2.fecha_canje >= ' + dateLimit + ') >= ?');
      params.push(filters.sales_amount_min);
    }
    
    if (filters.sales_amount_max !== undefined && filters.sales_amount_max !== null) {
      conditions.push('(SELECT SUM(cr2.puntos_canjeados) FROM canjes_recompensas cr2 WHERE cr2.persona_id = p.codigo AND cr2.fecha_canje >= ' + dateLimit + ') <= ?');
      params.push(filters.sales_amount_max);
    }
  }
  
  // Filtros de inactividad (días sin acumular puntos)
  if (filters.inactivity_days_min !== undefined && filters.inactivity_days_min !== null) {
    // Buscar la última fecha de actividad de puntos para cada usuario
    conditions.push('(SELECT MAX(lp.fecha) FROM logs_points lp WHERE lp.persona_id = p.codigo) <= DATE_SUB(NOW(), INTERVAL ? DAY)');
    params.push(filters.inactivity_days_min);
  }
  
  if (filters.inactivity_days_max !== undefined && filters.inactivity_days_max !== null) {
    conditions.push('(SELECT MAX(lp.fecha) FROM logs_points lp WHERE lp.persona_id = p.codigo) >= DATE_SUB(NOW(), INTERVAL ? DAY)');
    params.push(filters.inactivity_days_max);
  }
  
  // Filtros de vivienda
  if (filters.housing_types && filters.housing_types.length > 0) {
    // Join con tabla de propiedades
    if (!joins.some(j => j.includes('propiedades'))) {
      joins.push('LEFT JOIN propiedades prop ON p.codigo = prop.codigo');
    }
    
    const housingConditions = filters.housing_types.map(housing => 
      `prop.caracteristicas_vivienda LIKE ?`
    );
    conditions.push(`(${housingConditions.join(' OR ')})`);
    filters.housing_types.forEach(housing => {
      params.push(`%${housing}%`);
    });
  }
  
  // Filtros de animales
  if (filters.animal_types && filters.animal_types.length > 0) {
    // Join con tabla de propiedades
    if (!joins.some(j => j.includes('propiedades'))) {
      joins.push('LEFT JOIN propiedades prop ON p.codigo = prop.codigo');
    }
    
    const animalConditions = filters.animal_types.map(animal => 
      `prop.animales LIKE ?`
    );
    conditions.push(`(${animalConditions.join(' OR ')})`);
    filters.animal_types.forEach(animal => {
      params.push(`%${animal}%`);
    });
  }
  
  // Filtros de rol
  if (filters.rol && filters.rol.length > 0) {
    const rolPlaceholders = filters.rol.map(() => '?').join(', ');
    conditions.push(`p.rol IN (${rolPlaceholders})`);
    params.push(...filters.rol);
  }
  
  // Construir la consulta SQL
  let query = `
    SELECT DISTINCT p.codigo, p.cif, p.apellidos, p.nombres, p.fecha_nacimiento, 
           p.mail, p.telefono, p.puntos, p.rol, p.creado_en, p.status
    FROM personas p
  `;
  
  // Añadir joins
  if (joins.length > 0) {
    query += '\n' + joins.join('\n');
  }
  
  // Añadir condiciones
  if (conditions.length > 0) {
    query += '\nWHERE ' + conditions.join('\n  AND ');
  }
  
  // Ordenar por fecha de registro más reciente primero
  query += '\nORDER BY p.creado_en DESC';
  
  return {
    query,
    params,
    joins
  };
}

/**
 * Cuenta el número de usuarios que coinciden con los filtros del segmento
 * @param filters - Objeto con los filtros del segmento
 * @returns Objeto con la consulta SQL de conteo y parámetros
 */
export function buildSegmentCountQuery(filters: EmailSegmentFilters): { query: string; params: (string | number | boolean)[] } {
  // Manejar el caso en que filters es undefined o null
  if (!filters) {
    console.warn('buildSegmentCountQuery recibió filtros undefined o null');
    filters = {};
  }

  // Validar fechas antes de construir la consulta
  const validation = validateSegmentFilters(filters);
  if (!validation.valid) {
    throw new Error(validation.error || 'Formato de fecha inválido');
  }

  const params: (string | number | boolean)[] = [];
  const joins: string[] = [];
  const conditions: string[] = [];
  
  // Condición base: solo usuarios activos
  conditions.push('p.status = 1');
  
  // Filtros de datos personales
  if (filters.name_contains) {
    conditions.push('(p.nombres LIKE ? OR p.apellidos LIKE ?)');
    const searchTerm = `%${filters.name_contains}%`;
    params.push(searchTerm, searchTerm);
  }
  
  if (filters.email_contains) {
    conditions.push('p.mail LIKE ?');
    params.push(`%${filters.email_contains}%`);
  }
  
  if (filters.phone_contains) {
    conditions.push('p.telefono LIKE ?');
    params.push(`%${filters.phone_contains}%`);
  }
  
  if (filters.cif_contains) {
    conditions.push('p.cif LIKE ?');
    params.push(`%${filters.cif_contains}%`);
  }
  
  // Filtros de fechas
  if (filters.registration_date_from) {
    conditions.push('p.creado_en >= ?');
    params.push(filters.registration_date_from);
  }
  
  if (filters.registration_date_to) {
    conditions.push('p.creado_en <= ?');
    params.push(filters.registration_date_to);
  }
  
  if (filters.birth_date_from) {
    conditions.push('p.fecha_nacimiento >= ?');
    params.push(filters.birth_date_from);
  }
  
  if (filters.birth_date_to) {
    conditions.push('p.fecha_nacimiento <= ?');
    params.push(filters.birth_date_to);
  }
  
  // Filtros de puntos
  if (filters.points_min !== undefined && filters.points_min !== null) {
    conditions.push('p.puntos >= ?');
    params.push(filters.points_min);
  }
  
  if (filters.points_max !== undefined && filters.points_max !== null) {
    conditions.push('p.puntos <= ?');
    params.push(filters.points_max);
  }
  
  // Filtros de ventas
  if (filters.sales_days && (filters.sales_amount_min || filters.sales_amount_max)) {
    joins.push('INNER JOIN canjes_recompensas cr ON p.codigo = cr.persona_id');
    
    const dateLimit = `DATE_SUB(NOW(), INTERVAL ${filters.sales_days} DAY)`;
    conditions.push(`cr.fecha_canje >= ${dateLimit}`);
    
    if (filters.sales_amount_min !== undefined && filters.sales_amount_min !== null) {
      conditions.push('(SELECT SUM(cr2.puntos_canjeados) FROM canjes_recompensas cr2 WHERE cr2.persona_id = p.codigo AND cr2.fecha_canje >= ' + dateLimit + ') >= ?');
      params.push(filters.sales_amount_min);
    }
    
    if (filters.sales_amount_max !== undefined && filters.sales_amount_max !== null) {
      conditions.push('(SELECT SUM(cr2.puntos_canjeados) FROM canjes_recompensas cr2 WHERE cr2.persona_id = p.codigo AND cr2.fecha_canje >= ' + dateLimit + ') <= ?');
      params.push(filters.sales_amount_max);
    }
  }
  
  // Filtros de inactividad
  if (filters.inactivity_days_min !== undefined && filters.inactivity_days_min !== null) {
    conditions.push('(SELECT MAX(lp.fecha) FROM logs_points lp WHERE lp.persona_id = p.codigo) <= DATE_SUB(NOW(), INTERVAL ? DAY)');
    params.push(filters.inactivity_days_min);
  }
  
  if (filters.inactivity_days_max !== undefined && filters.inactivity_days_max !== null) {
    conditions.push('(SELECT MAX(lp.fecha) FROM logs_points lp WHERE lp.persona_id = p.codigo) >= DATE_SUB(NOW(), INTERVAL ? DAY)');
    params.push(filters.inactivity_days_max);
  }
  
  // Filtros de vivienda
  if (filters.housing_types && filters.housing_types.length > 0) {
    if (!joins.some(j => j.includes('propiedades'))) {
      joins.push('LEFT JOIN propiedades prop ON p.codigo = prop.codigo');
    }
    
    const housingConditions = filters.housing_types.map(housing => 
      `prop.caracteristicas_vivienda LIKE ?`
    );
    conditions.push(`(${housingConditions.join(' OR ')})`);
    filters.housing_types.forEach(housing => {
      params.push(`%${housing}%`);
    });
  }
  
  // Filtros de animales
  if (filters.animal_types && filters.animal_types.length > 0) {
    if (!joins.some(j => j.includes('propiedades'))) {
      joins.push('LEFT JOIN propiedades prop ON p.codigo = prop.codigo');
    }
    
    const animalConditions = filters.animal_types.map(animal => 
      `prop.animales LIKE ?`
    );
    conditions.push(`(${animalConditions.join(' OR ')})`);
    filters.animal_types.forEach(animal => {
      params.push(`%${animal}%`);
    });
  }
  
  // Filtros de rol
  if (filters.rol && filters.rol.length > 0) {
    const rolPlaceholders = filters.rol.map(() => '?').join(', ');
    conditions.push(`p.rol IN (${rolPlaceholders})`);
    params.push(...filters.rol);
  }
  
  // Construir la consulta SQL de conteo
  let query = `
    SELECT COUNT(DISTINCT p.codigo) as total
    FROM personas p
  `;
  
  if (joins.length > 0) {
    query += '\n' + joins.join('\n');
  }
  
  if (conditions.length > 0) {
    query += '\nWHERE ' + conditions.join('\n  AND ');
  }
  
  return {
    query,
    params
  };
}

/**
 * Genera un texto de previsualización de los filtros aplicados
 * @param filters - Objeto con los filtros del segmento
 * @returns Texto legible describiendo los filtros
 */
export function getFilterPreview(filters: EmailSegmentFilters): string {
  // Manejar el caso en que filters es undefined o null
  if (!filters) {
    return 'Todos los usuarios';
  }

  const parts: string[] = [];
  
  if (filters.name_contains) {
    parts.push(`Nombre contiene "${filters.name_contains}"`);
  }
  
  if (filters.email_contains) {
    parts.push(`Email contiene "${filters.email_contains}"`);
  }
  
  if (filters.registration_date_from || filters.registration_date_to) {
    const from = filters.registration_date_from || 'el inicio';
    const to = filters.registration_date_to || 'ahora';
    parts.push(`Registrado entre ${from} y ${to}`);
  }
  
  if (filters.birth_date_from || filters.birth_date_to) {
    const from = filters.birth_date_from || 'el inicio';
    const to = filters.birth_date_to || 'ahora';
    parts.push(`Nacido entre ${from} y ${to}`);
  }
  
  if (filters.points_min !== undefined || filters.points_max !== undefined) {
    const min = filters.points_min !== undefined ? filters.points_min : '0';
    const max = filters.points_max !== undefined ? filters.points_max : '∞';
    parts.push(`Puntos entre ${min} y ${max}`);
  }
  
  if (filters.sales_days && (filters.sales_amount_min || filters.sales_amount_max)) {
    const min = filters.sales_amount_min !== undefined ? filters.sales_amount_min : '0';
    const max = filters.sales_amount_max !== undefined ? filters.sales_amount_max : '∞';
    parts.push(`Ventas en ${filters.sales_days} días entre ${min} y ${max} puntos`);
  }
  
  if (filters.inactivity_days_min !== undefined || filters.inactivity_days_max !== undefined) {
    const min = filters.inactivity_days_min !== undefined ? filters.inactivity_days_min : '0';
    const max = filters.inactivity_days_max !== undefined ? filters.inactivity_days_max : '∞';
    parts.push(`Inactivo entre ${min} y ${max} días`);
  }
  
  if (filters.housing_types && filters.housing_types.length > 0) {
    parts.push(`Vivienda: ${filters.housing_types.join(', ')}`);
  }
  
  if (filters.animal_types && filters.animal_types.length > 0) {
    parts.push(`Animales: ${filters.animal_types.join(', ')}`);
  }
  
  if (filters.rol && filters.rol.length > 0) {
    parts.push(`Rol: ${filters.rol.join(', ')}`);
  }
  
  return parts.length > 0 ? parts.join(' | ') : 'Todos los usuarios';
}
