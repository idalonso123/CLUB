import { NextApiResponse } from "next";
import { withAuth, AuthenticatedRequest } from "@/middleware/authMiddleware";
import executeQuery from "@/lib/db";

async function searchUsersHandler(req: AuthenticatedRequest, res: NextApiResponse) {
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
    const {
      query = "",        // Término de búsqueda general
      role,              // Filtrar por rol
      status,            // Filtrar por estado (status/disabled)
      minPoints,         // Puntos mínimos
      maxPoints,         // Puntos máximos
      animal,            // Filtrar por tipo de animal
      property,          // Filtrar por tipo de propiedad
      minAge,            // Edad mínima
      maxAge,            // Edad máxima
      postalCode,        // Código postal
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
        d.direccion as address,
        pr.animales as animal,
        pr.caracteristicas_vivienda as property
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

    if (status !== undefined) {
      // Convert status to string first to handle both string and string[] types
      const statusStr = Array.isArray(status) ? status[0] : String(status);
      const statusValue = statusStr === "true" || statusStr === "1" ? 1 : 0;
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

    // Filtros adicionales
    if (animal) {
      // Si es un array, crear condiciones OR para cada valor
      if (Array.isArray(animal) && animal.length > 0) {
        const animalConditions = animal.map(() => `pr.animales LIKE ?`).join(' OR ');
        baseQuery += ` AND (${animalConditions})`;
        animal.forEach(item => {
          queryParams.push(`%${item}%`);
        });
      } 
      // Si es un string (compatibilidad con versiones anteriores)
      else if (typeof animal === 'string' && animal.trim() !== '') {
        baseQuery += ` AND pr.animales LIKE ?`;
        queryParams.push(`%${animal}%`);
      }
    }

    if (property) {
      // Si es un array, crear condiciones OR para cada valor
      if (Array.isArray(property) && property.length > 0) {
        const propertyConditions = property.map(() => `pr.caracteristicas_vivienda LIKE ?`).join(' OR ');
        baseQuery += ` AND (${propertyConditions})`;
        property.forEach(item => {
          queryParams.push(`%${item}%`);
        });
      } 
      // Si es un string (compatibilidad con versiones anteriores)
      else if (typeof property === 'string' && property.trim() !== '') {
        baseQuery += ` AND pr.caracteristicas_vivienda LIKE ?`;
        queryParams.push(`%${property}%`);
      }
    }

    if (minAge !== undefined && !isNaN(Number(minAge))) {
      // Calcular la fecha de nacimiento máxima basada en la edad mínima
      const currentDate = new Date();
      const maxBirthYear = currentDate.getFullYear() - Number(minAge);
      const maxBirthDate = new Date(maxBirthYear, currentDate.getMonth(), currentDate.getDate());
      baseQuery += ` AND p.fecha_nacimiento <= ?`;
      queryParams.push(maxBirthDate.toISOString().split('T')[0]);
    }

    if (maxAge !== undefined && !isNaN(Number(maxAge))) {
      // Calcular la fecha de nacimiento mínima basada en la edad máxima
      const currentDate = new Date();
      const minBirthYear = currentDate.getFullYear() - Number(maxAge);
      const minBirthDate = new Date(minBirthYear, currentDate.getMonth(), currentDate.getDate());
      baseQuery += ` AND p.fecha_nacimiento >= ?`;
      queryParams.push(minBirthDate.toISOString().split('T')[0]);
    }

    if (postalCode && typeof postalCode === 'string') {
      baseQuery += ` AND d.codpostal = ?`;
      queryParams.push(postalCode);
    }

    // Validar campo de ordenación para prevenir inyección SQL
    const validSortFields = ["id", "firstName", "lastName", "email", "role", "points", "registrationDate"];
    const sortFieldMapping: Record<string, string> = {
      id: "p.codigo",
      firstName: "p.nombres",
      lastName: "p.apellidos",
      email: "p.mail",
      role: "p.rol",
      points: "p.puntos",
      registrationDate: "p.creado_en"
    };
    
    // Determinar el campo de ordenación real
    const actualSortBy = validSortFields.includes(sortBy as string) ? sortBy : "id";
    // Validar dirección de ordenación
    const actualSortOrder = (sortOrder as string).toUpperCase() === "ASC" ? "ASC" : "DESC";

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
      status: user.status
    }));
    
    return res.status(200).json({
      success: true,
      users: formattedUsers,
      total: formattedUsers.length
    });
  } catch (error) {
    console.error("Error al buscar usuarios:", error);
    return res.status(500).json({
      success: false,
      message: "Error al buscar usuarios",
      error: (error as Error).message,
    });
  }
}

export default withAuth(searchUsersHandler);