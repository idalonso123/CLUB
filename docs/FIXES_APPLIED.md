# Correcciones Realizadas en el Sistema de Segmentos

## Resumen de Problemas Corregidos

### 5. Validación de Formato de Fecha (Año con más de 4 dígitos)

**Problema Identificado:**
El campo de año en las fechas de los segmentos permitía escribir más de 4 dígitos (ej: 20033, 200332), lo que causaba errores SQL al intentar guardar o previsualizar segmentos:

```
Error: Incorrect DATETIME value: '20033-05-20'
Error: Incorrect DATETIME value: '200332-05-20'
```

El formato de fecha esperado es AAAA-MM-DD (año de exactamente 4 dígitos), pero los inputs HTML5 `type="date"` permitían escribir texto directamente, aceptando cualquier número de dígitos.

**Solución Implementada:**

Se implementó una validación en múltiples niveles:

#### Frontend (EmailSection.tsx)

1. **Función `sanitizeDateInput`** (añadida al inicio del archivo):
   - Elimina caracteres que no sean dígitos o guiones
   - Limita la longitud a 10 caracteres (AAAA-MM-DD)
   - Asegura el formato correcto AAAA-MM-DD

2. **Función `isValidDateFormat`**:
   - Verifica que el formato sea exactamente AAAA-MM-DD
   - Valida que el año tenga entre 1000 y 9999 (exactamente 4 dígitos)
   - Confirma que sea una fecha válida (no 2024-13-45 por ejemplo)

3. **Validación en `handleSaveSegment`**:
   - Añadida validación para los 4 campos de fecha:
     - `birth_date_from`
     - `birth_date_to`
     - `registration_date_from`
     - `registration_date_to`
   - Mensajes de error descriptivos indicando el formato correcto

4. **Actualización de inputs de fecha**:
   - Todos los inputs de fecha ahora usan `sanitizeDateInput` en el handler `onChange`

#### Backend (lib/segmentUtils.ts)

5. **Función `isValidDateFormat`** (servidor):
   - Implementación robusta de validación de fecha
   - Verifica formato, rango de año y validez de la fecha
   - Detecta fechas inválidas como "2024-13-01" o "2024-02-30"

6. **Función `validateSegmentFilters`**:
   - Valida todos los campos de fecha antes de construir consultas
   - Retorna error descriptivo si encuentra fechas inválidas

7. **Actualización de `buildSegmentQuery` y `buildSegmentCountQuery`**:
   - Añadida llamada a `validateSegmentFilters` al inicio
   - Lanza error con mensaje descriptivo si las fechas son inválidas

#### APIs (pages/api/email/segments/)

8. **`preview.ts`**:
   - Importada función `validateSegmentFilters`
   - Validación de fechas antes de construir la consulta SQL
   - Retorna error 400 si el formato de fecha es inválido

9. **`segments.ts` (POST)**:
   - Importada función `validateSegmentFilters`
   - Validación de fechas antes de insertar en BD
   - Retorna error 400 si el formato de fecha es inválido

10. **`[id].ts` (PUT)**:
    - Importada función `validateSegmentFilters`
    - Validación de fechas antes de actualizar en BD
    - Retorna error 400 si el formato de fecha es inválido

**Mensajes de Error Implementados:**
- Frontend: "El formato de la fecha de nacimiento 'Desde' es incorrecto. Debe ser AAAA-MM-DD con un año de 4 dígitos (ej: 2000-01-15)."
- Backend: "El formato de [campo] es incorrecto. Debe ser AAAA-MM-DD con un año de exactamente 4 dígitos (ej: 2024-01-15). Valor recibido: '20033-05-20'"

### 6. Validación de Rangos de Fechas Incompletos

**Problema Identificado:**
El sistema permitía guardar segmentos con rangos de fechas incompletos, es decir, únicamente preenchiendo la fecha "Desde" o únicamente la fecha "Hasta". Esto no tiene sentido para un rango y puede causar confusión o errores en las consultas.

**Solución Implementada:**

#### Frontend (EmailSection.tsx)

En la función `handleSaveSegment` se añadió validación para verificar que ambos campos del rango de fechas estén preenchidos o ambos vacíos:

