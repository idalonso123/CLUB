import { NextApiRequest, NextApiResponse } from 'next';
import executeQuery from '@/lib/db';
import bcrypt from 'bcryptjs';
import formidable from 'formidable';
import { promises as fs } from 'fs';
import path from 'path';
import { nanoid } from 'nanoid';
import nodemailer from 'nodemailer';
import { countriesData } from '@/lib/utils/countries';

export const config = {
  api: {
    bodyParser: false,
  },
};

interface ParsedData {
  firstName: string;
  lastName: string;
  dni: string;
  email: string;
  password: string;
  birthDate: string;
  phonePrefix: string;
  phone: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  caracteristicas_vivienda: string[];
  animales: string[];
  photo?: any;
  // Campos GDPR
  termsAccepted: boolean;
  termsVersion: string;
  termsAcceptedAt: string;
  privacyPolicyAccepted: boolean;
  privacyPolicyVersion: string;
  privacyPolicyAcceptedAt: string;
  browserUserAgent: string;
  browserLanguage: string;
  browserPlatform: string;
  termsEffectiveDate: string;
}

// Función para parsear datos JSON
async function parseJsonBody(req: NextApiRequest): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
}

// Función para parsear FormData
async function parseFormData(req: NextApiRequest): Promise<{ fields: any; files: any }> {
  const uploadDir = path.join(process.cwd(), 'uploads');
  try {
    await fs.mkdir(uploadDir, { recursive: true });
  } catch (err) {
    console.warn('Error al crear directorio de uploads:', err);
  }

  return new Promise((resolve, reject) => {
    let form;
    try {
      const options = {
        keepExtensions: true,
        maxFileSize: 5 * 1024 * 1024,
        multiples: true,
        uploadDir: uploadDir,
        filter: (part: any) => {
          if (part.name === 'photo') {
            return ['image/jpeg', 'image/png'].includes(part.mimetype || '');
          }
          return true;
        },
      };

      if (typeof formidable === 'function') {
        form = formidable(options);
      } else {
        form = new (formidable as any).IncomingForm();
        Object.assign(form, options);
      }

      form.parse(req, (err: any, fields: any, files: any) => {
        if (err) {
          reject(err);
        } else {
          resolve({ fields, files });
        }
      });
    } catch (e) {
      reject(e);
    }
  });
}

// Función helper para obtener valor de campo (array o string)
function getFieldValue(fields: any, fieldName: string): any {
  const value = fields[fieldName];
  if (value === undefined || value === null) return '';
  if (Array.isArray(value)) return value[0];
  return value;
}

// Función helper para obtener array de valores
function getFieldArray(fields: any, fieldName: string): string[] {
  const value = fields[fieldName];
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return [value];
}

