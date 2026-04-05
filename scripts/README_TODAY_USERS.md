# Script de Extracción de Usuarios del Día

Este directorio contiene scripts para extraer usuarios creados en el día de hoy desde la base de datos.

## Archivos Disponibles

### 1. `extract-today-users.js` (Recomendado)
Versión en JavaScript puro, fácil de ejecutar.

**Uso:**
```bash
node scripts/extract-today-users.js
```

**Requisitos:**
- Configurar `.env.local` con las variables de MySQL:
  - `MYSQL_HOST`
  - `MYSQL_PORT`
  - `MYSQL_DATABASE`
  - `MYSQL_USER`
  - `MYSQL_PASSWORD`

**Salida:**
- Muestra los usuarios en consola
- Genera un archivo CSV: `usuarios_hoy_YYYYMMDD.csv`

### 2. `extract-today-users.ts`
Versión en TypeScript para integración con el proyecto.

**Uso:**
```bash
npx ts-node scripts/extract-today-users.ts
```

### 3. `extract_today_users.sql`
Script SQL puro para ejecutar directamente en MySQL.

**Uso:**
```bash
mysql -u root -p "Club ViveVerde" < scripts/extract_today_users.sql
```

O desde phpMyAdmin:
1. Abrir phpMyAdmin
2. Seleccionar la base de datos "Club ViveVerde"
3. Ir a la pestaña "SQL"
4. Copiar y pegar el contenido del archivo
5. Ejecutar

## Campos Extraídos

El script extrae los siguientes campos de la tabla `personas`:

- `codigo` - ID único del usuario
- `cif` - Número de identificación fiscal
- `nombres` - Nombre(s)
- `apellidos` - Apellido(s)
- `mail` - Correo electrónico
- `telefono` - Número de teléfono
- `rol` - Rol del usuario (administrador, usuario, cajero, etc.)
- `creado_en` - Fecha y hora de creación
- `status` - Estado (1=Activo, 0=Inactivo)
- `puntos` - Puntos actuales

## Ejemplo de Salida CSV

```csv
codigo,cif,apellidos,nombres,email,telefono,rol,creado_en,status,puntos
"123","12345678A","García","Juan","juan@ejemplo.com","600123456","usuario","2026-04-06 10:30:00",1,100
```
