# Instalador Automático TPV - Club ViveVerde

## Descripción

Este instalador permite a los cajeros configurar el sistema TPV de forma automática sin necesidad de conocimientos informáticos. Detecta si Electron está instalado y lo instala automáticamente cuando es necesario.

## Características

- **Detección automática**: Verifica si Electron y sus dependencias están instalados
- **Instalación con un clic**: El cajero solo tiene que hacer clic en "Instalar automáticamente"
- **Interfaz visual**: Muestra el progreso de la instalación con barra de porcentaje
- **Manejo de errores**: Proporciona mensajes claros en caso de problemas
- **Sin conocimientos necesarios**: El cajero no tiene que usar la terminal
- **Auto-actualización**: El sistema se actualiza automáticamente desde el servidor de producción
- **Apertura automática**: Después del login, la aplicación TPV se abre automáticamente si está instalada

## Sistema de Auto-Apertura after Login

Cuando un cajero con rol TPV inicia sesión, el sistema verifica automáticamente si la aplicación Electron está instalada y la abre:

```
┌─────────────────────────────────────────────────────┐
│              FLUJO DE APERTURA AUTOMÁTICA           │
│                                                     │
│  1. Cajero inicia sesión con rol "cajero" TPV       │
│                                                     │
│  2. AuthContext detecta cajero_version = 'tpv'      │
│                                                     │
│  3. Verificar estado de instalación via API         │
│     GET /api/tpv/setup?action=status                │
│                                                     │
│  4. Si Electron instalado:                           │
│     → Abrir clubviveverde://open/dashboard          │
│     → La aplicación Electron se ejecuta              │
│                                                     │
│  5. Si Electron NO instalado:                       │
│     → Redirigir a /tpv                              │
│     → Mostrar pantalla de configuración            │
│     → Cajero hace clic en "Instalar"                │
│     → npm install → Ejecutar Electron               │
└─────────────────────────────────────────────────────┘
```

### Protocolo Personalizado clubviveverde://

La aplicación Electron registra el protocolo `clubviveverde://` en el sistema operativo, permitiendo que el navegador abra la aplicación de escritorio:

| Comando | Descripción |
|---------|-------------|
| `clubviveverde://status` | Devuelve información de la aplicación |
| `clubviveverde://open/dashboard` | Abre el dashboard completo |
| `clubviveverde://open/search` | Abre la ventana de búsqueda flotante |
| `clubviveverde://open/users` | Abre la ventana de gestión de usuarios |
| `clubviveverde://open/all` | Abre todas las ventanas |
| `clubviveverde://install` | Muestra instrucciones de instalación |

### Comportamiento after Login

1. **Si Electron está instalado**: La aplicación de escritorio se abre automáticamente
2. **Si Electron no está instalado**: Se muestra la pantalla de configuración TPV
3. **Después de instalar**: La aplicación se abre automáticamente

## Sistema de Auto-Actualización

Las cajas TPV se actualizan automáticamente consultando al servidor de producción:

```
┌─────────────────────────────────────────────────────┐
│                    CAJA TPV                         │
│                                                     │
│  1. Al iniciar: GET /api/version                    │
│     al servidor (NEXT_PUBLIC_SITE_URL)               │
│                                                     │
│  2. Compara versión local vs servidor               │
│                                                     │
│  3. Si hay nueva versión:                           │
│     - Mostrar notificación al cajero                │
│     - git pull origin main (local)                  │
│     - npm install (local)                           │
│     - Reiniciar aplicación                          │
└─────────────────────────────────────────────────────┘
```

### Comportamiento de las actualizaciones

- **Al iniciar**: El sistema verifica automáticamente si hay nueva versión
- **Durante la jornada**: No hace consultas mientras la cajera trabaja
- **Verificación manual**: Menú → Club ViveVerde → Buscar actualizaciones (Ctrl+Shift+U)

### Configuración del servidor

El servidor de producción debe tener estas variables en su `.env`:

