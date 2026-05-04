#!/bin/bash

# ==============================================================================
# SCRIPT DE DESPLIEGUE AUTOMATIZADO - CLUB VIVE VERDE
# ==============================================================================
# Este script automatiza el proceso de despliegue de la aplicación Next.js
# incluyendo: pull de cambios, limpieza, construcción y reinicio del servicio.
#
# Uso: ./deploy.sh [opciones]
# Opciones:
#   -h, --help        Mostrar esta ayuda
#   -s, --skip-git    Saltar la actualización de git
#   -c, --clean       Forzar limpieza completa (elimina node_modules/.cache)
#   -d, --dev         Usar modo desarrollo (npm run dev)
#   -e, --env ARQ     Especificar archivo .env (por defecto: .env)
# ==============================================================================

# ==============================================================================
# CARGAR VARIABLES DE CONFIGURACIÓN
# ==============================================================================

# Detectar directorio del proyecto (donde está este script)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DIRECTORIO_PROYECTO="$SCRIPT_DIR"

# Cargar variables desde archivo .env si existe
CONFIG_FILE="$DIRECTORIO_PROYECTO/.env"
if [ -f "$CONFIG_FILE" ]; then
    # Leer variables del archivo .env (solo líneas que no son comentarios ni vacías)
    while IFS= read -r line || [ -n "$line" ]; do
        # Ignorar comentarios y líneas vacías
        [[ "$line" =~ ^[[:space:]]*# ]] && continue
        [[ -z "$line" ]] && continue
        
        # Extraer nombre y valor
        if [[ "$line" =~ ^([A-Za-z_][A-Za-z0-9_]*)[[:space:]]*=[[:space:]]*(.*)$ ]]; then
            var_name="${BASH_REMATCH[1]}"
            var_value="${BASH_REMATCH[2]}"
            
            # Eliminar comillas si las hay
            var_value="${var_value%\"}"
            var_value="${var_value#\"}"
            var_value="${var_value%\'}"
            var_value="${var_value#\'}"
            
            # Exportar variable
            export "$var_name=$var_value"
        fi
    done < "$CONFIG_FILE"
fi

# ==============================================================================
# CONFIGURACIÓN (Valores por defecto o desde variables de entorno)
# ==============================================================================

# Nombre de la aplicación (usar variable de entorno o detectar del package.json)
NOMBRE_APLICACION="${APP_NAME:-$(grep -m1 '"name":' "$DIRECTORIO_PROYECTO/package.json" 2>/dev/null | sed 's/.*: *"\([^"]*\)".*/\1/' || echo 'club-viveverde')}"

# Nombre del servicio PM2
NOMBRE_SERVICIO="${PM2_SERVICE_NAME:-${APP_NAME:-club-viveverde}}"

# Carpeta de build de Next.js
CARPETA_NEXT="${NEXT_BUILD_FOLDER:-.next}"

# Puerto de la aplicación
PUERTO="${PORT:-3000}"

# Directorio de logs
LOG_DIR="${LOG_DIR:-/var/log}"
LOG_FILE="${DEPLOY_LOG_FILE:-$LOG_DIR/deploy-${NOMBRE_APLICACION}.log}"

# Rama de Git
GIT_BRANCH="${GIT_DEPLOY_BRANCH:-main}"

# Variables de la empresa (desde .env)
NOMBRE_EMPRESA="${NEXT_PUBLIC_COMPANY_NAME:-Club ViveVerde}"
SITIO_WEB="${NEXT_PUBLIC_SITE_URL:-https://clubviveverde.com}"

# Protocolo personalizado para TPV
PROTOCOLO_TPV="${TPV_PROTOCOL:-clubviveverde}"

# Flags de opciones
SKIP_GIT=false
FORCE_CLEAN=false
DEV_MODE=false

# ==============================================================================
# COLORES PARA SALIDA
# ==============================================================================

ROJO='\033[0;31m'
VERDE='\033[0;32m'
AMARILLO='\033[1;33m'
AZUL='\033[0;34m'
CYAN='\033[0;36m'
BLANCO='\033[1;37m'
NC='\033[0m' # Sin color

# ==============================================================================
# FUNCIONES DE UTILIDADES
# ==============================================================================

# Función para mostrar mensajes con formato
mostrar_mensaje() {
    local tipo=$1
    local mensaje=$2
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    case $tipo in
        "info")
            echo -e "${AZUL}[INFO]${NC} ${mensaje}"
            echo "[$timestamp] [INFO] $mensaje" >> "$LOG_FILE" 2>/dev/null
            ;;
        "exito")
            echo -e "${VERDE}[EXITO]${NC} ${mensaje}"
            echo "[$timestamp] [EXITO] $mensaje" >> "$LOG_FILE" 2>/dev/null
            ;;
        "advertencia")
            echo -e "${AMARILLO}[ADVERTENCIA]${NC} ${mensaje}"
            echo "[$timestamp] [ADVERTENCIA] $mensaje" >> "$LOG_FILE" 2>/dev/null
            ;;
        "error")
            echo -e "${ROJO}[ERROR]${NC} ${mensaje}"
            echo "[$timestamp] [ERROR] $mensaje" >> "$LOG_FILE" 2>/dev/null
            ;;
        "progreso")
            echo -e "${CYAN}[PROGRESO]${NC} ${mensaje}"
            echo "[$timestamp] [PROGRESO] $mensaje" >> "$LOG_FILE" 2>/dev/null
            ;;
    esac
}

