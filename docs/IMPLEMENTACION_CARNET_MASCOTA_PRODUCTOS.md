# Implementación: Buscador de Productos para Carnet de Mascotas

## Descripción
Esta implementación modifica el campo "Producto comprado" en el modal de "Nuevo Carnet" del panel de cajero. En lugar de un campo de texto libre, ahora es un buscador desplegable que permite buscar productos por:
- Nombre del artículo
- Código de artículo
- Código de barras (EAN)

## Archivos Modificados/Creados

### Nuevos Archivos

1. **`scripts/create_productos_carnet_mascota.sql`**
   - Script SQL para crear la tabla `productos_carnet_mascota`
   - Define la estructura de la tabla con índices optimizados para búsqueda

2. **`scripts/import_productos_carnet_mascota.js`**
   - Script Node.js para importar datos desde el archivo Excel
   - Requiere el archivo `Alimento_mascota_2026-04-07.xlsx`

3. **`pages/api/cajero/productos-carnet/search.ts`**
   - API endpoint para buscar productos
   - Endpoint: `GET /api/cajero/productos-carnet/search?query=xxx&limit=20`
   - Busca por código de artículo, nombre o código de barras

4. **`types/teller.ts`**
   - Añadida interfaz `ProductoCarnet` para tipado de productos

### Archivos Modificados

1. **`components/Teller/TellerComponents/PetCardModal.tsx`**
   - Reescrito para incluir el componente de búsqueda de productos
   - Incluye dropdown con resultados, debounce en búsqueda, y selección de producto

2. **`Club ViveVerde.sql`**
   - Añadida definición de la tabla `productos_carnet_mascota`

## Estructura de la Tabla `productos_carnet_mascota`

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | INT AUTO_INCREMENT | Identificador único |
| Articulo | VARCHAR(20) | Código de artículo |
| Nombre | VARCHAR(255) | Nombre del artículo |
| Talla | VARCHAR(50) | Talla del artículo |
| Color | VARCHAR(50) | Color del artículo |
| C_Barras | VARCHAR(20) | Código de barras (único) |
| PVP | DECIMAL(10,2) | Precio de venta al público |
| activo | TINYINT(1) | Si el producto está activo |
| fecha_creacion | DATETIME | Fecha de creación del registro |
| fecha_modificacion | DATETIME | Fecha de última modificación |

## Pasos de Instalación en Producción

### 1. Ejecutar el Script SQL

Conectar a la base de datos MySQL y ejecutar:

```sql
-- Crear la tabla
CREATE TABLE IF NOT EXISTS `productos_carnet_mascota` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `Articulo` VARCHAR(20) NOT NULL COMMENT 'Código de artículo',
  `Nombre` VARCHAR(255) NOT NULL COMMENT 'Nombre del artículo',
  `Talla` VARCHAR(50) DEFAULT NULL COMMENT 'Talla del artículo',
  `Color` VARCHAR(50) DEFAULT NULL COMMENT 'Color del artículo',
  `C_Barras` VARCHAR(20) NOT NULL COMMENT 'Código de barras (único)',
  `PVP` DECIMAL(10,2) NOT NULL COMMENT 'Precio de venta al público',
  `activo` TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'Si el producto está activo para carnets',
  `fecha_creacion` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  `fecha_modificacion` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
  UNIQUE KEY `c_barras_unique` (`C_Barras`),
  INDEX `idx_articulo` (`Articulo`),
  INDEX `idx_nombre` (`Nombre`),
  INDEX `idx_buscar` (`Articulo`, `Nombre`, `C_Barras`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
```

### 2. Importar Datos del Excel

#### Opción A: Usando el Script Node.js

```bash
# Instalar dependencias necesarias
npm install mysql2 xlsx

# Configurar variables de entorno
export DB_HOST=tu_servidor
export DB_USER=tu_usuario
export DB_PASSWORD=tu_password
export DB_NAME=viveverde

# Ejecutar el script
node scripts/import_productos_carnet_mascota.js
```

#### Opción B: Importar manualmente desde CSV

1. Exportar el Excel a CSV (UTF-8)
2. Usar phpMyAdmin o línea de comandos MySQL:

```sql
LOAD DATA LOCAL INFILE '/ruta/al/archivo.csv'
INTO TABLE productos_carnet_mascota
FIELDS TERMINATED BY ','
ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS
(Articulo, Nombre, Talla, Color, C_Barras, PVP);
```

### 3. Desplegar la Aplicación

```bash
# Build de producción
npm run build

# Desplegar (verificar que el proceso de deployment está activo)
```

## Uso del Buscador

1. Ir al panel de cajero
2. Buscar un usuario
3. Clic en "Carnet mascota"
4. Ir a la pestaña "Nuevo Carnet"
5. En el campo "Producto comprado":
   - Escribir para buscar (mínimo 1 carácter)
   - Se muestran productos recientes al inicio
   - Los resultados incluyen nombre, talla, color, código de barras y precio
   - Clic en un producto para seleccionarlo
   - El producto seleccionado muestra un resumen con referencia, EAN y precio
   - Se puede cambiar el producto haciendo clic en "Cambiar"

## Notas Técnicas

### Búsqueda
- La búsqueda es insensible a mayúsculas/minúsculas
- Se priorizan coincidencias exactas de código de barras
- Luego coincidencias exactas de código de artículo
- Finalmente coincidencias parciales en nombre

### Índices
La tabla tiene los siguientes índices para optimizar la búsqueda:
- `c_barras_unique`: UNIQUE sobre C_Barras
- `idx_articulo`: Índice en Articulo
- `idx_nombre`: Índice en Nombre
- `idx_buscar`: Índice compuesto para búsqueda

### Límites
- Máximo 100 resultados por búsqueda
- Valor por defecto: 20 resultados
- Debounce de 300ms en la búsqueda

## Resolución de Problemas

### "No se encontraron productos"
- Verificar que la tabla `productos_carnet_mascota` existe
- Verificar que hay datos en la tabla
- Revisar la conexión a la base de datos

### Error al importar desde Excel
- Verificar que el archivo Excel tiene las columnas correctas
- Las columnas deben ser: Articulo, Nombre, Talla, Color, C_Barras, PVP
- Asegurarse de que el código de barras no tenga duplicados

### El dropdown no aparece
- Verificar que el JavaScript se carga correctamente
- Revisar la consola del navegador por errores

## Mantenimiento

### Añadir nuevos productos
```sql
INSERT INTO productos_carnet_mascota (Articulo, Nombre, Talla, Color, C_Barras, PVP)
VALUES ('12345', 'Nuevo Producto', '1kg', 'UNICO', '1234567890123', 9.99);
```

### Desactivar un producto
```sql
UPDATE productos_carnet_mascota SET activo = 0 WHERE id = 123;
```

### Ver productos activos
```sql
SELECT * FROM productos_carnet_mascota WHERE activo = 1 ORDER BY Nombre;
```