1. **Rango de fechas de nacimiento**:
   - Validación: Si `birth_date_from` está preenchido, `birth_date_to` también debe estarlo
   - Mensaje de error: "El rango de fechas de nacimiento está incompleto: debe rellenar tanto la fecha 'Desde' como la fecha 'Hasta', o dejar ambas vacías."

2. **Rango de fechas de registro**:
   - Validación: Si `registration_date_from` está preenchido, `registration_date_to` también debe estarlo
   - Mensaje de error: "El rango de fechas de registro está incompleto: debe rellenar tanto la fecha 'Desde' como la fecha 'Hasta', o dejar ambas vacías."

#### Backend (lib/segmentUtils.ts)

La función `validateSegmentFilters` ahora incluye esta validación antes de construir las consultas SQL:

1. Validación de rango de fechas de nacimiento incompleto
2. Validación de rango de fechas de registro incompleto

### 1. Inconsistencia entre 'criteria' y 'filters'

**Problema Identificado:**
El código tenía una inconsistencia en el nombre del campo que almacenaba los filtros de los segmentos:
- La base de datos (según `create_subscription_system.sql`) usa el campo `filters`
- El componente `EmailSection.tsx` enviaba el campo como `criteria`
- Las APIs esperaban `filters` pero recibían `criteria`

**Archivos Modificados:**

#### Frontend (EmailSection.tsx)

1. **Función `handleSaveSegment`** (línea 483):
   - Cambiado `criteria: segmentForm.filters` por `filters: segmentForm.filters`
   - Añadida validación de campos obligatorios (nombre del segmento)
   - Añadida validación de rangos de fechas y números

2. **Función `openEditSegment`** (línea 693):
   - Añadido manejo para ambos campos: `(segment as any).filters || (segment as any).criteria`
   - Normalización correcta de los valores de filtros
   - Manejo seguro de valores undefined/null

3. **Función `downloadSegmentUsers`** (línea 337):
   - Mejorado el manejo de errores
   - Mensaje específico cuando no hay usuarios en el segmento

#### Backend (APIs)

4. **`pages/api/email/segments.ts`**:
   - Actualizada interfaz `EmailSegment` para incluir ambos campos
   - Corregido método POST para usar `filters` consistentemente
   - Añadida validación del nombre obligatorio

5. **`pages/api/email/segments/[id].ts`**:
   - Actualizada interfaz `EmailSegment`
   - Corregido método PUT para usar `filters`
   - Añadida validación del nombre obligatorio

6. **`pages/api/email/segments/[id]/users.ts`**:
   - Actualizada interfaz
   - Corregido parseo para intentar `filters` primero, luego `criteria`
   - Añadida validación de datos del segmento
   - Mensajes de error más descriptivos

7. **`pages/api/email/segments/[id]/count.ts`**:
   - Actualizada interfaz
   - Corregido parseo para intentar `filters` primero, luego `criteria`
   - Añadida validación de datos del segmento
   - Mensajes de error más descriptivos

#### Librería de Utilidades

8. **`lib/segmentUtils.ts`**:
   - **`buildSegmentQuery`**: Añadida validación inicial para `filters` undefined/null
   - **`buildSegmentCountQuery`**: Añadida validación inicial para `filters` undefined/null
   - **`getFilterPreview`**: Añadida validación inicial para `filters` undefined/null

### 2. Validación de Campos Obligatorios

** Problema:** El formulario permitía guardar segmentos sin nombre, lo que causaba errores.

**Solución Implementada:**
- Validación en el frontend antes de enviar (`handleSaveSegment`)
- Validación en el backend en ambos métodos POST y PUT
- Mensaje de error claro: "El nombre del segmento es obligatorio"

### 3. Validación de Rangos

** Problema:** Los campos de rango permitían valores inválidos (fecha "hasta" menor que "desde").

**Solución Implementada:**
Se añadieron validaciones para todos los campos de rango en el formulario:

1. **Rango de fechas de nacimiento**:
   - `birth_date_to` no puede ser menor que `birth_date_from`

2. **Rango de fechas de registro**:
   - `registration_date_to` no puede ser menor que `registration_date_from`

