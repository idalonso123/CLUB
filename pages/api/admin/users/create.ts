import { NextApiResponse } from "next";
import { withAuth, AuthenticatedRequest } from "@/middleware/authMiddleware";
import executeQuery from "@/lib/db";
import bcrypt from "bcryptjs";

async function createUserHandler(req: AuthenticatedRequest, res: NextApiResponse) {
  // Verificar que el usuario sea administrador usando getRole()
  const userRole = await req.user?.getRole();
  if (userRole !== "administrador" && userRole !== "admin") {
    return res.status(403).json({
      success: false,
      message: "No tienes permiso para acceder a esta funcionalidad",
    });
  }

  // Solo permitir método POST
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Método no permitido",
    });
  }

  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      birthDate,
      city,
      province,
      postalCode,
      country,
      role,
      password,
      points = 0, // Valor predeterminado
    } = req.body;

    // Validar datos obligatorios
    if (!firstName || !lastName || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: "Faltan campos obligatorios",
      });
    }

    // Verificar si el usuario ya existe
    const existingUserResult = await executeQuery({
      query: "SELECT 1 FROM personas WHERE mail = ?",
      values: [email.toLowerCase()],
    });

    if ((existingUserResult as any[]).length > 0) {
      return res.status(409).json({
        success: false,
        message: "Ya existe un usuario con ese correo electrónico",
        field: "email",
      });
    }

    // 1. Hashear la contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Iniciar transacción
    await executeQuery({ query: "START TRANSACTION" });

    try {
      // 2. Insertar en la tabla personas con todos los campos
      const personResult = await executeQuery({
        query: `
          INSERT INTO personas (nombres, apellidos, mail, telefono, fecha_nacimiento, puntos, password_hash, rol, status, creado_en)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `,
        values: [
          firstName,
          lastName,
          email.toLowerCase(),
          phone || null,
          birthDate || null,
          points,
          hashedPassword,
          role,
          1
        ],
      });

      // Obtener el ID generado
      const personId = (personResult as any).insertId;

      // No insertar en usuarios, ya no existe

      // 4. Insertar dirección si se proporciona
      if (city || province || postalCode || country) {
        await executeQuery({
          query: `
            INSERT INTO direcciones (codigo, ciudad, provincia, codpostal, pais)
            VALUES (?, ?, ?, ?, ?)
          `,
          values: [personId, city || null, province || null, postalCode || null, country || null],
        });
      }

      // Confirmar transacción
      await executeQuery({ query: "COMMIT" });

      // Registrar actividad administrativa
      try {
        // Verificar que req.user exista antes de acceder a sus propiedades
        if (req.user && req.user.userId && req.user.email) {
          await executeQuery({
            query: `
              INSERT INTO logs_admin (admin_id, action, entity_type, entity_id, details, created_at)
              VALUES (?, 'create', 'user', ?, ?, NOW())
            `,
            values: [
              req.user.userId,
              personId,
              JSON.stringify({
                action: "Usuario creado",
                adminUser: req.user.email,
                userEmail: email,
              }),
            ],
          });
        } else {
          console.warn("No se pudo registrar el log administrativo: req.user o sus propiedades son undefined");
        }
      } catch (logError) {
        console.error("Error al registrar log administrativo:", logError);
        // No interrumpimos el flujo por un error en el log
      }

      // Devolver respuesta exitosa
      return res.status(201).json({
        success: true,
        message: "Usuario creado correctamente",
        userId: personId,
      });
    } catch (error) {
      // Rollback en caso de error
      await executeQuery({ query: "ROLLBACK" });
      throw error;
    }
  } catch (error) {
    console.error("Error al crear usuario:", error);
    return res.status(500).json({
      success: false,
      message: "Error al crear el usuario",
      error: (error as Error).message,
    });
  }
}

export default withAuth(createUserHandler);