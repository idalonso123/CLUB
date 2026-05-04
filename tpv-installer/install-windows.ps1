# ==============================================================================
# Club ViveVerde TPV - Instalador Automático para Windows
# ==============================================================================
# Este script automatiza la instalación completa del sistema TPV Electron
# incluyendo: Node.js, Electron, protocolo personalizado y accesos directos.
#
# Uso: Ejecutar como Administrador
#   - Clic derecho en el archivo -> "Ejecutar como administrador"
# ==============================================================================

$ErrorActionPreference = "Stop"

# ==============================================================================
# CONFIGURACIÓN
# ==============================================================================

$APP_NAME = "Club ViveVerde TPV"
$PROTOCOL_NAME = "clubviveverde"
$INSTALL_DIR = "$env:USERPROFILE\ClubViveVerdeTPV"
$REPO_URL = "https://github.com/idalonso123/CLUB.git"
$ELECTRON_PACKAGES = @("electron@^28.1.0", "electron-builder@^24.9.1", "electron-log@^5.0.3")

# Colores para la consola
function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Type = "info"
    )
    
    $colors = @{
        "success" = "Green"
        "error" = "Red"
        "warning" = "Yellow"
        "info" = "Cyan"
        "title" = "Magenta"
    }
    
    $color = $colors[$Type] -replace "^$", "White"
    Write-Host $Message -ForegroundColor $color
}

function Write-Title {
    param([string]$Message)
    Write-ColorOutput "`n========================================" "title"
    Write-ColorOutput " $Message" "title"
    Write-ColorOutput "========================================`n" "title"
}

# ==============================================================================
# VERIFICACIONES INICIALES
# ==============================================================================

Write-Title "VERIFICACIONES INICIALES"

# Verificar si se está ejecutando como administrador
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-ColorOutput "ADVERTENCIA: Este script debería ejecutarse como Administrador para registrar el protocolo." "warning"
    Write-ColorOutput "El protocolo personalizado no funcionará sin permisos de administrador.`n" "warning"
    $continue = Read-Host "¿Continuar de todas formas? (S/N)"
    if ($continue -ne "S") {
        Write-ColorOutput "Instalación cancelada." "error"
        exit 1
    }
}

Write-ColorOutput "[OK] Script iniciado correctamente" "success"

# ==============================================================================
# VERIFICAR E INSTALAR NODE.JS
# ==============================================================================

Write-Title "VERIFICANDO NODE.JS"

$nodeVersion = $null

try {
    $nodeVersion = node --version 2>$null
    Write-ColorOutput "[OK] Node.js encontrado: $nodeVersion" "success"
} catch {
    Write-ColorOutput "[INFO] Node.js no encontrado. Procediendo a instalar..." "info"
}

