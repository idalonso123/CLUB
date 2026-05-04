#!/bin/bash
#
# Script de instalación rápida para cajas registradoras
# Club ViveVerde TPV
#

set -e

echo "=========================================="
echo " Club ViveVerde TPV - Instalador"
echo "=========================================="
echo ""

# Colores para输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Función para mostrar mensajes
success() {
    echo -e "${GREEN}✓${NC} $1"
}

warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

error() {
    echo -e "${RED}✗${NC} $1"
}

# Verificar si git está instalado
if ! command -v git &> /dev/null; then
    error "Git no está instalado. Por favor, instala Git primero."
    exit 1
fi

# Verificar si npm está instalado
if ! command -v npm &> /dev/null; then
    error "npm no está instalado. Por favor, instala Node.js primero."
    exit 1
fi

success "Git y npm detectados"

# Obtener directorio actual
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Cambiar al directorio del proyecto
cd "$SCRIPT_DIR"

# Verificar si es un repositorio git
if [ ! -d ".git" ]; then
    warn "No es un repositorio Git. ¿Deseas clonar el repositorio?"
    read -p "Introduce la URL del repositorio (o pulsa Enter para cancelar): " repo_url
    
    if [ -z "$repo_url" ]; then
        error "Instalación cancelada"
        exit 1
    fi
    
    warn "Clonando repositorio..."
    git clone "$repo_url" .
fi

success "Directorio del proyecto preparado"

# Actualizar código
warn "Actualizando código..."
git pull origin main 2>/dev/null || warn "No se pudo hacer pull (puede que no haya conexión)"
success "Código actualizado"

# Instalar dependencias base
warn "Instalando dependencias..."
npm install
success "Dependencias instaladas"

# Instalar Electron
warn "Instalando Electron para TPV..."
npm install electron@^28.1.0 electron-builder@^24.9.1 electron-log@^5.0.3 --save-dev
success "Electron instalado"

echo ""
echo "=========================================="
success "Instalación completada"
echo "=========================================="
echo ""
echo "Para ejecutar las aplicaciones TPV:"
echo ""
echo "  Ventana de búsqueda rápida:"
echo "    npm run electron:search"
echo ""
echo "  Ventana de gestión de usuarios:"
echo "    npm run electron:users"
echo ""
echo "  Dashboard TPV completo:"
echo "    npm run electron:start"
echo ""
echo "Para más información, consulta:"
echo "  docs/CAJA_INSTALACION.md"
echo ""
