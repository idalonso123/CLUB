import type { NextApiRequest, NextApiResponse } from "next";
import nodemailer from "nodemailer";
import { nanoid } from "nanoid";
import executeQuery from "@/lib/db";

type Data = {
  success: boolean;
  message: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Método no permitido" });
  }

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: "Email requerido" });
  }

  try {
    // Buscar el usuario por email
    const users = await executeQuery({
      query: "SELECT codigo, nombres, apellidos, email_verified FROM personas WHERE mail = ?",
      values: [email],
    }) as any[];

    if (users.length === 0) {
      // No revelamos si el usuario existe o no por seguridad
      return res.status(200).json({ 
        success: true, 
        message: "Si el email existe, se ha enviado un enlace de verificación" 
      });
    }

    const user = users[0];

    // Verificar si ya está verificado
    if (user.email_verified) {
      return res.status(400).json({ 
        success: false, 
        message: "Este email ya está verificado" 
      });
    }

    // Generar token único
    const verificationToken = nanoid(32);
    const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

    // Guardar token en la base de datos
    await executeQuery({
      query: `
        UPDATE personas 
        SET verification_token = ?, verification_token_expires = ?
        WHERE codigo = ?
      `,
      values: [verificationToken, tokenExpires, user.codigo],
    });

    // Obtener nombre del usuario
    const firstName = user.nombres || "Usuario";
    const lastName = user.apellidos || "";

    // URL de verificación (usar variable de entorno para el dominio)
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://clubviveverde.com";
    const verificationUrl = `${baseUrl}/verify-email?token=${verificationToken}`;

    // Configurar el transporte de correo
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || "465"),
      secure: process.env.EMAIL_SECURE === "true",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    // Enviar el correo de verificación desde noreply
    await transporter.sendMail({
      from: `ViveVerde <${process.env.EMAIL_NOREPLY || process.env.EMAIL_FROM}>`,
      to: email,
      subject: "Verifica tu email - Club ViveVerde",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #166534; margin: 0;">Club ViveVerde</h1>
          </div>
          
          <h2 style="color: #333; margin-bottom: 20px;">¡Hola ${firstName} ${lastName}!</h2>
          
          <p style="color: #555; font-size: 16px; line-height: 1.6;">
            Gracias por registrarte en Club ViveVerde. Para completar tu registro, por favor verifica tu dirección de email haciendo clic en el botón siguiente:
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="background-color: #166534; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-size: 16px; font-weight: bold; display: inline-block;">
              Verificar mi email
            </a>
          </div>
          
          <p style="color: #555; font-size: 14px; line-height: 1.6;">
            Si el botón no funciona, puedes copiar y pegar el siguiente enlace en tu navegador:
          </p>
          
          <p style="color: #166534; font-size: 12px; word-break: break-all;">
            ${verificationUrl}
          </p>
          
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
          
          <p style="color: #777; font-size: 12px;">
            <strong>Información importante:</strong>
          </p>
          <ul style="color: #777; font-size: 12px; padding-left: 20px;">
            <li>Este enlace expira en 24 horas</li>
            <li>Si no has solicitado este email, puedes ignorarlo</li>
            <li>No compartas este enlace con nadie</li>
          </ul>
          
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
          
          <p style="color: #999; font-size: 11px; text-align: center;">
            Club ViveVerde - Tu comunidad verde<br>
            Este es un email automático, por favor no respondas a este mensaje.
          </p>
        </div>
      `,
    });

    return res.status(200).json({ 
      success: true, 
      message: "Email de verificación enviado" 
    });
  } catch (error) {
    console.error("Error al enviar email de verificación:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Error al enviar el email de verificación" 
    });
  }
}