# Función para mostrar la ayuda
mostrar_ayuda() {
    cat << EOF
SCRIPT DE DESPLIEGUE AUTOMATIZADO - $NOMBRE_EMPRESA
=============================================

Este script automatiza el proceso de despliegue de la aplicación Next.js.

VARIABLES DE ENTORNO CONFIGURABLES:
    APP_NAME                  - Nombre de la aplicación (default: detectado de package.json)
    PM2_SERVICE_NAME         - Nombre del servicio en PM2 (default: igual que APP_NAME)
    PORT                      - Puerto de la aplicación (default: 3000)
    LOG_DIR                   - Directorio de logs (default: /var/log)
    GIT_DEPLOY_BRANCH         - Rama de git para deploy (default: main)
    TPV_PROTOCOL              - Protocolo TPV (default: clubviveverde)

USO:
    ./deploy.sh [opciones]

OPCIONES:
    -h, --help       Mostrar esta ayuda y salir
    -s, --skip-git   Saltar la actualización de git (no hacer pull)
    -c, --clean      Forzar limpieza completa (incluye node_modules/.cache)
    -d, --dev        Usar modo desarrollo en lugar de producción
    -p, --production Usar modo producción (por defecto)
    -e, --env ARQ     Especificar archivo .env alternativo

EJEMPLOS:
    ./deploy.sh                  # Despliegue completo normal
    ./deploy.sh -s              # Despliegue sin actualizar git
    ./deploy.sh -c              # Despliegue con limpieza completa
    ./deploy.sh -d              # Probar en modo desarrollo
    ./deploy.sh -s -c           # Sin git y con limpieza completa
    APP_NAME=mi-app ./deploy.sh # Con variable de entorno

NOTAS:
    - El script requiere permisos de ejecución: chmod +x deploy.sh
    - Lee automáticamente el archivo .env del proyecto
    - Los logs se guardan en: $LOG_FILE
    - El proceso PM2 debe estar configurado previamente

EOF
}

# Función para verificar prerequisites
verificar_prerequisites() {
    mostrar_mensaje "progreso" "Verificando prerequisitos..."
    
    # Verificar que el directorio existe
    if [ ! -d "$DIRECTORIO_PROYECTO" ]; then
        mostrar_mensaje "error" "El directorio del proyecto no existe: $DIRECTORIO_PROYECTO"
        exit 1
    fi
    
    # Verificar que npm está disponible
    if ! command -v npm &> /dev/null; then
        mostrar_mensaje "error" "npm no está instalado o no está en el PATH"
        exit 1
    fi
    
    # Verificar que pm2 está disponible
    if ! command -v pm2 &> /dev/null; then
        mostrar_mensaje "advertencia" "PM2 no está instalado. El script continuará pero no podrá reiniciar el servicio."
    fi
    
    # Verificar que git está disponible (si no se salta)
    if [ "$SKIP_GIT" = false ]; then
        if ! command -v git &> /dev/null; then
            mostrar_mensaje "advertencia" "Git no está instalado. Se saltará la actualización de git."
            SKIP_GIT=true
        fi
    fi
    
    mostrar_mensaje "exito" "Prerequisitos verificados correctamente"
}