// Función helper para obtener valor booleano
function getFieldBoolean(fields: any, fieldName: string): boolean {
  const value = fields[fieldName];
  if (value === undefined || value === null) return false;
  if (typeof value === 'boolean') return value;
  if (Array.isArray(value)) {
    const strValue = String(value[0]).toLowerCase();
    return strValue === 'true' || strValue === '1';
  }
  return String(value).toLowerCase() === 'true' || String(value) === '1';
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Método no permitido' });
  }

  try {
    console.log('Procesando formulario de registro');

    // Determinar el tipo de contenido
    const contentType = req.headers['content-type'] || '';
    let data: ParsedData;
    let files: any = {};

    // Parsear según el tipo de contenido
    if (contentType.includes('application/json')) {
      console.log('Procesando como JSON');
      const jsonBody = await parseJsonBody(req);
      data = {
        firstName: jsonBody.firstName || '',
        lastName: jsonBody.lastName || '',
        dni: jsonBody.dni || '',
        email: jsonBody.email || '',
        password: jsonBody.password || '',
        birthDate: jsonBody.birthDate || '',
        phonePrefix: jsonBody.phonePrefix || '+34',
        phone: jsonBody.phone || '',
        city: jsonBody.city || '',
        province: jsonBody.province || '',
        postalCode: jsonBody.postalCode || '',
        country: jsonBody.country || '',
        caracteristicas_vivienda: jsonBody.caracteristicas_vivienda || [],
        animales: jsonBody.animales || [],
        termsAccepted: jsonBody.termsAccepted || false,
        termsVersion: jsonBody.termsVersion || '',
        termsAcceptedAt: jsonBody.termsAcceptedAt || '',
        privacyPolicyAccepted: jsonBody.privacyPolicyAccepted || false,
        privacyPolicyVersion: jsonBody.privacyPolicyVersion || '',
        privacyPolicyAcceptedAt: jsonBody.privacyPolicyAcceptedAt || '',
        browserUserAgent: jsonBody.browserInfo?.userAgent || '',
        browserLanguage: jsonBody.browserInfo?.language || '',
        browserPlatform: jsonBody.browserInfo?.platform || '',
        termsEffectiveDate: jsonBody.termsEffectiveDate || '',
      };
    } else {
      console.log('Procesando como FormData');
      const { fields, files: parsedFiles } = await parseFormData(req);
      files = parsedFiles;

      data = {
        firstName: getFieldValue(fields, 'firstName'),
        lastName: getFieldValue(fields, 'lastName'),
        dni: getFieldValue(fields, 'dni'),
        email: getFieldValue(fields, 'email'),
        password: getFieldValue(fields, 'password'),
        birthDate: getFieldValue(fields, 'birthDate'),
        phonePrefix: getFieldValue(fields, 'phonePrefix') || '+34',
        phone: getFieldValue(fields, 'phone'),
        city: getFieldValue(fields, 'city'),
        province: getFieldValue(fields, 'province'),
        postalCode: getFieldValue(fields, 'postalCode'),
        country: getFieldValue(fields, 'country'),
        caracteristicas_vivienda: getFieldArray(fields, 'caracteristicas_vivienda'),
        animales: getFieldArray(fields, 'animales'),
        termsAccepted: getFieldBoolean(fields, 'termsAccepted'),
        termsVersion: getFieldValue(fields, 'termsVersion'),
        termsAcceptedAt: getFieldValue(fields, 'termsAcceptedAt'),
        privacyPolicyAccepted: getFieldBoolean(fields, 'privacyPolicyAccepted'),
        privacyPolicyVersion: getFieldValue(fields, 'privacyPolicyVersion'),
        privacyPolicyAcceptedAt: getFieldValue(fields, 'privacyPolicyAcceptedAt'),
        browserUserAgent: getFieldValue(fields, 'browserUserAgent'),
        browserLanguage: getFieldValue(fields, 'browserLanguage'),
        browserPlatform: getFieldValue(fields, 'browserPlatform'),
        termsEffectiveDate: getFieldValue(fields, 'termsEffectiveDate'),
      };
    }

    console.log('Datos parseados:', {
      email: data.email,
      hasTerms: data.termsAccepted,
      termsVersion: data.termsVersion,
      hasPrivacyPolicy: data.privacyPolicyAccepted,
      privacyPolicyVersion: data.privacyPolicyVersion
    });

    // Validar que se han aceptado los términos y condiciones (GDPR)
    if (!data.termsAccepted) {
      return res.status(400).json({
        success: false,
        message: 'Debes aceptar los términos y condiciones para registrarte',
        field: 'terms'
      });
    }

    // Validar que se ha aceptado la política de privacidad (GDPR)
    if (!data.privacyPolicyAccepted) {
      return res.status(400).json({
        success: false,
        message: 'Debes aceptar la política de privacidad para registrarte',
        field: 'privacyPolicy'
      });
    }

    // Validar requisitos de contraseña
    if (!data.password) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña es requerida',
        field: 'password'
      });
    }

    if (data.password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña debe tener al menos 8 caracteres',
        field: 'password'
      });
    }

    if (!/[A-Z]/.test(data.password)) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña debe contener al menos una mayúscula',
        field: 'password'
      });
    }

    if (!/[a-z]/.test(data.password)) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña debe contener al menos una minúscula',
        field: 'password'
      });
    }

    if (!/[0-9]/.test(data.password)) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña debe contener al menos un número',
        field: 'password'
      });
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(data.password)) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña debe contener al menos un carácter especial (ej: !@#$%^&*)',
        field: 'password'
      });
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Procesar y guardar la foto si se ha proporcionado
    let fotoUrl = null;
    if (files && files.photo) {
      const photoFile = Array.isArray(files.photo) ? files.photo[0] : files.photo;

      if (photoFile && photoFile.filepath) {
        console.log('Procesando foto de perfil:', photoFile.originalFilename);

        try {
          await fs.access(photoFile.filepath);

          const fileExt = path.extname(photoFile.originalFilename || 'photo.jpg');
          const newFilename = `${nanoid(10)}${fileExt}`;
          const targetPath = path.join(process.cwd(), 'uploads', newFilename);

          try {
            const fileBuffer = await fs.readFile(photoFile.filepath);
            await fs.writeFile(targetPath, fileBuffer);
            fotoUrl = `/uploads/${newFilename}`;
          } catch (writeError) {
            console.error('Error al leer o escribir el archivo:', writeError);
            try {
              await fs.copyFile(photoFile.filepath, targetPath);
              fotoUrl = `/uploads/${newFilename}`;
            } catch (copyError) {
              console.error('Error al copiar el archivo:', copyError);
            }
          }

          // Eliminar archivo temporal
          try {
            await fs.unlink(photoFile.filepath);
          } catch (error) {
            console.warn('No se pudo eliminar el archivo temporal:', error);
          }
        } catch (error) {
          console.error('Error al procesar la foto:', error);
        }
      }
    }

    // Comprobar si ya existe un usuario con ese correo electrónico
    const existingUserByEmail = await executeQuery({
      query: `SELECT codigo FROM personas WHERE mail = ?`,
      values: [data.email]
    });

    if ((existingUserByEmail as any[]).length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Ya existe un usuario con este correo electrónico',
        field: 'email'
      });
    }

    // Comprobar si ya existe un usuario con ese teléfono
    const fullPhone = data.phone ? `${data.phonePrefix} ${data.phone}` : '';
    if (fullPhone) {
      const existingUserByPhone = await executeQuery({
        query: `SELECT codigo FROM personas WHERE telefono = ?`,
        values: [fullPhone]
      });

      if ((existingUserByPhone as any[]).length > 0) {
        return res.status(409).json({
          success: false,
          message: 'Ya existe un usuario con este número de teléfono',
          field: 'phone'
        });
      }
    }

    // Comprobar si ya existe un usuario con ese DNI
    if (!data.dni) {
      return res.status(400).json({
        success: false,
        message: 'El DNI es requerido',
        field: 'dni'
      });
    }

    const existingUserByDni = await executeQuery({
      query: `SELECT codigo FROM personas WHERE dni = ?`,
      values: [data.dni]
    });

    if ((existingUserByDni as any[]).length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Ya existe un usuario con este DNI',
        field: 'dni'
      });
    }

    // Iniciar transacción
    await executeQuery({ query: 'START TRANSACTION' });

    try {
      // Generar token de verificación
      const verificationToken = nanoid(32);
      const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

      // Preparar datos de auditoría GDPR
      // Convertir fechas ISO8601 a formato MySQL (YYYY-MM-DD HH:MM:SS)
      const formatDateForMySQL = (dateStr: string): string => {
        if (!dateStr) return new Date().toISOString().slice(0, 19).replace('T', ' ');
        // Si ya viene en formato ISO8601 con Z, convertir correctamente
        const date = new Date(dateStr);
        return date.toISOString().slice(0, 19).replace('T', ' ');
      };

      const termsAcceptedAt = formatDateForMySQL(data.termsAcceptedAt);
      const privacyPolicyAcceptedAt = formatDateForMySQL(data.privacyPolicyAcceptedAt);
      const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';

      // Insertar en tabla personas con campos GDPR
      console.log('Insertando usuario con campos GDPR');

      const personResult = await executeQuery({
        query: `
          INSERT INTO personas (
            apellidos, nombres, dni, mail, telefono, fecha_nacimiento,
            password_hash, foto_url, rol, status, email_verified,
            verification_token, verification_token_expires,
            terms_accepted, terms_version, terms_accepted_at,
            privacy_policy_accepted, privacy_policy_version, privacy_policy_accepted_at,
            browser_user_agent, browser_language, browser_platform,
            registration_ip, terms_effective_date
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        values: [
          data.lastName,
          data.firstName,
          data.dni,
          data.email,
          fullPhone,
          data.birthDate || null,
          hashedPassword,
          fotoUrl,
          'usuario',
          0,
          0,
          verificationToken,
          tokenExpires,
          data.termsAccepted ? 1 : 0,
          data.termsVersion || '1.0.0',
          termsAcceptedAt,
          data.privacyPolicyAccepted ? 1 : 0,
          data.privacyPolicyVersion || '1.0.0',
          privacyPolicyAcceptedAt,
          data.browserUserAgent || '',
          data.browserLanguage || '',
          data.browserPlatform || '',
          ipAddress,
          data.termsEffectiveDate || ''
        ],
      });

      console.log('Usuario insertado con GDPR, ID:', (personResult as any).insertId);
      const personaId = (personResult as any).insertId;

      // Insertar en tabla direcciones
      let countryName = '';
      if (data.country) {
        try {
          const countryObj = countriesData.countries.find((c: any) => c.code === data.country);
          if (countryObj) {
            countryName = countryObj.name;
          }
        } catch (error) {
          console.error('Error al obtener el nombre del país:', error);
          countryName = data.country;
        }
      }

      await executeQuery({
        query: `
          INSERT INTO direcciones (ciudad, provincia, codpostal, pais, codigo)
          VALUES (?, ?, ?, ?, ?)
        `,
        values: [
          data.city,
          data.province,
          data.postalCode,
          countryName,
          personaId
        ],
      });

      // Insertar en tabla propiedades
      await executeQuery({
        query: `
          INSERT INTO propiedades (caracteristicas_vivienda, animales, codigo)
          VALUES (?, ?, ?)
        `,
        values: [
          data.caracteristicas_vivienda.length > 0 ? data.caracteristicas_vivienda.join(',') : null,
          data.animales.length > 0 ? data.animales.join(',') : null,
          personaId
        ],
      });

      // Registrar evento en logs_admin con información GDPR
      try {
        await executeQuery({
          query: `
            INSERT INTO logs_admin
            (admin_id, action, entity_type, entity_id, details, created_at)
            VALUES (?, ?, ?, ?, ?, NOW())
          `,
          values: [
            personaId,
            'user_create',
            'user',
            personaId,
            JSON.stringify({
              method: 'self_registration',
              email: data.email,
              firstName: data.firstName,
              lastName: data.lastName,
              hasPhoto: !!fotoUrl,
              gdprConsent: {
                termsAccepted: data.termsAccepted,
                termsVersion: data.termsVersion,
                termsAcceptedAt: termsAcceptedAt,
                privacyPolicyAccepted: data.privacyPolicyAccepted,
                privacyPolicyVersion: data.privacyPolicyVersion,
                privacyPolicyAcceptedAt: privacyPolicyAcceptedAt,
                browserInfo: {
                  userAgent: data.browserUserAgent,
                  language: data.browserLanguage,
                  platform: data.browserPlatform
                },
                registrationIp: ipAddress,
                termsEffectiveDate: data.termsEffectiveDate
              }
            })
          ]
        });
      } catch (logError) {
        console.error('Error registrando log de registro de usuario:', logError);
      }

      // Confirmar transacción
      await executeQuery({ query: 'COMMIT' });

      // Suscripción automática al sistema de correos
      try {
        const subscriberName = `${data.firstName} ${data.lastName}`.trim();

        await executeQuery({
          query: `
            INSERT INTO email_subscribers (email, name, user_id, status, subscribed_at)
            VALUES (?, ?, ?, 'active', NOW())
            ON DUPLICATE KEY UPDATE
              name = VALUES(name),
              user_id = VALUES(user_id),
              status = 'active',
              unsubscribed_at = NULL
          `,
          values: [data.email, subscriberName, personaId]
        });
        console.log('Usuario suscrito automáticamente al sistema de correos');
      } catch (subscribeError) {
        console.error('Error al suscribir automáticamente al sistema de correos:', subscribeError);
      }

      // Enviar email de verificación
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://clubviveverde.com';
      const verificationUrl = `${baseUrl}/verify-email?token=${verificationToken}`;

      try {
        const transporter = nodemailer.createTransport({
          host: process.env.EMAIL_HOST,
          port: parseInt(process.env.EMAIL_PORT || '465'),
          secure: process.env.EMAIL_SECURE === 'true',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD,
          },
        });

        await transporter.sendMail({
          from: `ViveVerde <${process.env.EMAIL_NOREPLY || process.env.EMAIL_FROM}>`,
          to: data.email,
          subject: 'Verifica tu email - Club ViveVerde',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #166534; margin: 0;">Club ViveVerde</h1>
              </div>

              <h2 style="color: #333; margin-bottom: 20px;">¡Hola ${data.firstName}!</h2>

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
        console.log('Email de verificación enviado a:', data.email);
      } catch (emailError) {
        console.error('Error al enviar email de verificación:', emailError);
      }

      // Responder con éxito
      res.status(201).json({
        success: true,
        message: 'Usuario registrado con éxito. Por favor verifica tu email para activar tu cuenta.',
        user: {
          id: personaId,
          codigo: personaId
        }
      });
    } catch (error) {
      // Revertir transacción en caso de error
      await executeQuery({ query: 'ROLLBACK' });
      throw error;
    }
  } catch (error) {
    console.error('Error en el registro:', error);
    res.status(500).json({
      success: false,
      message: 'Error al procesar el registro',
      error: (error as Error).message,
    });
  }
}