```bash
# URL pública del sitio (usada por las cajas para actualizar)
NEXT_PUBLIC_SITE_URL=https://clubviveverde.com

# URL de la API (opcional, fallback)
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### Las cajas NO necesitan archivo .env

Las cajas TPV se conectan al servidor de producción automáticamente usando las variables de entorno del servidor. No necesitan configuración local adicional.

### Verificación de actualizaciones

El sistema verifica actualizaciones al iniciar la aplicación. También puedes verificar manualmente desde el menú de la aplicación: **Club ViveVerde → Buscar actualizaciones** (Ctrl+Shift+U).

## Uso

### Opción 1: Login automático (Recomendado)

1. El cajero accede a https://clubviveverde.com/login
2. Ingresa sus credenciales (usuario cajero con versión TPV)
3. **Si Electron está instalado**: La aplicación de escritorio se abre automáticamente
4. **Si Electron NO está instalado**: Se muestra la pantalla de configuración
5. El cajero hace clic en "Instalar automáticamente"
6. La instalación se completa y el TPV se carga automáticamente

### Opción 2: Script automático

```bash
# En el directorio del proyecto
node scripts/tpv-auto-setup.js
```

### Opción 3: Instalador interactivo

```bash
# En el directorio del proyecto
node tpv-installer/install.js
```

## Requisitos del sistema

- Node.js 18 o superior
- npm 8 o superior
- Conexión a internet
- Sistema operativo: Windows, Linux o macOS

## Archivos creados

- `scripts/tpv-auto-setup.js` - Script de auto-instalación
- `tpv-installer/install.js` - Instalador interactivo
- `tpv-installer/package.json` - Configuración del instalador
- `pages/api/tpv/setup.ts` - API para verificar/instalar Electron
- `components/Teller/TPVSetup.tsx` - Componente de interfaz
- `pages/tpv.tsx` - Página TPV actualizada
- `electron/tpv-main.js` - Proceso principal con protocolo personalizado

## Flujo de instalación

```
┌─────────────────┐
│ Cajero inicia   │
│ sesión          │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ ¿cajero_version │
│ === 'tpv'?     │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌───────┐ ┌─────────┐
│ SÍ    │ │ NO      │
└───┬───┘ └────┬────┘
    │          │
    ▼          ▼
┌─────────────────┐
│ Verificar si    │
│ Electron está   │
│ instalado       │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌────────┐ ┌─────────────┐
│ Instalado│ NO instalado│
└───┬────┘ └──────┬──────┘
    │              │
    ▼              ▼
┌────────────┐ ┌───────────────────┐
│ Abrir via   │ │ Mostrar pantalla │
│ protocolo   │ │ de configuración │
│ clubviveverde│ └────────┬─────────┘
│ ://         │          │
└────────────┘          ▼
               ┌───────────────────┐
               │ Cajero hace clic  │
               │ "Instalar"       │
               └────────┬─────────┘
                        │
                        ▼
              ┌───────────────────┐
              │ Instalación      │
              │ automática        │
              └────────┬─────────┘
                        │
                        ▼
              ┌───────────────────┐
              │ Abrir Electron   │
              │ automáticamente  │
              └───────────────────┘
```

## Solución de problemas

### El protocolo clubviveverde:// no funciona

**Windows**: Puede que necesites ejecutar la aplicación como administrador la primera vez para registrar el protocolo.

**Linux/macOS**: Verificar que el archivo .desktop está correctamente configurado en ~/.local/share/applications/

### Error: "Node.js no encontrado"

**Solución**: Instalar Node.js desde https://nodejs.org

### Error: "npm no encontrado"

**Solución**: Reinstalar Node.js (incluye npm)

### Error: "Electron no se instala"

**Solución**: Verificar conexión a internet y ejecutar:
```bash
npm install
npm install electron@^28.1.0 electron-builder@^24.9.1 electron-log@^5.0.3 --save-dev
```

### Error: "Permiso denegado"

**Solución**: Ejecutar el terminal como administrador (Windows) o usar sudo (Linux/macOS)

### La aplicación no se abre automáticamente

1. Verificar que el usuario tiene `cajero_version = 'tpv'` en la base de datos
2. Verificar que Electron está instalado ejecutando `npx electron --version`
3. Verificar que el protocolo está registrado ejecutando la aplicación una vez manualmente

## Soporte

Para problemas técnicos, contacta con el administrador del sistema.