if (-not $nodeVersion) {
    Write-ColorOutput "[INFO] Descargando instalador de Node.js..." "info"
    
    $nodeInstallerUrl = "https://nodejs.org/dist/v20.11.0/node-v20.11.0-x64.msi"
    $nodeInstallerPath = "$env:TEMP\node-installer.msi"
    
    try {
        Write-ColorOutput "[INFO] Descargando Node.js LTS (esto puede tardar varios minutos)..." "info"
        [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
        Invoke-WebRequest -Uri $nodeInstallerUrl -OutFile $nodeInstallerPath -UseBasicParsing
        
        Write-ColorOutput "[INFO] Instalando Node.js..." "info"
        Start-Process msiexec -ArgumentList "/i `"$nodeInstallerPath`" /quiet /norestart" -Wait -NoNewWindow
        
        # Refrescar variables de entorno
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
        
        # Verificar instalación
        Start-Sleep -Seconds 3
        $nodeVersion = node --version 2>$null
        
        if ($nodeVersion) {
            Write-ColorOutput "[OK] Node.js instalado correctamente: $nodeVersion" "success"
        } else {
            throw "Node.js no se instaló correctamente"
        }
    } catch {
        Write-ColorOutput "[ERROR] No se pudo instalar Node.js automáticamente." "error"
        Write-ColorOutput "[INFO] Por favor, descarga e instala Node.js manualmente desde:" "info"
        Write-ColorOutput "   https://nodejs.org" "info"
        exit 1
    }
}

# Verificar npm
try {
    $npmVersion = npm --version 2>$null
    Write-ColorOutput "[OK] npm encontrado: v$npmVersion" "success"
} catch {
    Write-ColorOutput "[ERROR] npm no está disponible. Verifica la instalación de Node.js." "error"
    exit 1
}

# ==============================================================================
# PREPARAR DIRECTORIO DEL PROYECTO
# ==============================================================================

Write-Title "PREPARANDO PROYECTO"

if (Test-Path $INSTALL_DIR) {
    Write-ColorOutput "[INFO] El directorio de instalación ya existe. Actualizando..." "info"
    Set-Location $INSTALL_DIR
    
    # Intentar actualizar desde git
    if (Test-Path "$INSTALL_DIR\.git") {
        try {
            Write-ColorOutput "[INFO] Actualizando código desde Git..." "info"
            git pull origin main
        } catch {
            Write-ColorOutput "[WARNING] No se pudo actualizar desde Git. Usando código existente." "warning"
        }
    }
} else {
    Write-ColorOutput "[INFO] Creando directorio de instalación..." "info"
    New-Item -ItemType Directory -Path $INSTALL_DIR -Force | Out-Null
    Set-Location $INSTALL_DIR
    
    Write-ColorOutput "[INFO] Clonando repositorio..." "info"
    try {
        git clone $REPO_URL .
    } catch {
        Write-ColorOutput "[ERROR] No se pudo clonar el repositorio. Verifica tu conexión a internet." "error"
        exit 1
    }
}

Write-ColorOutput "[OK] Directorio preparado: $INSTALL_DIR" "success"

# ==============================================================================
# INSTALAR DEPENDENCIAS
# ==============================================================================

Write-Title "INSTALANDO DEPENDENCIAS"

Write-ColorOutput "[INFO] Instalando dependencias base de npm..." "info"
try {
    npm install 2>&1 | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        Write-ColorOutput "[OK] Dependencias base instaladas" "success"
    } else {
        throw "npm install falló"
    }
} catch {
    Write-ColorOutput "[ERROR] Error al instalar dependencias base." "error"
    exit 1
}

Write-ColorOutput "[INFO] Instalando Electron y herramientas..." "info"
try {
    npm install $($ELECTRON_PACKAGES -join " ") --save-dev 2>&1 | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        Write-ColorOutput "[OK] Electron instalado correctamente" "success"
    } else {
        throw "npm install electron falló"
    }
} catch {
    Write-ColorOutput "[ERROR] Error al instalar Electron." "error"
    exit 1
}

# ==============================================================================
# REGISTRAR PROTOCOLO PERSONALIZADO
# ==============================================================================

Write-Title "REGISTRANDO PROTOCOLO PERSONALIZADO"

if ($isAdmin) {
    Write-ColorOutput "[INFO] Registrando protocolo $PROTOCOL_NAME:// en el sistema..." "info"
    
    try {
        # Crear directorio para el protocolo
        $protocolPath = "HKCU:\Software\Classes\$PROTOCOL_NAME"
        
        # Crear la clave del protocolo
        New-Item -Path $protocolPath -Force | Out-Null
        Set-ItemProperty -Path $protocolPath -Name "(Default)" -Value "URL:$PROTOCOL_NAME Protocol"
        Set-ItemProperty -Path $protocolPath -Name "URL Protocol" -Value ""
        
        # Crear subclave para ejecutar la aplicación
        $commandPath = "$protocolPath\shell\open\command"
        New-Item -Path $commandPath -Force | Out-Null
        
        # Obtener la ruta del ejecutable de Electron
        $electronExe = Join-Path $INSTALL_DIR "node_modules\electron\dist\electron.exe"
        $tpvMainPath = Join-Path $INSTALL_DIR "electron\tpv-main.js"
        
        if (Test-Path $electronExe) {
            Set-ItemProperty -Path $commandPath -Name "(Default)" -Value "`"$electronExe`" `"$tpvMainPath`" `"%1`""
            Write-ColorOutput "[OK] Protocolo registrado con Electron" "success"
        } else {
            # Usar npx como alternativa
            Set-ItemProperty -Path $commandPath -Name "(Default)" -Value "npx electron `"$tpvMainPath`" `"%1`""
            Write-ColorOutput "[OK] Protocolo registrado con npx" "success"
        }
        
        Write-ColorOutput "[OK] Protocolo $PROTOCOL_NAME:// registrado correctamente" "success"
        
    } catch {
        Write-ColorOutput "[WARNING] No se pudo registrar el protocolo automáticamente." "warning"
        Write-ColorOutput "[INFO] El protocolo se configurará cuando ejecutes la aplicación." "info"
    }
} else {
    Write-ColorOutput "[INFO] Registro de protocolo omitido (se necesita administrador)." "info"
}

# ==============================================================================
# CREAR ACCESOS DIRECTOS
# ==============================================================================

Write-Title "CREANDO ACCESOS DIRECTOS"

function Create-Shortcut {
    param(
        [string]$ShortcutPath,
        [string]$TargetPath,
        [string]$Arguments,
        [string]$Description,
        [string]$IconPath
    )
    
    try {
        $WshShell = New-Object -ComObject WScript.Shell
        $Shortcut = $WshShell.CreateShortcut($ShortcutPath)
        $Shortcut.TargetPath = $TargetPath
        $Shortcut.Arguments = $Arguments
        $Shortcut.Description = $Description
        if ($IconPath) {
            $Shortcut.IconLocation = $IconPath
        }
        $Shortcut.Save()
        return $true
    } catch {
        return $false
    }
}

$desktopPath = [Environment]::GetFolderPath("Desktop")
$startMenuPath = [Environment]::GetFolderPath("StartMenu")

# Acceso directo al Dashboard TPV
$shortcutPath = Join-Path $desktopPath "Club ViveVerde TPV.lnk"
$electronExe = Join-Path $INSTALL_DIR "node_modules\electron\dist\electron.exe"
$tpvMainPath = Join-Path $INSTALL_DIR "electron\tpv-main.js"

