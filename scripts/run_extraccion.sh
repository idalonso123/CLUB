#!/bin/bash
# Script para ejecutar la extraccion diaria de usuarios
# Club ViveVerde

# Ir al directorio del proyecto
cd /home/club-viveverde-aplicacion

# Ejecutar el script de extraccion y guardar log
node scripts/extract-today-users-xlsx.js >> logs/extraccion.log 2>&1

# Mensaje de finalizacion
echo "Extraccion completada el $(date)" >> logs/extraccion.log
#!/bin/bash
cd /home/club-viveverde-aplicacion
node scripts/extract-today-users-xlsx.js >> logs/extraccion.log 2>&1
echo "Extraccion completada el $(date)" >> logs/extraccion.log
