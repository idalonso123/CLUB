import type { NextApiRequest, NextApiResponse } from "next";
import executeQuery from "@/lib/db";

type Data = {
  success: boolean;
  message: string;
  userId?: number;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Método no permitido" });
  }

  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ success: false, message: "Token requerido" });
  }

  try {
    // Buscar usuario por token
    const users = await executeQuery({
      query: `
        SELECT codigo, nombres, apellidos, email_verified, verification_token_expires 
        FROM personas 
        WHERE verification_token = ?
      `,
      values: [token],
    }) as any[];

    if (users.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: "Token inválido o expirado" 
      });
    }

    const user = users[0];

    // Verificar si ya estaba verificado
    if (user.email_verified) {
      return res.status(400).json({ 
        success: false, 
        message: "Este email ya ha sido verificado anteriormente" 
      });
    }

    // Verificar si el token ha expirado
    const now = new Date();
    const expiresDate = new Date(user.verification_token_expires);

    if (now > expiresDate) {
      return res.status(400).json({ 
        success: false, 
        message: "El enlace de verificación ha expirado. Solicita un nuevo email de verificación." 
      });
    }

    // Actualizar usuario: marcar como verificado y limpiar token
    await executeQuery({
      query: `
        UPDATE personas 
        SET email_verified = 1, 
            verification_token = NULL, 
            verification_token_expires = NULL,
            status = 1
        WHERE codigo = ?
      `,
      values: [user.codigo],
    });

    return res.status(200).json({ 
      success: true, 
      message: "Email verificado correctamente. Ya puedes iniciar sesión.",
      userId: user.codigo
    });
  } catch (error) {
    console.error("Error al verificar email:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Error al verificar el email" 
    });
  }
}