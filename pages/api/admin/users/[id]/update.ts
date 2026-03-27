import { NextApiResponse } from "next";
import { withAuth, AuthenticatedRequest } from "@/middleware/authMiddleware";
import executeQuery from "@/lib/db";

async function updateUserHandler(req: AuthenticatedRequest, res: NextApiResponse) {
  // Verificar que el usuario sea administrador usando getRole()
  const userRole = await req.user?.getRole();
  if (userRole !== "administrador" && userRole !== "admin") {
    return res.status(403).json({
      success: false,
      message: "No tienes permiso para acceder a esta funcionalidad",
    });
  }

  // Solo permitir método PUT
  if (req.method !== "PUT") {
    return res.status(405).json({
      success: false,
      message: "Método no permitido",
    });
  }

  // Obtener ID del usuario
  const { id } = req.query;

  if (!id || Array.isArray(id)) {
    return res.status(400).json({
      success: false,
      message: "ID de usuario no válido",
    });
  }

  try {
    const {
      firstName,
      lastName,
      email,
      role,
      phone,
      city,
      postalCode,
      country,
      address,
      status,
    } = req.body;
    
    // Verificar si status está definido explícitamente
    const isStatusDefined = status !== undefined;

    // Validar datos obligatorios
    if (!firstName || !lastName || !email || !role) {
      return res.status(400).json({
        success: false,
        message: "Faltan campos obligatorios",
      });
    }

    // Iniciar transacción
    await executeQuery({ query: "START TRANSACTION" });

    try {
      // Obtener el estado actual del usuario si no se proporciona
    let currentStatus = status;
    
    if (!isStatusDefined) {
      const currentUserResult = await executeQuery({
        query: "SELECT status FROM personas WHERE codigo = ?",
        values: [id], 
      });

      const currentUser = (currentUserResult as any[])[0];
      if (currentUser) {
        currentStatus = currentUser.status;
      }
    }
    
    // Actualizar datos básicos y de cuenta en tabla personas
    await executeQuery({
      query: `
        UPDATE personas 
        SET nombres = ?, apellidos = ?, mail = ?, telefono = ?, rol = ?, status = ?
        WHERE codigo = ?
      `,
      values: [firstName, lastName, email, phone || null, role, isStatusDefined ? (status ? 1 : 0) : currentStatus, id],
    });

      // Verificar si ya existe dirección para este usuario
      const addressResult = await executeQuery({
        query: "SELECT 1 FROM direcciones WHERE codigo = ?",
        values: [id],
      });

      const addressExists = (addressResult as any[]).length > 0;

      if (addressExists) {
        // Actualizar dirección existente
        await executeQuery({
          query: `
            UPDATE direcciones
            SET provincia = ?, codpostal = ?, pais = ?, direccion = ?
            WHERE codigo = ?
          `,
          values: [city, postalCode, country, address === '' ? null : address, id],
        });
      } else {
        // Insertar nueva dirección
        await executeQuery({
          query: `
            INSERT INTO direcciones (provincia, codpostal, pais, direccion, codigo)
            VALUES (?, ?, ?, ?, ?)
          `,
          values: [city, postalCode, country, address === '' ? null : address, id],
        });
      }

      // Confirmar transacción
      await executeQuery({ query: "COMMIT" });

      // Obtener usuario actualizado
      const updatedResult = await executeQuery({
        query: `
          SELECT 
            p.codigo as id,
            p.nombres as firstName,
            p.apellidos as lastName,
            p.mail as email,
            p.telefono as phone,
            p.puntos as points,
            p.fecha_nacimiento as birthDate,
            p.foto_url as photoUrl,
            p.rol as role,
            p.status,
            p.creado_en as registrationDate,
            d.pais as country,
            d.provincia as city,
            d.codpostal as postalCode,
            d.direccion as address
          FROM personas p
          LEFT JOIN direcciones d ON p.codigo = d.codigo
          WHERE p.codigo = ?
        `,
        values: [id],
      });

      const updatedUsers = updatedResult as any[];

      if (updatedUsers.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Usuario no encontrado después de la actualización",
        });
      }

      const user = {
        ...updatedUsers[0],
        status: updatedUsers[0].status, // Mantener status como valor numérico (0 o 1)
        enabled: updatedUsers[0].status === 1 ? true : false  // Asegurar que enabled sea un booleano
      };

      return res.status(200).json({
        success: true,
        message: "Usuario actualizado correctamente",
        user,
      });
    } catch (error) {
      // Rollback en caso de error
      await executeQuery({ query: "ROLLBACK" });
      throw error;
    }
  } catch (error) {
    console.error("Error al actualizar usuario:", error);
    return res.status(500).json({
      success: false,
      message: "Error al actualizar el usuario",
      error: (error as Error).message,
    });
  }
}

export default withAuth(updateUserHandler);