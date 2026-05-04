# Club ViveVerde TPV - Aplicaciones Electron Standalone

Este directorio contiene las aplicaciones Electron Standalone para el sistema TPV de Club ViveVerde. Estas aplicaciones permiten a los cajeros acceder a funcionalidades específicas del sistema desde ventanas flotantes independientes.

## Estructura del Proyecto

```
electron/
├── tpv-main.js          # Proceso principal - Dashboard TPV completo
├── tpv-search.js        # Ventana de búsqueda rápida (SearchForm)
├── tpv-users.js         # Ventana de gestión de usuarios (UsersTable)
├── preload.js           # Script de precarga para comunicación segura
├── preload-search.js    # Script de precarga para ventana de búsqueda
└── preload-users.js    # Script de precarga para ventana de usuarios
```

## Instalación

### 1. Instalar dependencias de Electron

```bash
cd CLUB
npm install electron@^28.1.0 electron-builder@^24.9.1 electron-log@^5.0.3 --save-dev
```

### 2. Configurar package.json

El archivo `electron-package.json` contiene la configuración de build. Puedes copiar las secciones `scripts` y `build` a tu `package.json` principal:

```bash
# O ejecutar desde electron-package.json
npm install --include=dev -f electron-package.json
```

## Ejecución

### Modo Desarrollo

```bash
# Abrir el Dashboard TPV completo
npm start

# Abrir solo la ventana de búsqueda
npm run start:tpv-search

# Abrir solo la ventana de usuarios
npm run start:tpv-users
```

### Argumentos de línea de comandos

```bash
# Ventana principal (Dashboard)
electron electron/tpv-main.js --main

# Ventana de búsqueda
electron electron/tpv-search.js --search

# Ventana de usuarios
electron electron/tpv-users.js --users
```

## Construcción de aplicaciones

### Construir para Windows

```bash
npm run build:win
```

### Construir para Linux

```bash
npm run build:linux
```

### Construir para macOS

```bash
npm run build:mac
```

## Características de las aplicaciones

### 1. Ventana de Búsqueda (SearchForm Standalone)

- **Ventana pequeña y compacta**: Solo muestra el campo de búsqueda
- **Siempre visible**: Se mantiene sobre otras ventanas (alwaysOnTop)
- **Sin bordes**: Integración perfecta con el ERP
- **Búsqueda automática**: Cuando hay un único resultado, presiona Enter para abrir AddBalanceModal
- **Foco automático**: El cursor se coloca automáticamente en el campo "Importe gastado (€)"

### 2. Ventana de Usuarios (UsersTable Standalone)

- **Ventana flotante**: Se mantiene visible sobre el ERP
- **Tabla completa**: Muestra todos los usuarios con sus datos
- **Acciones rápidas**: Añadir saldo, ver recompensas, gestionar carnets de mascota
- **Comunicación IPC**: Puede recibir usuarios seleccionados desde otras ventanas

### 3. Dashboard TPV Principal

- **Panel completo**: Todas las funcionalidades del sistema TPV
- **Menú de aplicación**: Acceso rápido a todas las ventanas
- **System Tray**: Icono en la bandeja del sistema para acceso rápido

## Integración con Next.js

Las páginas de Electron Standalone están en:

- `pages/tpv-search.tsx` - Página de búsqueda standalone
- `pages/tpv-users.tsx` - Página de usuarios standalone

Estas páginas están diseñadas para ejecutarse dentro de Electron y comunicarse con el proceso principal.

## API expuesta al renderer

El script de precarga (`preload.js`) expone las siguientes funciones:

```typescript
interface ElectronAPI {
  // Funciones de ventana
  minimizeWindow(): void;
  closeWindow(): void;
  toggleAlwaysOnTop(): boolean;
  
  // Abrir ventanas
  openUsersWindow(): void;
  openSearchWindow(): void;
  
  // Seleccionar usuario
  selectUser(user: TPVUser): void;
  
  // Escuchar eventos
  onUserSelected(callback: (user: TPVUser) => void): void;
  onUserSelectedFromSearch(callback: (user: TPVUser) => void): void;
  onUserAction(callback: (data: any) => void): void;
}
```

## Configuración del servidor

Asegúrate de que el servidor Next.js esté ejecutándose antes de abrir las aplicaciones Electron:

```bash
# En una terminal
npm run dev

# En otra terminal, ejecutar Electron
npm start
```

## Solución de problemas

### La ventana no se carga

1. Verifica que el servidor Next.js esté ejecutándose en el puerto 3000
2. Verifica que la URL en los archivos `tpv-*.js` sea correcta
3. Revisa los logs de Electron en la consola

### Error de nodeIntegration

Asegúrate de que `nodeIntegration` esté configurado como `false` y `contextIsolation` como `true` en las opciones de webPreferences.

### Iconos no visibles

Verifica que los iconos existan en `public/icons/` y que la ruta sea correcta.

## Licencia

© 2024 Club ViveVerde
