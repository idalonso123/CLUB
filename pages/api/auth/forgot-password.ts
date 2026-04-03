import { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';
import executeQuery from '@/lib/db';
import nodemailer from 'nodemailer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Método no permitido' });
  }

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: 'El correo electrónico es requerido' });
  }

  try {
    // Verificar si el usuario existe
    let users;
    try {
      users = await executeQuery({
        query: 'SELECT codigo, mail FROM personas WHERE mail = ?',
        values: [email]
      }) as any[];
    } catch (dbError) {
      console.error('Error al buscar usuario:', dbError);
      return res.status(500).json({ 
        success: false, 
        message: 'Error al verificar el usuario. Por favor, inténtalo más tarde.' 
      });
    }

    if (users.length === 0) {
      // Por seguridad, no revelamos si el email existe o no
      return res.status(200).json({ 
        success: true, 
        message: 'Si el correo existe en nuestro sistema, recibirás un enlace para restablecer tu contraseña.' 
      });
    }

    const user = users[0];
    console.log('Usuario encontrado:', user);
    console.log('Código del usuario:', user.codigo);

    // Generar token de restablecimiento
    const resetToken = crypto.randomBytes(32).toString('hex');
    console.log('Token generado:', resetToken);
    
    // Formatear fecha para MySQL (YYYY-MM-DD HH:MM:SS)
    const tokenExpiry = new Date(Date.now() + 3600000); // 1 hora de expiración
    const tokenExpiryFormatted = tokenExpiry.toISOString().slice(0, 19).replace('T', ' ');
    console.log('Fecha de expiración formateada:', tokenExpiryFormatted);

    // Convertir user_id a número entero
    const userId = parseInt(user.codigo, 10);
    console.log('User ID (convertido):', userId);

    // Eliminar tokens anteriores del usuario
    console.log('Intentando eliminar tokens anteriores...');
    try {
      const deleteResult = await executeQuery({
        query: 'DELETE FROM password_reset_tokens WHERE user_id = ?',
        values: [userId]
      });
      console.log('Resultado de DELETE:', deleteResult);
    } catch (deleteError) {
      console.error('Error en DELETE:', deleteError);
      return res.status(500).json({ 
        success: false, 
        message: 'Error al eliminar tokens anteriores. Por favor, inténtalo más tarde.' 
      });
    }

    // Insertar nuevo token
    // Usar DATE_ADD de MySQL para evitar problemas de zona horaria
    console.log('Intentando insertar nuevo token...');
    console.log('Valores a insertar:', { userId, resetToken });
    try {
      const insertResult = await executeQuery({
        query: `
          INSERT INTO password_reset_tokens (user_id, token, expires_at, created_at) 
          VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 1 HOUR), NOW())
        `,
        values: [userId, resetToken]
      });
      console.log('Resultado de INSERT:', insertResult);
    } catch (insertError) {
      console.error('Error en INSERT:', insertError);
      const errorMessage = insertError instanceof Error ? insertError.message : 'Error desconocido';
      return res.status(500).json({ 
        success: false, 
        message: 'Error al guardar el token.',
        error: errorMessage
      });
    }

    // Crear enlace de restablecimiento
    const resetUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/cambiar-password?token=${resetToken}`;

    // Configurar transporter para enviar email
    let transporter;
    try {
      transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT || '587'),
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD
        }
      });
    } catch (transportError) {
      console.error('Error al crear el transporter:', transportError);
      return res.status(500).json({ 
        success: false, 
        message: 'Error de configuración del servidor de correo. Por favor, contacta con soporte.' 
      });
    }

    // Enviar email con el enlace de restablecimiento
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'ViveVerde <noreply@viveverde.com>',
      to: email,
      subject: 'Restablecer Contraseña - Club ViveVerde',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <img src="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/icons/Logo-ViveVerde.png" alt="ViveVerde" style="height: 60px;" />
          </div>
          <h1 style="color: #2d5a27; text-align: center;">Restablecer Contraseña</h1>
          <p style="color: #333; font-size: 16px; line-height: 1.6;">
            Hola,
          </p>
          <p style="color: #333; font-size: 16px; line-height: 1.6;">
            Has solicitado restablecer la contraseña de tu cuenta en Club ViveVerde.
          </p>
          <p style="color: #333; font-size: 16px; line-height: 1.6;">
            Haz clic en el siguiente botón para crear una nueva contraseña:
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #2d5a27; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
              Restablecer Contraseña
            </a>
          </div>
          <p style="color: #666; font-size: 14px; line-height: 1.6;">
            Si no has solicitado este cambio, puedes ignorar este correo. Este enlace caduca en 1 hora.
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
          <p style="color: #999; font-size: 12px; text-align: center;">
            Club ViveVerde - fidelity program<br/>
            Este es un correo electrónico automático, por favor no respondas a este mensaje.
          </p>
        </div>
      `
    };

    try {
      await transporter.sendMail(mailOptions);
    } catch (emailError) {
      console.error('Error al enviar email:', emailError);
      // No fallar la petición si el email no se envía, pero registrar el error
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Si el correo existe en nuestro sistema, recibirás un enlace para restablecer tu contraseña.' 
    });

  } catch (error) {
    console.error('Error en restablecimiento de contraseña:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor. Por favor, inténtalo más tarde.' 
    });
  }
}