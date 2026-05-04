import { NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '@/middleware/authMiddleware';
import executeQuery from '@/lib/db';
import { error } from 'console';

async function profileHandler(req: AuthenticatedRequest, res: NextApiResponse) {
  // Solo permitir GET y PUT
  if (req.method !== 'GET' && req.method !== 'PUT') {
    return res.status(405).json({ 
      success: false, 
      message: 'Método no permitido' 
    });
  }

  // Asegurar que tenemos el ID de usuario desde el token
  if (!req.user || !req.user.userId) {
    return res.status(401).json({
      success: false,
      message: 'Usuario no autenticado'
    });
  }

  // Obtener el perfil (GET)
  if (req.method === 'GET') {
    try {
      // Buscar datos del usuario en múltiples tablas
      const userResult = await executeQuery({
        query: `
          SELECT 
            p.codigo, 
            p.apellidos, 
            p.nombres, 
            p.mail, 
            p.telefono, 
            p.fecha_nacimiento,
            p.puntos,
            p.foto_url, 
            p.rol,
            p.status,
            p.creado_en,
            p.cajero_version,
            d.pais,
            d.ciudad,
            d.provincia,
            d.codpostal,
            d.direccion,
            pr.caracteristicas_vivienda,
            pr.animales,
            pr.descripcion_vivienda,
            pr.superficie_terreno
          FROM personas p
          LEFT JOIN direcciones d ON p.codigo = d.codigo
          LEFT JOIN propiedades pr ON p.codigo = pr.codigo
          WHERE p.codigo = ?
        `,
        values: [req.user.userId]
      });

      const users = userResult as any[];
      
      if (!users || users.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      const user = users[0];
      
      // Formatear la respuesta
      return res.status(200).json({
        success: true,
        user: {
          id: user.codigo,
          cif: user.cif,
          firstName: user.nombres,
          lastName: user.apellidos,
          email: user.mail,
          phone: user.telefono,
          birthDate: user.fecha_nacimiento ? new Date(user.fecha_nacimiento).toISOString().split('T')[0] : null,
          role: user.rol,
          photoUrl: user.foto_url,
          postalCode: user.codpostal,
          city: user.ciudad,
          province: user.provincia,
          country: user.pais,
          address: user.direccion,
          registrationDate: user.creado_en,
          points: user.puntos || 0, // Usar los puntos directamente de la tabla personas
          status: user.status === 1, // Agregar el estado de la cuenta como booleano
          enabled: user.status === 1,  // También incluir como enabled para consistencia
          cajero_version: user.cajero_version || 'web', // Incluir versión TPV del cajero
          property: {
            characteristics: user.caracteristicas_vivienda ? user.caracteristicas_vivienda.split(',') : [],
            animals: user.animales ? user.animales.split(',') : [],
            description: user.descripcion_vivienda || '',
            surfaceArea: user.superficie_terreno || 0
          }
        }
      });
    } catch (error) {
      console.error('Error al obtener el perfil del usuario:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al obtener el perfil del usuario',
        error: (error as Error).message
      });
    }
  }
  
  // Actualizar el perfil (PUT)
  else if (req.method === 'PUT') {
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
        address,
        currentPassword,
        newPassword,
        points, // Añadir soporte para actualizar puntos (solo para administradores)
        property // Añadir soporte para actualizar propiedades
      } = req.body;

      // Iniciar transacción
      await executeQuery({ query: 'START TRANSACTION' });
      
      try {
        // Obtener el rol del usuario usando getRole()
        const userRole = await req.user?.getRole();
        
        // 1. Actualizar información personal
        if (firstName || lastName || email || phone || birthDate || (points !== undefined && userRole === 'administrador')) {
          let updateFields = [];
          let values = [];
          
          if (firstName) {
            updateFields.push('nombres = ?');
            values.push(firstName);
          }
          
          if (lastName) {
            updateFields.push('apellidos = ?');
            values.push(lastName);
          }
          
          if (email) {
            // Verificar si el email ya está en uso (excepto por este usuario)
            const emailCheckResult = await executeQuery({
              query: 'SELECT codigo FROM personas WHERE mail = ? AND codigo != ?',
              values: [email, req.user.userId]
            });
            
            if ((emailCheckResult as any[]).length > 0) {
              await executeQuery({ query: 'ROLLBACK' });
              return res.status(409).json({
                success: false,
                message: 'Este correo electrónico ya está en uso por otro usuario'
              });
            }
            
            updateFields.push('mail = ?');
            values.push(email);
          }
          
          if (phone) {
            // Verificar si el teléfono ya está en uso (excepto por este usuario)
            const phoneCheckResult = await executeQuery({
              query: 'SELECT codigo FROM personas WHERE telefono = ? AND codigo != ?',
              values: [phone, req.user.userId]
            });
            
            if ((phoneCheckResult as any[]).length > 0) {
              await executeQuery({ query: 'ROLLBACK' });
              return res.status(409).json({
                success: false,
                message: 'Este número de teléfono ya está en uso por otro usuario'
              });
            }
            
            updateFields.push('telefono = ?');
            values.push(phone);
          }
          
          if (birthDate) {
            updateFields.push('fecha_nacimiento = ?');
            values.push(birthDate);
          }
          
          // Solo permitir actualizar puntos si es administrador
          if (points !== undefined && userRole === 'administrador') {
            updateFields.push('puntos = ?');
            values.push(points);
            
            // Opcionalmente, registrar el cambio de puntos en un historial
            try {
              // Obtener puntos actuales
              const currentPointsResult = await executeQuery({
                query: 'SELECT puntos FROM personas WHERE codigo = ?',
                values: [req.user.userId]
              });
              
              const currentPoints = (currentPointsResult as any[])[0]?.puntos || 0;
              const pointsDifference = points - currentPoints;
              
              if (pointsDifference !== 0) {
                // Intentar insertar en la tabla historial_puntos si existe
                try {
                  await executeQuery({
                    query: `
                      INSERT INTO historial_puntos 
                      (codigo_persona, puntos_antiguos, puntos_nuevos, puntos_diferencia, motivo) 
                      VALUES (?, ?, ?, ?, ?)
                    `,
                    values: [
                      req.user.userId,
                      currentPoints,
                      points,
                      pointsDifference,
                      'Actualización manual por administrador'
                    ]
                  });
                } catch (histError) {
                  // Si la tabla no existe, simplemente continuamos
                  console.error('No se pudo registrar en historial_puntos. La tabla puede no existir:', histError);
                }
              }
            } catch (pointsError) {
              console.error('Error al intentar registrar el historial de puntos:', pointsError);
            }
          }
          
          if (updateFields.length > 0) {
            // Añadir el ID del usuario a los valores
            values.push(req.user.userId);
            
            await executeQuery({
              query: `
                UPDATE personas 
                SET ${updateFields.join(', ')} 
                WHERE codigo = ?
              `,
              values: values
            });
          }
        }
        
        // 2. Actualizar dirección
        if (city || province || postalCode || country || address) {
          // Verificar si ya existe una dirección para este usuario
          const addressCheckResult = await executeQuery({
            query: 'SELECT codigo FROM direcciones WHERE codigo = ?',
            values: [req.user.userId]
          });
          
          const addressExists = (addressCheckResult as any[]).length > 0;
          
          if (addressExists) {
            // Actualizar dirección existente
            let updateFields = [];
            let values = [];
            
            if (city) {
              updateFields.push('ciudad = ?');
              values.push(city);
            }
            
            if (province) {
              updateFields.push('provincia = ?');
              values.push(province);
            }
            
            if (postalCode) {
              updateFields.push('codpostal = ?');
              values.push(postalCode);
            }
            
            if (country) {
              updateFields.push('pais = ?');
              values.push(country);
            }
            
            if (address !== undefined) {
              updateFields.push('direccion = ?');
              values.push(address === '' ? null : address);
            }
            
            if (updateFields.length > 0) {
              values.push(req.user.userId);
              
              await executeQuery({
                query: `
                  UPDATE direcciones 
                  SET ${updateFields.join(', ')} 
                  WHERE codigo = ?
                `,
                values: values
              });
            }
          } else {
            // Insertar nueva dirección
            await executeQuery({
              query: `
                INSERT INTO direcciones (ciudad, provincia, codpostal, pais, direccion, codigo)
                VALUES (?, ?, ?, ?, ?, ?)
              `,
              values: [
                city || null,
                province || null,
                postalCode || null,
                country || null,
                address === '' ? null : address,
                req.user.userId
              ]
            });
          }
        }
        
        // 3. Cambiar contraseña si se proporciona
        if (currentPassword && newPassword) {
          const bcrypt = require('bcryptjs');
          // Obtener hash actual
          const passwordResult = await executeQuery({
            query: 'SELECT password_hash FROM personas WHERE codigo = ?',
            values: [req.user.userId]
          });
          const passData = passwordResult as any[];
          if (!passData || passData.length === 0) {
            await executeQuery({ query: 'ROLLBACK' });
            return res.status(404).json({
              success: false,
              message: 'Usuario no encontrado'
            });
          }
          const currentHash = passData[0].password_hash;
          // Verificar que la contraseña actual es correcta
          const isValidPassword = await bcrypt.compare(currentPassword, currentHash);
          if (!isValidPassword) {
            await executeQuery({ query: 'ROLLBACK' });
            return res.status(400).json({
              success: false,
              message: 'La contraseña actual es incorrecta'
            });
          }
          // Generar hash para la nueva contraseña
          const salt = await bcrypt.genSalt(10);
          const newHash = await bcrypt.hash(newPassword, salt);
          // Actualizar contraseña
          await executeQuery({
            query: 'UPDATE personas SET password_hash = ? WHERE codigo = ?',
            values: [newHash, req.user.userId]
          });
        }
        
        // 4. Actualizar información de propiedades si se proporciona
        if (property) {
          // Verificar si ya existe una propiedad para este usuario
          const propertyCheckResult = await executeQuery({
            query: 'SELECT codigo FROM propiedades WHERE codigo = ?',
            values: [req.user.userId]
          });
          
          const propertyExists = (propertyCheckResult as any[]).length > 0;
          
          // Función para normalizar valores según la definición SET de la base de datos
          const normalizeSetValues = (values: string[], allowedValues: string[]): string | null => {
            if (!values || values.length === 0) return null;
            
            // Filtrar solo los valores permitidos
            const validValues = values.filter(val => 
              allowedValues.includes(val.toLowerCase()) || 
              allowedValues.some(allowed => allowed.toLowerCase() === val.toLowerCase())
            );
            
            return validValues.length > 0 ? validValues.join(',') : null;
          };
          
          // Valores permitidos en la base de datos
          const allowedCharacteristics = ['terraza', 'balcón', 'huerto', 'césped', 'jardín', 'estanque', 'marquesina', 'piscina'];
          const allowedAnimals = ['sin animales', 'perro(s)', 'gato(s)', 'pájaro(s)', 'pez (peces)', 'roedor(es)', 'otros', 'animales de corral'];
          
          // Preparar los datos de la propiedad con valores normalizados
          const caracteristicas = normalizeSetValues(
            Array.isArray(property.characteristics) ? property.characteristics : [], 
            allowedCharacteristics
          );
          
          const animales = normalizeSetValues(
            Array.isArray(property.animals) ? property.animals : [],
            allowedAnimals
          );
          
          const descripcion = property.description || null;
          const superficie = property.surfaceArea || null;
          
          if (propertyExists) {
            // Actualizar propiedades existentes
            await executeQuery({
              query: `
                UPDATE propiedades 
                SET caracteristicas_vivienda = ?,
                    animales = ?,
                    descripcion_vivienda = ?,
                    superficie_terreno = ?
                WHERE codigo = ?
              `,
              values: [
                caracteristicas,
                animales,
                descripcion,
                superficie,
                req.user.userId
              ]
            });
          } else {
            // Insertar nuevas propiedades
            await executeQuery({
              query: `
                INSERT INTO propiedades 
                (caracteristicas_vivienda, animales, descripcion_vivienda, superficie_terreno, codigo)
                VALUES (?, ?, ?, ?, ?)
              `,
              values: [
                caracteristicas,
                animales,
                descripcion,
                superficie,
                req.user.userId
              ]
            });
          }
        }
        
        // Confirmar cambios
        await executeQuery({ query: 'COMMIT' });
        
        // Obtener perfil actualizado
        const getReq = req as AuthenticatedRequest;
        getReq.method = 'GET';
        return profileHandler(getReq, res);
      } catch (error) {
        // Revertir cambios en caso de error
        await executeQuery({ query: 'ROLLBACK' });
        throw error;
      }
    } catch (error) {
      console.error('Error al actualizar el perfil del usuario:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al actualizar el perfil del usuario',
        error: (error as Error).message
      });
    }
  }
}

export default withAuth(profileHandler);