if (Test-Path $electronExe) {
    $success = Create-Shortcut -ShortcutPath $shortcutPath -TargetPath $electronExe -Arguments "`"$tpvMainPath`"" -Description "Club ViveVerde TPV - Terminal de Punto de Venta" -IconPath $electronExe
    
    if ($success) {
        Write-ColorOutput "[OK] Acceso directo creado en el escritorio" "success"
    } else {
        Write-ColorOutput "[WARNING] No se pudo crear el acceso directo en el escritorio" "warning"
    }
} else {
    # Crear acceso directo usando npx
    $shortcutPath = Join-Path $desktopPath "Club ViveVerde TPV.lnk"
    $success = Create-Shortcut -ShortcutPath $shortcutPath -TargetPath "cmd.exe" -Arguments "/c npx electron `"$tpvMainPath`"" -Description "Club ViveVerde TPV - Terminal de Punto de Venta"
    
    if ($success) {
        Write-ColorOutput "[OK] Acceso directo creado (usando npx)" "success"
    }
}

# ==============================================================================
# GENERAR ARCHIVO DE CONFIGURACIÓN
# ==============================================================================

Write-Title "CONFIGURACIÓN FINAL"

Write-ColorOutput "[INFO] Generando archivo de configuración..." "info"

$configContent = @"
# Configuración del cliente TPV
# Club ViveVerde

# URL del servidor
NEXT_PUBLIC_SITE_URL=https://clubviveverde.com
NEXT_PUBLIC_API_URL=https://clubviveverde.com

# Nombre de la aplicación
APP_NAME=Club ViveVerde TPV

# Puerto (no usado en cliente, pero necesario para consistencia)
PORT=3000

# Directorio de instalación
TPV_INSTALL_DIR=$INSTALL_DIR

# Protocolo personalizado
TPV_PROTOCOL=$PROTOCOL_NAME
"@

$configPath = Join-Path $INSTALL_DIR ".tpv-env"
Set-Content -Path $configPath -Value $configContent

Write-ColorOutput "[OK] Archivo de configuración generado" "success"

# ==============================================================================
# REGISTRAR PROTOCOLO EN SEGUNDO PLANO (para usuarios sin admin)
# ==============================================================================

# Crear script para registrar protocolo posteriormente
$registerProtocolScript = @"
# Registro diferido del protocolo
`$protocolPath = 'HKCU:\Software\Classes\$PROTOCOL_NAME'
New-Item -Path `$protocolPath -Force | Out-Null
Set-ItemProperty -Path `$protocolPath -Name '(Default)' -Value 'URL:$PROTOCOL_NAME Protocol'
Set-ItemProperty -Path `$protocolPath -Name 'URL Protocol' -Value ''

`$commandPath = "`$protocolPath\shell\open\command"
New-Item -Path `$commandPath -Force | Out-Null

`$electronExe = Join-Path '$INSTALL_DIR' 'node_modules\electron\dist\electron.exe'
`$tpvMainPath = Join-Path '$INSTALL_DIR' 'electron\tpv-main.js'

if (Test-Path `$electronExe) {
    Set-ItemProperty -Path `$commandPath -Name '(Default)' -Value "`"`$electronExe`" `"`$tpvMainPath`" `"%1`""
} else {
    Set-ItemProperty -Path `$commandPath -Name '(Default)' -Value 'npx electron `"`$tpvMainPath`" `"%1`"'
}
"@

$deferredScriptPath = Join-Path $INSTALL_DIR "register-protocol.ps1"
Set-Content -Path $deferredScriptPath -Value $registerProtocolScript

# ==============================================================================
# RESUMEN FINAL
# ==============================================================================

Write-Title "INSTALACIÓN COMPLETADA"

Write-ColorOutput "================================================" "success"
Write-ColorOutput "  INSTALACIÓN EXITOSA" "success"
Write-ColorOutput "================================================" "success"

Write-ColorOutput "`nPara iniciar el TPV, ejecuta:" "info"
Write-ColorOutput "  1. Doble clic en 'Club ViveVerde TPV' en el escritorio" "info"
Write-ColorOutput "  2. O ejecuta: npm run electron:start`n" "info"

Write-ColorOutput "Para registrar el protocolo personalizado (requiere reiniciar):" "warning"
Write-ColorOutput "  1. Cierra todas las ventanas del navegador" "info"
Write-ColorOutput "  2. Ejecuta el script: register-protocol.ps1`n" "info"

Write-ColorOutput "El protocolo $PROTOCOL_NAME:// se activará cuando:" "info"
Write-ColorOutput "  - Inicies sesión como cajero en clubviveverde.com" "info"
Write-ColorOutput "  - El navegador intentará abrir la aplicación TPV automáticamente`n" "info"

Write-ColorOutput "Archivos instalados en: $INSTALL_DIR" "info"
Write-ColorOutput "Acceso directo en: $shortcutPath`n" "info"

# Mantener ventana abierta para que el usuario pueda ver el resultado
Write-Host "`nPresiona cualquier tecla para cerrar..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")