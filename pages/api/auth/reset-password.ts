import { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import executeQuery from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Método no permitido' });
  }

  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ success: false, message: 'Token y nueva contraseña son requeridos' });
  }

  // Validar requisitos de contraseña robusta
  if (newPassword.length < 8) {
    return res.status(400).json({ 
      success: false, 
      message: 'La contraseña debe tener al menos 8 caracteres' 
    });
  }
  
  if (!/[A-Z]/.test(newPassword)) {
    return res.status(400).json({ 
      success: false, 
      message: 'La contraseña debe contener al menos una mayúscula' 
    });
  }
  
  if (!/[a-z]/.test(newPassword)) {
    return res.status(400).json({ 
      success: false, 
      message: 'La contraseña debe contener al menos una minúscula' 
    });
  }
  
  if (!/[0-9]/.test(newPassword)) {
    return res.status(400).json({ 
      success: false, 
      message: 'La contraseña debe contener al menos un número' 
    });
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) {
    return res.status(400).json({ 
      success: false, 
      message: 'La contraseña debe contener al menos un carácter especial (ej: !@#$%^&*)' 
    });
  }

  try {
    // Verificar que el token existe
    console.log('Buscando token:', token);
    
    const tokens = await executeQuery({
      query: `
        SELECT prt.user_id, prt.expires_at, prt.used, prt.created_at, p.mail, p.nombres, p.apellidos
        FROM password_reset_tokens prt
        JOIN personas p ON prt.user_id = p.codigo
        WHERE prt.token = ?
      `,
      values: [token]
    }) as any[];

    console.log('Tokens encontrados:', tokens);

    if (tokens.length === 0) {
      console.log('Token no encontrado en la base de datos');
      return res.status(400).json({ 
        success: false, 
        message: 'El enlace de restablecimiento ha expirado o es inválido. Por favor, solicita uno nuevo.' 
      });
    }

    const tokenData = tokens[0];
    
    // Verificar si el token ya fue usado
    if (tokenData.used == 1) {
      console.log('Token ya fue usado');
      return res.status(400).json({ 
        success: false, 
        message: 'Este enlace ya ha sido utilizado. Por favor, solicita uno nuevo.' 
      });
    }
    
    // Verificar si el token ha expirado
    const now = new Date();
    // Convertir la fecha de MySQL a objeto Date de forma robusta
    let expiresAt;
    if (typeof tokenData.expires_at === 'string') {
      // Si es un string, parsear manualmente (formato: YYYY-MM-DD HH:MM:SS)
      const parts = tokenData.expires_at.match(/(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})/);
      if (parts) {
        expiresAt = new Date(
          parseInt(parts[1]),
          parseInt(parts[2]) - 1,
          parseInt(parts[3]),
          parseInt(parts[4]),
          parseInt(parts[5]),
          parseInt(parts[6])
        );
      } else {
        expiresAt = new Date(tokenData.expires_at);
      }
    } else {
      expiresAt = new Date(tokenData.expires_at);
    }
    
    console.log('Fecha actual (UTC):', now.toISOString());
    console.log('Fecha de expiración (raw):', tokenData.expires_at);
    console.log('Fecha de expiración (parseada):', expiresAt.toISOString());
    console.log('¿Ha expirado?', expiresAt <= now);
    
    // Añadir un buffer de 5 minutos para evitar problemas de zona horaria
    const bufferTime = 5 * 60 * 1000; // 5 minutos en milisegundos
    if (expiresAt.getTime() + bufferTime <= now.getTime()) {
      console.log('Token ha expirado (con buffer de 5 min)');
      return res.status(400).json({ 
        success: false, 
        message: 'El enlace de restablecimiento ha expirado. Por favor, solicita uno nuevo.' 
      });
    }

    // Hash de la nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Actualizar contraseña del usuario Y marcar email como verificado
    // (Esto es importante porque si el usuario no había verificado su email antes,
    // el restablecimiento de contraseña es una forma válida de verificar la propiedad del email)
    await executeQuery({
      query: 'UPDATE personas SET password_hash = ?, email_verified = 1 WHERE codigo = ?',
      values: [hashedPassword, tokenData.user_id]
    });

    // Marcar token como usado
    await executeQuery({
      query: 'UPDATE password_reset_tokens SET used = 1 WHERE token = ?',
      values: [token]
    });

    // Registrar en logs de autenticación
    await executeQuery({
      query: `
        INSERT INTO logs_auth (user_id, action, details, created_at) 
        VALUES (?, 'password_reset', ?, NOW())
      `,
      values: [tokenData.user_id, `Password reset via email to ${tokenData.mail}`]
    });

    return res.status(200).json({ 
      success: true, 
      message: 'Tu contraseña ha sido actualizada correctamente. Ya puedes iniciar sesión con tu nueva contraseña.' 
    });

  } catch (error) {
    console.error('Error al restablecer contraseña:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor. Por favor, inténtalo más tarde.' 
    });
  }
}