# Función para crear logs
inicializar_log() {
    # Crear directorio de logs si no existe
    local log_dir=$(dirname "$LOG_FILE")
    if [ ! -d "$log_dir" ]; then
        mkdir -p "$log_dir" 2>/dev/null || LOG_FILE="/tmp/deploy-${NOMBRE_APLICACION}.log"
    fi
    
    mostrar_mensaje "info" "Logs guardados en: $LOG_FILE"
}

# ==============================================================================
# FUNCIONES PRINCIPALES DE DESPLIEGUE
# ==============================================================================

# Función para actualizar git
actualizar_git() {
    if [ "$SKIP_GIT" = true ]; then
        mostrar_mensaje "info" "Saltando actualización de git (flag -s activo)"
        return 0
    fi
    
    mostrar_mensaje "progreso" "Actualizando código desde Git..."
    
    cd "$DIRECTORIO_PROYECTO" || exit 1
    
    # Verificar si es un repositorio git
    if [ ! -d ".git" ]; then
        mostrar_mensaje "advertencia" "El directorio no es un repositorio git. Se saltará la actualización."
        SKIP_GIT=true
        return 0
    fi
    
    # Guardar cambios locales si los hay
    if [ -n "$(git status --porcelain)" ]; then
        mostrar_mensaje "advertencia" "Hay cambios locales sin commit. Guardando stash..."
        git stash push -m "Auto-stash antes de deploy $(date)"
    fi
    
    # Pull de cambios
    if git pull origin "$GIT_BRANCH"; then
        mostrar_mensaje "exito" "Código actualizado correctamente desde Git (rama: $GIT_BRANCH)"
    else
        mostrar_mensaje "error" "Error al actualizar desde Git. Continuando con el código actual..."
        git stash pop 2>/dev/null
    fi
}

# Función para limpiar construcción anterior
limpiar_build() {
    mostrar_mensaje "progreso" "Limpiando construcción anterior..."
    
    cd "$DIRECTORIO_PROYECTO" || exit 1
    
    # CRÍTICO: Eliminar COMPLETAMENTE el directorio .next para evitar conflictos
    # con archivos residuales de construcciones anteriores (ej: middleware-manifest.json)
    if [ -d "$CARPETA_NEXT" ]; then
        mostrar_mensaje "info" "Eliminando directorio $CARPETA_NEXT para evitar conflictos..."
        rm -rf "$CARPETA_NEXT"
        
        # Verificar que se eliminó correctamente
        if [ -d "$CARPETA_NEXT" ]; then
            mostrar_mensaje "error" "No se pudo eliminar $CARPETA_NEXT. Intentando con sudo..."
            sudo rm -rf "$CARPETA_NEXT" || {
                mostrar_mensaje "error" "Error al eliminar $CARPETA_NEXT manualmente"
                exit 1
            }
        fi
        mostrar_mensaje "exito" "Directorio $CARPETA_NEXT eliminado completamente"
    else
        mostrar_mensaje "info" "Directorio $CARPETA_NEXT no existe (primera construcción)"
    fi
    
    # Limpieza adicional de caché de Next.js si se pide
    if [ "$FORCE_CLEAN" = true ]; then
        mostrar_mensaje "info" "Limpiando cache de node_modules y Next.js..."
        rm -rf node_modules/.cache 2>/dev/null
        rm -rf .next 2>/dev/null
        rm -rf /root/.npm/_cacache 2>/dev/null
        mostrar_mensaje "exito" "Limpieza completa realizada"
    fi
}

# Función para instalar dependencias
instalar_dependencias() {
    mostrar_mensaje "progreso" "Verificando dependencias de npm..."
    
    cd "$DIRECTORIO_PROYECTO" || exit 1
    
    # Verificar si package-lock.json existe
    if [ -f "package-lock.json" ]; then
        mostrar_mensaje "info" "Instalando dependencias con npm ci (más rápido y confiable)..."
        if npm ci --prefer-offline; then
            mostrar_mensaje "exito" "Dependencias instaladas correctamente"
        else
            mostrar_mensaje "advertencia" "npm ci falló, intentando npm install..."
            if npm install; then
                mostrar_mensaje "exito" "Dependencias instaladas con npm install"
            else
                mostrar_mensaje "error" "Error al instalar dependencias"
                exit 1
            fi
        fi
    else
        mostrar_mensaje "info" "Instalando dependencias con npm install..."
        if npm install; then
            mostrar_mensaje "exito" "Dependencias instaladas correctamente"
        else
            mostrar_mensaje "error" "Error al instalar dependencias"
            exit 1
        fi
    fi
}

