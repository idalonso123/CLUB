import { NextApiRequest, NextApiResponse } from 'next';
import executeQuery from '@/lib/db';
import bcrypt from 'bcryptjs';
import formidable from 'formidable';
import { promises as fs } from 'fs';
import path from 'path';
import { nanoid } from 'nanoid';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Método no permitido' });
  }

  try {
    // Procesar el formulario con la API de formidable
    console.log('Procesando formulario de registro');
    
    // Crear el directorio de uploads directamente
    const uploadDir = path.join(process.cwd(), 'uploads');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      console.log('Directorio de uploads creado:', uploadDir);
    } catch (err) {
      console.warn('Error al crear directorio de uploads:', err);
    }
    
    const [fields, files] = await new Promise<[any, any]>((resolve, reject) => {
      // Crear una instancia de formidable (compatible con múltiples versiones)
      let form;
      try {
        // Configuración mejorada para formidable
        const options = {
          keepExtensions: true,
          maxFileSize: 5 * 1024 * 1024, // 5 MB
          multiples: true,
          uploadDir: uploadDir, // Usar directamente la carpeta de uploads
          filter: (part: any) => {
            // Solo permitir JPG y PNG para fotos
            if (part.name === 'photo') {
              return ['image/jpeg', 'image/png'].includes(part.mimetype || '');
            }
            return true;
          },
        };
        
        // Intenta con la API moderna
        if (typeof formidable === 'function') {
          form = formidable(options);
        } else {
          // Fallback para la API antigua
          form = new (formidable as any).IncomingForm();
          Object.assign(form, options);
        }
        
        console.log('Formidable inicializado correctamente');
      } catch (e) {
        console.error("Error al inicializar formidable:", e);
        reject(e);
        return;
      }
      
      form.parse(req, (err: any, fields: any, files: any) => {
        if (err) {
          console.error('Error al parsear el formulario:', err);
          reject(err);
        } else {
          console.log('Formulario parseado correctamente');
          console.log('Campos recibidos:', Object.keys(fields));
          console.log('Archivos recibidos:', Object.keys(files));
          resolve([fields, files]);
        }
      });
    });
    
    // Obtener el correo electrónico del formulario
    const email = Array.isArray(fields.email) ? fields.email[0] : fields.email || '';
    
    // Obtener el teléfono del formulario
    const phonePrefix = Array.isArray(fields.phonePrefix) ? fields.phonePrefix[0] : fields.phonePrefix || '+34';
    const phoneNumber = Array.isArray(fields.phone) ? fields.phone[0] : fields.phone || '';
    const fullPhone = phoneNumber ? `${phonePrefix} ${phoneNumber}` : '';

    // Obtener la contraseña y hashearla
    const password = Array.isArray(fields.password) ? fields.password[0] : fields.password || '';
    const hashedPassword = password ? await bcrypt.hash(password, 10) : '';

    // Procesar y guardar la foto si se ha proporcionado
    let fotoUrl = null;
    if (files && files.photo) {
      const photoFile = Array.isArray(files.photo) ? files.photo[0] : files.photo;
      
      if (photoFile && photoFile.filepath) {
        console.log('Procesando foto de perfil:', photoFile.originalFilename);
        console.log('Ruta temporal de la foto:', photoFile.filepath);
        
        try {
          // Verificar que el archivo existe
          await fs.access(photoFile.filepath);
          console.log('Archivo temporal verificado');
          
          // Generar un nombre único para el archivo
          const fileExt = path.extname(photoFile.originalFilename || 'photo.jpg');
          const newFilename = `${nanoid(10)}${fileExt}`;
          
          // Ruta completa para el archivo destino
          const targetPath = path.join(process.cwd(), 'uploads', newFilename);
          console.log('Ruta destino:', targetPath);
          
          try {
            // Leer el archivo fuente como buffer
            const fileBuffer = await fs.readFile(photoFile.filepath);
            console.log('Archivo leído, tamaño:', fileBuffer.length, 'bytes');
            
            // Escribir el archivo en el destino
            await fs.writeFile(targetPath, fileBuffer);
            console.log('Archivo escrito correctamente en destino');
            
            // URL relativa para almacenar en la base de datos
            fotoUrl = `/uploads/${newFilename}`;
            console.log('URL de foto asignada:', fotoUrl);
          } catch (writeError) {
            console.error('Error al leer o escribir el archivo:', writeError);
            // Intentar con copyFile como alternativa
            try {
              await fs.copyFile(photoFile.filepath, targetPath);
              console.log('Archivo copiado correctamente usando copyFile');
              fotoUrl = `/uploads/${newFilename}`;
            } catch (copyError) {
              console.error('Error al copiar el archivo:', copyError);
              fotoUrl = null;
            }
          }
          
          // Verificar que el archivo se guardó correctamente
          try {
            await fs.access(targetPath);
            console.log('Verificación: archivo guardado correctamente');
          } catch (err) {
            console.error('Error: el archivo no se guardó correctamente:', err);
            fotoUrl = null;
          }
          
        } catch (error) {
          console.error('Error al procesar la foto:', error);
          fotoUrl = null;
        } finally {
          // Intentar eliminar el archivo temporal
          try {
            await fs.unlink(photoFile.filepath);
            console.log('Archivo temporal eliminado');
          } catch (error) {
            console.warn('No se pudo eliminar el archivo temporal:', error);
          }
        }
      } else {
        console.warn('Archivo de foto no válido o no tiene ruta');
      }
    } else {
      console.log('No se proporcionó ninguna foto');
    }

    // Comprobar si ya existe un usuario con ese correo electrónico
    const existingUserByEmail = await executeQuery({
      query: `SELECT codigo FROM personas WHERE mail = ?`,
      values: [email]
    });

    if ((existingUserByEmail as any[]).length > 0) {
      return res.status(409).json({ 
        success: false, 
        message: 'Ya existe un usuario con este correo electrónico',
        field: 'email'
      });
    }

    // Comprobar si ya existe un usuario con ese teléfono (solo si se proporcionó)
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

    // Iniciar transacción
    await executeQuery({ query: 'START TRANSACTION' });

    try {
      // 1. Insertar en tabla personas (ahora con teléfono directamente y fecha de nacimiento)
      console.log('Insertando usuario en la base de datos con foto_url:', fotoUrl);
      const personResult = await executeQuery({
        query: `
          INSERT INTO personas (cif, apellidos, nombres, mail, telefono, fecha_nacimiento, password_hash, foto_url, rol, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        values: [
          nanoid(10),
          // Manejar campos tanto en formato array como simple
          Array.isArray(fields.lastName) ? fields.lastName[0] : fields.lastName || '',
          Array.isArray(fields.firstName) ? fields.firstName[0] : fields.firstName || '',
          email,
          fullPhone, // Ahora el teléfono se guarda en la tabla personas
          Array.isArray(fields.birthDate) ? fields.birthDate[0] : fields.birthDate || null,
          hashedPassword,
          fotoUrl,
          'usuario',
          1
        ],
      });
      console.log('Usuario insertado correctamente, ID:', (personResult as any).insertId);
      const personaId = (personResult as any).insertId;

      // 3. Insertar en tabla direcciones - MODIFICADO para incluir país y provincia
      const country = Array.isArray(fields.country) ? fields.country[0] : fields.country || '';
      
      // Obtener el nombre del país a partir del código
      let countryName = '';
      if (country) {
        try {
          // Importar países dinámicamente
          const countryData = require('@/data/countries.json');
          const countryObj = countryData.countries.find((c: any) => c.code === country);
          if (countryObj) {
            countryName = countryObj.name;
          }
        } catch (error) {
          console.error('Error al obtener el nombre del país:', error);
          // Si falla, usamos el código como nombre
          countryName = country;
        }
      }

      await executeQuery({
        query: `
          INSERT INTO direcciones (provincia, codpostal, pais, codigo)
          VALUES (?, ?, ?, ?)
        `,
        values: [
          Array.isArray(fields.city) ? fields.city[0] : fields.city || '', // Usamos city como provincia
          Array.isArray(fields.postalCode) ? fields.postalCode[0] : fields.postalCode || '',
          countryName, // Guardamos el nombre del país en lugar del código
          personaId
        ],
      });

      // 4. Insertar en tabla propiedades (nueva lógica)
      // Extraer y normalizar los campos de propiedad del formulario
      const caracteristicas_vivienda = Array.isArray(fields.caracteristicas_vivienda)
        ? fields.caracteristicas_vivienda
        : fields.caracteristicas_vivienda
          ? [fields.caracteristicas_vivienda]
          : [];
      const animales = Array.isArray(fields.animales)
        ? fields.animales
        : fields.animales
          ? [fields.animales]
          : [];

      await executeQuery({
        query: `
          INSERT INTO propiedades (caracteristicas_vivienda, animales, codigo)
          VALUES (?, ?, ?)
        `,
        values: [
          caracteristicas_vivienda.length > 0 ? caracteristicas_vivienda.join(',') : null,
          animales.length > 0 ? animales.join(',') : null,
          personaId
        ],
      });

      // 5. Registrar el evento en la tabla de logs_admin
      try {
        await executeQuery({
          query: `
            INSERT INTO logs_admin 
            (admin_id, action, entity_type, entity_id, details, created_at) 
            VALUES (?, ?, ?, ?, ?, NOW())
          `,
          values: [
            personaId, // Usar el ID del usuario recién creado en lugar de 0
            'user_create',
            'user',
            personaId,
            JSON.stringify({
              method: 'self_registration',
              email: email,
              firstName: Array.isArray(fields.firstName) ? fields.firstName[0] : fields.firstName || '',
              lastName: Array.isArray(fields.lastName) ? fields.lastName[0] : fields.lastName || '',
              hasPhoto: !!fotoUrl
            })
          ]
        });
      } catch (logError) {
        console.error('Error registrando log de registro de usuario:', logError);
      }

      // Confirmar transacción
      await executeQuery({ query: 'COMMIT' });

      // Responder con éxito
      res.status(201).json({
        success: true,
        message: 'Usuario registrado con éxito',
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