3. **Rango de puntos**:
   - `points_max` no puede ser menor que `points_min`

4. **Rango de cifra de ventas**:
   - `sales_amount_max` no puede ser menor que `sales_amount_min`

5. **Rango de días de inactividad**:
   - `inactivity_days_max` no puede ser menor que `inactivity_days_min`

### 4. Script de Migración de Base de Datos

**Archivo:** `scripts/fix_email_segments_column.sql`

Este script:
- Detecta si existe la columna `criteria` y no existe `filters`
- Renombra `criteria` a `filters` si es necesario
- Copia datos de `criteria` a `filters` si ambos existen
- Verifica la estructura final de la tabla

## Instrucciones de Despliegue

### Paso 1: Ejecutar el Script de Migración

```bash
mysql -u tu_usuario -p tu_base_de_datos < scripts/fix_email_segments_column.sql
```

### Paso 2: Reiniciar la Aplicación

```bash
# Detener la aplicación
# Reiniciar con los nuevos cambios
npm run dev
```

### Paso 3: Verificar los Cambios

1. Abrir la sección de "Segmentos" en el panel de administración
2. Crear un nuevo segmento y verificar que:
   - El campo nombre es obligatorio
   - Los rangos de fechas se validan correctamente
   - Los botones "Contar", "Editar" y "Descargar" funcionan
3. Verificar que los segmentos existentes se cargan correctamente

## Cambios Técnicos Detallados

### Cambios en el Frontend

| Función | Cambio | Tipo |
|---------|--------|------|
| `handleSaveSegment` | Cambio de `criteria` a `filters` | Corrección |
| `handleSaveSegment` | Añadida validación de nombre | Nueva funcionalidad |
| `handleSaveSegment` | Añadida validación de rangos | Nueva funcionalidad |
| `handleSaveSegment` | Añadida validación de formato de fecha | Nueva funcionalidad |
| `openEditSegment` | Manejo de ambos campos `filters` y `criteria` | Corrección |
| `downloadSegmentUsers` | Mejorado manejo de errores | Mejora |
| `sanitizeDateInput` | Nueva función para sanitizar entrada de fecha | Nueva funcionalidad |
| `isValidDateFormat` | Nueva función para validar formato AAAA-MM-DD | Nueva funcionalidad |
| Inputs de fecha | Uso de `sanitizeDateInput` en onChange | Corrección defensiva |

### Cambios en el Backend

| Endpoint | Cambio | Tipo |
|----------|--------|------|
| `POST /api/email/segments` | Uso consistente de `filters` | Corrección |
| `POST /api/email/segments` | Validación de nombre | Nueva funcionalidad |
| `POST /api/email/segments` | Validación de formato de fecha | Nueva funcionalidad |
| `PUT /api/email/segments/[id]` | Uso consistente de `filters` | Corrección |
| `PUT /api/email/segments/[id]` | Validación de nombre | Nueva funcionalidad |
| `PUT /api/email/segments/[id]` | Validación de formato de fecha | Nueva funcionalidad |
| `POST /api/email/segments/preview` | Validación de formato de fecha | Nueva funcionalidad |
| `GET /api/email/segments/[id]/users` | Manejo de ambos campos | Corrección |
| `GET /api/email/segments/[id]/count` | Manejo de ambos campos | Corrección |

### Cambios en Utilidades

| Función | Cambio | Tipo |
|---------|--------|------|
| `buildSegmentQuery` | Validación de `filters` undefined | Corrección defensiva |
| `buildSegmentQuery` | Validación de formato de fecha | Nueva funcionalidad |
| `buildSegmentCountQuery` | Validación de `filters` undefined | Corrección defensiva |
| `buildSegmentCountQuery` | Validación de formato de fecha | Nueva funcionalidad |
| `getFilterPreview` | Validación de `filters` undefined | Corrección defensiva |
| `isValidDateFormat` | Nueva función para validar fecha | Nueva funcionalidad |
| `validateSegmentFilters` | Nueva función para validar todos los filtros | Nueva funcionalidad |

## Pruebas Recomendadas

### Prueba 1: Crear Segmento sin Nombre
1. Ir a "Nuevo Segmento"
2. Dejar el campo nombre vacío
3. Intentar guardar
4. **Esperado:** Mensaje de error "El nombre del segmento es obligatorio"