# Función para construir la aplicación
construir_aplicacion() {
    mostrar_mensaje "progreso" "Construyendo aplicación Next.js..."
    
    cd "$DIRECTORIO_PROYECTO" || exit 1
    
    # Verificar que el protocolo TPV está en el código
    mostrar_mensaje "info" "Verificando integración del protocolo $PROTOCOLO_TPV..."
    if grep -q "$PROTOCOLO_TPV" electron/tpv-main.js contexts/AuthContext.tsx 2>/dev/null; then
        mostrar_mensaje "exito" "Protocolo $PROTOCOLO_TPV encontrado en el código fuente"
    else
        mostrar_mensaje "advertencia" "Protocolo $PROTOCOLO_TPV no encontrado en los archivos principales"
    fi
    
    # Ejecutar build
    if npm run build; then
        mostrar_mensaje "exito" "Aplicación construida correctamente"
    else
        mostrar_mensaje "error" "Error durante la construcción de la aplicación"
        exit 1
    fi
}

# Función para iniciar/restaurar el servidor
iniciar_servidor() {
    cd "$DIRECTORIO_PROYECTO" || exit 1
    
    if [ "$DEV_MODE" = true ]; then
        mostrar_mensaje "info" "Iniciando en modo DESARROLLO (npm run dev)..."
        
        # En modo desarrollo, usar pm2 con watch
        if command -v pm2 &> /dev/null; then
            pm2 delete "$NOMBRE_SERVICIO" 2>/dev/null
            pm2 start npm --name "$NOMBRE_SERVICIO" -- start dev
            pm2 save
            mostrar_mensaje "exito" "Servidor de desarrollo iniciado con PM2"
        else
            mostrar_mensaje "info" "PM2 no disponible. Iniciando manualmente..."
            npm run dev &
            mostrar_mensaje "exito" "Servidor de desarrollo iniciado en segundo plano"
        fi
    else
        mostrar_mensaje "info" "Iniciando/restaurando servidor de PRODUCCIÓN..."
        
        # Verificar si existe una configuración de PM2 guardada
        if [ -f "ecosystem.config.js" ]; then
            mostrar_mensaje "info" "Usando configuración ecosystem.config.js..."
            pm2 startOrRestart ecosystem.config.js --env production
        else
            # Intentar restaurar o iniciar con la configuración por defecto
            if pm2 list | grep -q "$NOMBRE_SERVICIO"; then
                mostrar_mensaje "info" "Reiniciando proceso existente..."
                pm2 restart "$NOMBRE_SERVICIO"
            else
                mostrar_mensaje "info" "Iniciando nuevo servidor..."
                pm2 start npm --name "$NOMBRE_SERVICIO" -- start
            fi
        fi
        
        # Guardar configuración de PM2
        pm2 save 2>/dev/null
        mostrar_mensaje "exito" "Servidor de producción iniciado/restaurado"
    fi
}

# Función para verificar el estado del despliegue
verificar_despliegue() {
    mostrar_mensaje "progreso" "Verificando estado del despliegue..."
    
    # Verificar que el directorio .next existe
    if [ ! -d "$DIRECTORIO_PROYECTO/$CARPETA_NEXT" ]; then
        mostrar_mensaje "error" "El directorio $CARPETA_NEXT no existe después del build"
        return 1
    fi
    
    # VERIFICACIÓN CRÍTICA: Verificar archivos esenciales del build
    mostrar_mensaje "info" "Verificando archivos esenciales del build..."
    
    local archivos_criticos=(
        "$CARPETA_NEXT/server/middleware-manifest.json"
        "$CARPETA_NEXT/BUILD_ID"
        "$CARPETA_NEXT/static"
    )
    
    local archivos_faltantes=0
    for archivo in "${archivos_criticos[@]}"; do
        if [ ! -e "$DIRECTORIO_PROYECTO/$archivo" ]; then
            mostrar_mensaje "advertencia" "Archivo crítico faltante: $archivo"
            archivos_faltantes=$((archivos_faltantes + 1))
        fi
    done
    
    if [ $archivos_faltantes -gt 0 ]; then
        mostrar_mensaje "error" "Se encontraron $archivos_faltantes archivos críticos faltantes"
        mostrar_mensaje "error" "La construcción puede estar incompleta. Ejecuta con -c para limpieza completa."
        return 1
    fi
    
    mostrar_mensaje "exito" "Todos los archivos críticos del build están presentes"
    
    # Verificar estado de PM2
    if command -v pm2 &> /dev/null; then
        local estado=$(pm2 list | grep "$NOMBRE_SERVICIO" | awk '{print $10}')
        if [ "$estado" = "online" ] || [ "$estado" = "errored" ]; then
            mostrar_mensaje "exito" "Estado de PM2: $estado"
        else
            mostrar_mensaje "advertencia" "Estado de PM2 inesperado. Revisar manualmente."
        fi
    fi
    
    # Verificar integración del protocolo en el build
    if grep -r "$PROTOCOLO_TPV" "$DIRECTORIO_PROYECTO/$CARPETA_NEXT" 2>/dev/null | head -1 | grep -q "$PROTOCOLO_TPV"; then
        mostrar_mensaje "exito" "Protocolo $PROTOCOLO_TPV incluido en el build"
    else
        mostrar_mensaje "advertencia" "No se pudo verificar el protocolo $PROTOCOLO_TPV en el build"
    fi
    
    mostrar_mensaje "exito" "Verificación completada"
}

