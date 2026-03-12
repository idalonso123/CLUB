import { NextApiResponse } from "next";
import { withAuth, AuthenticatedRequest } from "@/middleware/authMiddleware";
import executeQuery from "@/lib/db";

/**
 * Función para obtener datos de usuarios filtrados para exportación
 */
export async function getExportData(req: AuthenticatedRequest) {
  // Obtener parámetros de filtrado
  const {
    query = "",        // Término de búsqueda general
    role,              // Filtrar por rol
    status,            // Filtrar por estado (status/disabled)
    minPoints,         // Puntos mínimos
    maxPoints,         // Puntos máximos
    sortBy = "id",     // Campo para ordenar
    sortOrder = "DESC", // Orden (ASC o DESC)
  } = req.query;

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
      p.foto_url as photoUrl,
      p.rol as role,
      p.status,
      p.creado_en as registrationDate,
      d.pais as country,
      d.provincia as city,
      d.codpostal as postalCode,
      pr.animales,
      pr.caracteristicas_vivienda as housingFeatures
    FROM personas p
    LEFT JOIN direcciones d ON p.codigo = d.codigo
    LEFT JOIN propiedades pr ON p.codigo = pr.codigo
    WHERE 1=1
  `;

  // Array para almacenar valores para consultas preparadas
  const queryParams: any[] = [];

  // Añadir condiciones según los parámetros proporcionados
  if (query && typeof query === 'string' && query.trim() !== "") {
    const searchTerm = `%${query}%`;
    baseQuery += ` AND (p.nombres LIKE ? OR p.apellidos LIKE ? OR p.mail LIKE ? OR p.telefono LIKE ?)`;
    queryParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
  }

  if (role && typeof role === 'string') {
    baseQuery += ` AND p.rol = ?`;
    queryParams.push(role);
  }

  if (status !== undefined && status !== '') {
    // 'true', '1' => 1 | 'false', '0' => 0
    const statusValue = status === "true" || status === "1" ? 1 : 0;
    baseQuery += ` AND p.status = ?`;
    queryParams.push(statusValue);
  }

  if (minPoints !== undefined && !isNaN(Number(minPoints))) {
    baseQuery += ` AND p.puntos >= ?`;
    queryParams.push(Number(minPoints));
  }

  if (maxPoints !== undefined && !isNaN(Number(maxPoints))) {
    baseQuery += ` AND p.puntos <= ?`;
    queryParams.push(Number(maxPoints));
  }

  // Validar campo de ordenación para prevenir inyección SQL
  const validSortFields = ["id", "firstName", "lastName", "email", "role", "points", "registrationDate"];
  const actualSortBy = validSortFields.includes(sortBy as string) ? sortBy : "id";
  
  // Validar dirección de ordenación
  const actualSortOrder = (sortOrder as string).toUpperCase() === "ASC" ? "ASC" : "DESC";

  // Mapear campos front a campos DB para ordenación
  const sortFieldMapping: Record<string, string> = {
    id: "p.codigo",
    firstName: "p.nombres",
    lastName: "p.apellidos",
    email: "p.mail",
    role: "p.rol",
    points: "p.puntos",
    registrationDate: "p.creado_en"
  };
  
  // Añadir cláusula ORDER BY
  baseQuery += ` ORDER BY ${sortFieldMapping[actualSortBy as string]} ${actualSortOrder}`;
  
  // Ejecutar consulta sin paginación
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

// Handler principal de la API
async function exportHandler(req: AuthenticatedRequest, res: NextApiResponse) {
  // Verificar que el usuario sea administrador usando getRole()
  const userRole = await req.user?.getRole();
  if (userRole !== "administrador" && userRole !== "admin") {
    return res.status(403).json({
      success: false,
      message: "No tienes permiso para acceder a esta funcionalidad",
    });
  }

  // Solo permitir método GET
  if (req.method !== "GET") {
    return res.status(405).json({
      success: false,
      message: "Método no permitido",
    });
  }

  try {
    const userData = await getExportData(req);

    return res.status(200).json({
      success: true,
      message: "Datos disponibles para exportación",
      count: userData.length
    });
  } catch (error) {
    console.error("Error al preparar datos para exportación:", error);
    return res.status(500).json({
      success: false,
      message: "Error al preparar datos para exportación",
      error: (error as Error).message,
    });
  }
}

export default withAuth(exportHandler);