### Prueba 2: Crear Segmento con Rangos Inválidos
1. Ir a "Nuevo Segmento"
2. En "Rango de fechas de nacimiento", poner "Hasta" menor que "Desde"
3. Intentar guardar
4. **Esperado:** Mensaje de error indicando el problema

### Prueba 3: Crear Segmento con Fecha de Año Inválido
1. Ir a "Nuevo Segmento"
2. En "Rango de fechas de nacimiento", intentar escribir un año con más de 4 dígitos (ej: escribir "20033" en el campo de año)
3. Intentar guardar o previsualizar
4. **Esperado:** Mensaje de error "El formato de la fecha de nacimiento 'Desde' es incorrecto. Debe ser AAAA-MM-DD con un año de 4 dígitos"

### Prueba 4: Crear Segmento con Fecha Límite Inválida
1. Ir a "Nuevo Segmento"
2. En "Rango de fechas de nacimiento", intentar escribir una fecha como "2024-13-01" (mes 13 no existe)
3. Intentar guardar o previsualizar
4. **Esperado:** Mensaje de error indicando que el formato de fecha es incorrecto

### Prueba 5: Crear Segmento con Rango de Fechas Incompleto
1. Ir a "Nuevo Segmento"
2. En "Rango de fechas de nacimiento", rellenar solo la fecha "Desde" (ej: 2000-01-01) y dejar vacía la fecha "Hasta"
3. Intentar guardar
4. **Esperado:** Mensaje de error "El rango de fechas de nacimiento está incompleto: debe rellenar tanto la fecha 'Desde' como la fecha 'Hasta', o dejar ambas vacías."

5. Repetir el proceso inverso: rellenar solo la fecha "Hasta" y dejar vacía la fecha "Desde"
6. **Esperado:** Mismo mensaje de error

7. Repetir para "Rango de fechas de registro"
8. **Esperado:** Mensaje de error "El rango de fechas de registro está incompleto: debe rellenar tanto la fecha 'Desde' como la fecha 'Hasta', o dejar ambas vacías."

### Prueba 6: Crear Segmento con Rango de Fechas Válido
1. Ir a "Nuevo Segmento"
2. En "Rango de fechas de nacimiento", rellenar ambas fechas: "Desde" (2000-01-01) y "Hasta" (2024-12-31)
3. En "Rango de fechas de registro", rellenar ambas fechas: "Desde" (2020-01-01) y "Hasta" (2024-12-31)
4. Intentar guardar
5. **Esperado:** El segmento se guarda correctamente sin errores de fechas

### Prueba 8: Editar Segmento Existente
1. Seleccionar un segmento existente
2. Hacer clic en "Editar"
3. **Esperado:** Los filtros se cargan correctamente

### Prueba 9: Contar Usuarios de un Segmento
1. Seleccionar un segmento existente
2. Hacer clic en "Contar"
3. **Esperado:** Se muestra el número de usuarios coincidentes

### Prueba 10: Descargar Usuarios
1. Seleccionar un segmento existente
2. Hacer clic en "Descargar"
3. **Esperado:** Se descarga un archivo CSV con los usuarios

## Notas Importantes

1. **Compatibilidad hacia atrás:** El código ahora maneja tanto `criteria` como `filters`, lo que permite que segmentos creados con versiones anteriores del código sigan funcionando.

2. **Logging:** Se han añadido logs de consola para facilitar la depuración de futuros problemas.

3. **Mensajes de error:** Los mensajes de error ahora son más descriptivos y ayudan al usuario a entender qué salió mal.

4. **Validación en dos niveles:** La validación se realiza tanto en el frontend (para mejor experiencia de usuario) como en el backend (para seguridad).

## Archivos Modificados

1. `components/Admin/Sections/EmailSection.tsx`
2. `pages/api/email/segments.ts`
3. `pages/api/email/segments/[id].ts`
4. `pages/api/email/segments/[id]/users.ts`
5. `pages/api/email/segments/[id]/count.ts`
6. `lib/segmentUtils.ts`

## Archivos Creados

1. `scripts/fix_email_segments_column.sql`
