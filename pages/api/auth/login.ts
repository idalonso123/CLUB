import { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import * as cookie from 'cookie';
import executeQuery from '@/lib/db';
import { loginRateLimit } from '@/middleware/rateLimit';

/**
 * Middleware de rate limiting para login
 */
function rateLimitMiddleware(req: NextApiRequest, res: NextApiResponse, next: () => void) {
  return loginRateLimit(req, res, next);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Aplicar rate limiting
  rateLimitMiddleware(req, res, () => {});
  
  // Verificar si el rate limit fue excedido
  if (res.headersSent) {
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Método no permitido' });
  }

  try {
    const { email, password } = req.body;
    
    // Verificar que se proporcionaron email y password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email y contraseña son requeridos'
      });
    }
    
    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Formato de email inválido'
      });
    }
    
    // Buscar usuario con ese email
    const result = await executeQuery({
      query: `
        SELECT 
          p.codigo, 
          p.nombres, 
          p.apellidos, 
          p.mail, 
          p.telefono,
          p.password_hash, 
          p.foto_url,
          p.rol,
          p.status,
          p.email_verified
        FROM personas p
        WHERE p.mail = ?
      `,
      values: [email]
    });
    
    const users = result as any[];
    
    if (users.length === 0) {
      // Registrar intento de inicio fallido (usuario no existe)
      try {
        await logFailedLogin(null, email, req.headers['user-agent'] as string, req.socket.remoteAddress || '');
      } catch (logError) {
        console.error('Error registrando intento de login fallido:', logError);
      }
      
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }
    
    const user = users[0];
    
    // IMPORTANTE: Verificar primero si el email ha sido verificado
    // Esto es necesario porque cuando un usuario se registra pero no verifica,
    // tanto status como email_verified pueden ser 0
    if (!user.email_verified) {
      // Registrar intento de inicio fallido (email no verificado)
      try {
        await logFailedLogin(user.codigo, email, req.headers['user-agent'] as string, req.socket.remoteAddress || '', 'Email no verificado');
      } catch (logError) {
        console.error('Error registrando intento de login fallido (email no verificado):', logError);
      }
      
      return res.status(403).json({
        success: false,
        message: 'Por favor verifica tu email antes de iniciar sesión. Revisa tu bandeja de entrada.',
        emailNotVerified: true
      });
    }
    
    // Verificar si la cuenta está habilitada (solo si el email ya está verificado)
    if (user.status !== 1) {
      // Registrar intento de inicio fallido (cuenta desactivada)
      try {
        await logFailedLogin(user.codigo, email, req.headers['user-agent'] as string, req.socket.remoteAddress || '', 'Cuenta desactivada');
      } catch (logError) {
        console.error('Error registrando intento de login fallido (cuenta desactivada):', logError);
      }
      
      return res.status(403).json({
        success: false,
        message: 'La cuenta se encuentra desactivada. Póngase en contacto con nuestro equipo.',
        accountDisabled: true
      });
    }
    
    // Verificar la contraseña
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!isValidPassword) {
      // Registrar intento de inicio fallido (contraseña incorrecta)
      try {
        await logFailedLogin(user.codigo, email, req.headers['user-agent'] as string, req.socket.remoteAddress || '', 'Contraseña incorrecta');
      } catch (logError) {
        console.error('Error registrando intento de login fallido (contraseña incorrecta):', logError);
      }
      
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }
    
    // Generar token JWT
    const JWT_SECRET = process.env.JWT_SECRET;
    
    // Verificar que JWT_SECRET esté configurado en producción
    if (!JWT_SECRET && process.env.NODE_ENV === 'production') {
      console.error('JWT_SECRET no está configurado en producción');
      return res.status(500).json({
        success: false,
        message: 'Error de configuración del servidor'
      });
    }
    
    const token = jwt.sign(
      { 
        userId: user.codigo,
        email: user.mail,
        role: user.rol,
        status: user.status // Incluir también esta info en el token
      },
      JWT_SECRET || 'club-viveverde-secret-key',
      { expiresIn: '1d' } // 1 día de expiración
    );
    
    // Establecer cookie segura
    res.setHeader('Set-Cookie', cookie.serialize('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      sameSite: 'strict',
      maxAge: 86400, // 1 día en segundos
      path: '/'
    }));
    
    // Registrar inicio de sesión exitoso
    try {
      await logSuccessfulLogin(user.codigo, req.headers['user-agent'] as string, req.socket.remoteAddress || '');
    } catch (logError) {
      console.error('Error registrando inicio de sesión exitoso:', logError);
    }

    // Retornar información del usuario autenticado con campos renombrados para mayor claridad
    return res.status(200).json({
      success: true,
      user: {
        id: user.codigo,
        firstName: user.nombres,
        lastName: user.apellidos,
        email: user.mail,
        phone: user.telefono,
        photoUrl: user.foto_url,
        role: user.rol,
        enabled: user.status === 1  // Convertir explícitamente a booleano
      },
      token: token // Opcional: incluir el token en la respuesta para clientes que no usen cookies
    });
  } catch (error) {
    console.error('Error en login:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al procesar la solicitud',
      error: (error as Error).message
    });
  }
}

// Función para registrar inicio de sesión exitoso
async function logSuccessfulLogin(userId: number, userAgent: string, ipAddress: string) {
  try {
    await executeQuery({
      query: `
        INSERT INTO logs_auth (
          user_id, action, ip_address, user_agent, details, created_at
        ) VALUES (?, ?, ?, ?, ?, NOW())
      `,
      values: [
        userId,
        'login',
        ipAddress,
        userAgent,
        JSON.stringify({
          status: 'success'
        })
      ]
    });
  } catch (error) {
    console.error('Error al guardar log de autenticación:', error);
  }
}

// Función para registrar intento de inicio de sesión fallido
async function logFailedLogin(userId: number | null, email: string, userAgent: string, ipAddress: string, reason: string = 'Credenciales inválidas') {
  try {
    // Si el usuario no existe, no tendremos ID, pero guardamos el correo intentado
    if (!userId) {
      await executeQuery({
        query: `
          INSERT INTO logs_auth (
            action, ip_address, user_agent, details, created_at
          ) VALUES (?, ?, ?, ?, NOW())
        `,
        values: [
          'failed_login',
          ipAddress,
          userAgent,
          JSON.stringify({
            status: 'failed',
            email: email,
            reason: reason
          })
        ]
      });
    } else {
      await executeQuery({
        query: `
          INSERT INTO logs_auth (
            user_id, action, ip_address, user_agent, details, created_at
          ) VALUES (?, ?, ?, ?, ?, NOW())
        `,
        values: [
          userId,
          'failed_login',
          ipAddress,
          userAgent,
          JSON.stringify({
            status: 'failed',
            reason: reason
          })
        ]
      });
    }
  } catch (error) {
    console.error('Error al guardar log de autenticación fallida:', error);
  }
}