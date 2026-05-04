# Instalación de Aplicaciones TPV en Cajas (PCs de Cajeros)

Este documento explica cómo instalar las aplicaciones Electron TPV en cada caja registradora.

## Requisitos

- PC con sistema operativo Windows, Linux o macOS
- Conexión a internet para descargar e instalar dependencias
- Acceso al servidor de Club ViveVerde (el sistema se conecta automáticamente)

## Instalación en el PC de la Caja

### 1. Clonar o descargar el repositorio

```bash
git clone https://github.com/idalonso123/CLUB.git
cd CLUB
```

O si ya tienes el código:

```bash
cd CLUB
git pull origin main
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Instalar Electron (solo para las cajas)

```bash
npm install electron@^28.1.0 electron-builder@^24.9.1 electron-log@^5.0.3 --save-dev
```

### 4. Configuración automática

El sistema está diseñado para funcionar sin configuración manual:
- La URL del servidor se obtiene automáticamente de las variables de entorno
- No necesita archivo `.env` local en las cajas
- El sistema de auto-actualización consulta al servidor de producción

Si necesitas personalizar la URL del servidor, puedes crear un archivo `.env.local`:

```bash
# Archivo: .env.local (opcional, solo si el servidor tiene IP diferente)
NEXT_PUBLIC_SITE_URL=https://clubviveverde.com
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## Ejecución de las aplicaciones

### Opción A: Ventana de Búsqueda Rápida (Recomendado)

Esta es la ventana flotante más pequeña y práctica:

```bash
npm run electron:search
```

**Características:**
- Ventana compacta (500x150 píxeles)
- Solo campo de búsqueda
- Siempre visible sobre otras aplicaciones
- Sin bordes de ventana

### Opción B: Ventana de Gestión de Usuarios

Para ver todos los usuarios y gestionar carnets:

```bash
npm run electron:users
```

**Características:**
- Ventana más grande (900x600 píxeles)
- Tabla con todos los clientes
- Acciones: Añadir saldo, Ver recompensas, Carnets de mascota

### Opción C: Dashboard TPV Completo

Panel completo con todas las funcionalidades:

```bash
npm run electron:start
```

## Scripts disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run electron:search` | Ventana de búsqueda rápida |
| `npm run electron:users` | Ventana de gestión de usuarios |
| `npm run electron:start` | Dashboard TPV completo |
| `npm run electron:build` | Crear ejecutable instalable |
| `npm run electron:build:win` | Crear instalador para Windows |
| `npm run electron:build:linux` | Crear instalador para Linux |
| `npm run electron:build:mac` | Crear instalador para macOS |

## Crear instalador portable

Si quieres distribuir las aplicaciones sin que cada caja tenga que instalar Node.js:

```bash
# Para Windows
npm run electron:build:win

# Para Linux
npm run electron:build:linux

# Para macOS
npm run electron:build:mac
```

Los archivos generados estarán en la carpeta `dist-electron/`.

## Solución de problemas

### Error: "electron not found"

Asegúrate de haber instalado Electron:

```bash
npm install electron@^28.1.0 electron-builder@^24.9.1 electron-log@^5.0.3 --save-dev
```

### Problemas de conexión con el servidor

El sistema se conecta automáticamente al servidor de producción. Si hay problemas:

1. Verifica que el servidor de producción esté accesible desde la caja
2. Comprueba que el dominio `clubviveverde.com` resuelva correctamente

### El sistema de auto-actualización no funciona

El actualizador verifica la versión al iniciar la aplicación. Si necesitas forzar una verificación manual:

1. Ve al menú **Club ViveVerde** → **Buscar actualizaciones**
2. O usa el atajo de teclado: **Ctrl+Shift+U**

El sistema consultará al servidor de producción y te通知á si hay alguna actualización disponible.

### Ventanas no se ven

Electron requiere un escritorio gráfico. Asegúrate de estar en un entorno con pantalla.

## Instalación automática con script

Crea un archivo `install-tpv.sh` en el PC de la caja:

```bash
#!/bin/bash
echo "Instalando TPV Club ViveVerde..."

# Clonar o actualizar repositorio
if [ -d "CLUB" ]; then
  cd CLUB
  git pull origin main
else
  git clone https://github.com/idalonso123/CLUB.git
  cd CLUB
fi

# Instalar dependencias
npm install

# Instalar Electron
npm install electron@^28.1.0 electron-builder@^24.9.1 electron-log@^5.0.3 --save-dev

echo "Instalación completada."
echo "Ejecuta 'npm run electron:search' para abrir la ventana de búsqueda."
```

```bash
chmod +x install-tpv.sh
./install-tpv.sh
```

## Notas importantes

1. **El servidor NO necesita Electron** - Solo sirve la aplicación web
2. **Cada caja instala Electron localmente** - No afecta al servidor
3. **Las ventanas son independientes** - Se pueden mover, redimensionar y colocar sobre el ERP
4. **Requieren escritorio** - No funcionan en servidores sin pantalla

## Soporte

Para problemas técnicos, consulta la documentación en `electron/README.md` o contacta con el administrador del sistema.