# ==============================================================================
# FUNCIÓN PRINCIPAL
# ==============================================================================

mostrar_banner() {
    echo ""
    echo -e "${CYAN}╔══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║${NC}     ${BLANCO}SCRIPT DE DESPLIEGUE - $NOMBRE_EMPRESA${NC}"
    echo -e "${CYAN}║${NC}     ${AMARILLO}Automatización del despliegue Next.js${NC}"
    echo -e "${CYAN}╚══════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${AZUL}Configuración detectada:${NC}"
    echo "  - Proyecto: $DIRECTORIO_PROYECTO"
    echo "  - App: $NOMBRE_APLICACION"
    echo "  - Servicio PM2: $NOMBRE_SERVICIO"
    echo "  - Puerto: $PUERTO"
    echo "  - Sitio: $SITIO_WEB"
    echo "  - Rama Git: $GIT_BRANCH"
    echo ""
}

# ==============================================================================
# PUNTO DE ENTRADA PRINCIPAL
# ==============================================================================

main() {
    # Parsear argumentos
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                mostrar_ayuda
                exit 0
                ;;
            -s|--skip-git)
                SKIP_GIT=true
                shift
                ;;
            -c|--clean)
                FORCE_CLEAN=true
                shift
                ;;
            -d|--dev)
                DEV_MODE=true
                shift
                ;;
            -p|--production)
                DEV_MODE=false
                shift
                ;;
            -e|--env)
                if [[ -z "$2" || "$2" == -* ]]; then
                    mostrar_mensaje "error" "Falta el argumento para --env"
                    exit 1
                fi
                CONFIG_FILE="$2"
                shift 2
                ;;
            *)
                mostrar_mensaje "error" "Opción desconocida: $1"
                mostrar_ayuda
                exit 1
                ;;
        esac
    done
    
    # Iniciar
    mostrar_banner
    inicializar_log
    
    mostrar_mensaje "info" "Iniciando despliegue de $NOMBRE_APLICACION"
    mostrar_mensaje "info" "Directorio: $DIRECTORIO_PROYECTO"
    mostrar_mensaje "info" "Modo: $([ "$DEV_MODE" = true ] && echo 'DESARROLLO' || echo 'PRODUCCION')"
    echo ""
    
    # Ejecutar pasos del despliegue
    verificar_prerequisites
    actualizar_git
    limpiar_build
    instalar_dependencias
    construir_aplicacion
    iniciar_servidor
    verificar_despliegue
    
    # Resumen final
    echo ""
    echo -e "${VERDE}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${VERDE}  DESPLIEGUE COMPLETADO EXITOSAMENTE${NC}"
    echo -e "${VERDE}═══════════════════════════════════════════════════════════${NC}"
    echo ""
    echo "Próximos pasos:"
    echo "  1. Verificar logs: tail -f $LOG_FILE"
    echo "  2. Monitorear estado: pm2 status"
    echo "  3. Ver errores: pm2 logs $NOMBRE_SERVICIO"
    echo "  4. Probar la aplicación: $SITIO_WEB"
    echo ""
    
    # Mostrar estado final de PM2
    if command -v pm2 &> /dev/null; then
        echo -e "${AZUL}Estado actual de PM2:${NC}"
        pm2 status
    fi
    
    echo ""
}

# Ejecutar función principal
main "$@"
