import executeQuery from "./db";

/**
 * Interfaz para los parámetros de filtrado de usuarios
 */
export interface UserFilterParams {
  query?: string;
  role?: string;
  status?: string;
  minPoints?: string;
  maxPoints?: string;
  sortBy?: string;
  sortOrder?: string;
}

/**
 * Función para obtener usuarios filtrados según los parámetros proporcionados
 * Esta función centraliza la lógica de filtrado para reutilizarla en diferentes endpoints
 */
export async function getFilteredUsers(params: UserFilterParams): Promise<any[]> {
  // Construir la consulta base
  let baseQuery = `
    SELECT 
      p.codigo as id,
      p.cif,
      p.nombres as firstName,
      p.apellidos as lastName,
      p.mail as email,
      p.telefono as phone,
      p.fecha_nacimiento as birthDate,
      p.puntos as points,
      u.foto_url as photoUrl,
      u.rol as role,
      u.status,
      u.creado_en as registrationDate,
      d.pais as country,
      d.ciudad as city,
      d.provincia as province,
      d.codpostal as postalCode
    FROM personas p
    LEFT JOIN usuarios u ON p.codigo = u.codigo
    LEFT JOIN direcciones d ON p.codigo = d.codigo
    WHERE 1=1
  `;

  // Array para almacenar valores para consultas preparadas
  const queryParams: any[] = [];

  // Añadir condiciones según los parámetros proporcionados
  if (params.query && params.query.trim() !== "") {
    const searchTerm = `%${params.query}%`;
    baseQuery += ` AND (p.nombres LIKE ? OR p.apellidos LIKE ? OR p.mail LIKE ? OR p.telefono LIKE ?)`;
    queryParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
  }

  if (params.role) {
    baseQuery += ` AND u.rol = ?`;
    queryParams.push(params.role);
  }

  if (params.status !== undefined) {
    // 'true', '1', true => 1 | 'false', '0', false => 0
    const statusValue = params.status === "true" || params.status === "1" ? 1 : 0;
    baseQuery += ` AND u.status = ?`;
    queryParams.push(statusValue);
  }

  if (params.minPoints && !isNaN(Number(params.minPoints))) {
    baseQuery += ` AND p.puntos >= ?`;
    queryParams.push(Number(params.minPoints));
  }

  if (params.maxPoints && !isNaN(Number(params.maxPoints))) {
    baseQuery += ` AND p.puntos <= ?`;
    queryParams.push(Number(params.maxPoints));
  }

  // Validar campo de ordenación para prevenir inyección SQL
  const validSortFields = ["id", "firstName", "lastName", "email", "role", "points", "registrationDate"];
  const actualSortBy = validSortFields.includes(params.sortBy || "") ? params.sortBy : "id";
  
  // Validar dirección de ordenación
  const actualSortOrder = (params.sortOrder || "").toUpperCase() === "ASC" ? "ASC" : "DESC";

  // Mapear campos front a campos DB para ordenación
  const sortFieldMapping: Record<string, string> = {
    id: "p.codigo",
    firstName: "p.nombres",
    lastName: "p.apellidos",
    email: "p.mail",
    role: "u.rol",
    points: "p.puntos",
    registrationDate: "u.creado_en"
  };
  
  // Añadir cláusula ORDER BY
  baseQuery += ` ORDER BY ${sortFieldMapping[actualSortBy || "id"]} ${actualSortOrder}`;
  
  // Ejecutar consulta 
  const usersResult = await executeQuery({
    query: baseQuery,
    values: queryParams,
  });

  // Convertir status a booleano
  const formattedUsers = (usersResult as any[]).map(user => ({
    ...user,
    status: user.status === 1,
    enabled: user.status === 1
  }));
  
  return formattedUsers;
}
