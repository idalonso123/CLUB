# Resumen de Implementación - Sistema TPV Electron Standalone

## Estado del Proyecto

Este documento resume el trabajo realizado para implementar las aplicaciones Electron Standalone del sistema TPV de Club ViveVerde.

---

## Funcionalidades Implementadas

### 1. Aplicación Electron Standalone - Ventana de Búsqueda (SearchForm)

**Archivo:** `electron/tpv-search.js`

**Características:**
- Ventana flotante pequeña y compacta (500x150 píxeles inicial)
- Siempre visible sobre el ERP (`alwaysOnTop: true`)
- Sin bordes de ventana para integración perfecta
- Campo de búsqueda con autocompletado
- Posición inicial en esquina superior derecha
- Compatible con arrastrar la ventana

**Página Next.js:** `pages/tpv-search.tsx`

---

### 2. Aplicación Electron Standalone - Ventana de Usuarios (UsersTable)

**Archivo:** `electron/tpv-users.js`

**Características:**
- Ventana flotante para gestión de usuarios
- Siempre visible sobre el ERP (`alwaysOnTop: true`)
- Tabla completa con todos los usuarios
- Acciones rápidas: Añadir saldo, Ver recompensas, Gestionar carnets
- Comunicación IPC con otras ventanas
- Centrada automáticamente al abrirse

**Página Next.js:** `pages/tpv-users.tsx`

---

### 3. Dashboard TPV Principal

**Archivo:** `electron/tpv-main.js`

**Características:**
- Panel completo del sistema TPV
- Menú de aplicación con atajos de teclado
- Icono en la bandeja del sistema (System Tray)
- Acceso rápido a ventanas de búsqueda y usuarios
- Gestión centralizada de todas las ventanas

---

### 4. Búsqueda Automática con Enter

**Ubicación:** `components/Teller/dashboard.tsx` (líneas 102-122)

**Funcionamiento:**
- Cuando hay exactamente 1 resultado de búsqueda
- El cajero presiona la tecla Enter
- Se abre automáticamente el AddBalanceModal
- Incluye protección contra múltiples ejecuciones (debounce de 1 segundo)

**Código relevante:**
```typescript
const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Enter' && results.length === 1 && !isModalOpen) {
    const now = Date.now();
    if (now - lastEnterPressRef.current < 1000) {
      return;
    }
    lastEnterPressRef.current = now;
    handleSelectUser(results[0]);
  }
};
```

---

### 5. Foco Automático en Campo "Importe gastado (€)"

**Ubicación:** `components/Teller/TellerComponents/AddBalanceForm.tsx` (líneas 42-53)

**Funcionamiento:**
- Cuando se abre el AddBalanceModal con `autoFocusAmount={true}`
- El cursor se coloca automáticamente en el campo de importe
- Se selecciona todo el texto para facilitar la escritura
- Pequeño delay de 100ms para asegurar que el modal está renderizado

**Código relevante:**
```typescript
useEffect(() => {
  if (autoFocus && amountInputRef.current) {
    const timer = setTimeout(() => {
      if (amountInputRef.current) {
        amountInputRef.current.focus();
        amountInputRef.current.select();
      }
    }, 100);
    return () => clearTimeout(timer);
  }
}, [autoFocus]);
```

---

## Archivos Creados

### Procesos de Electron

| Archivo | Descripción |
|---------|-------------|
| `electron/tpv-main.js` | Proceso principal - Dashboard TPV completo |
| `electron/tpv-search.js` | Ventana de búsqueda rápida standalone |
| `electron/tpv-users.js` | Ventana de gestión de usuarios standalone |
| `electron/preload.js` | Script de precarga principal |
| `electron/preload-search.js` | Script de precarga para búsqueda |
| `electron/preload-users.js` | Script de precarga para usuarios |

### Páginas Next.js

| Archivo | Descripción |
|---------|-------------|
| `pages/tpv-search.tsx` | Página standalone de búsqueda |
| `pages/tpv-users.tsx` | Página standalone de usuarios |

### API

| Archivo | Descripción |
|---------|-------------|
| `pages/api/cajero/users.ts` | Endpoint para obtener todos los usuarios |

### Configuración

| Archivo | Descripción |
|---------|-------------|
| `electron-package.json` | Configuración de npm para Electron |
| `types/electron.d.ts` | Definiciones de tipos para Electron API |
| `electron/README.md` | Documentación completa |

---

## Funcionalidades Pre-existentes (Ya implementadas)

Las siguientes funcionalidades ya estaban implementadas antes de este trabajo:

1. **Selector de versión cajero** (web/tpv) en gestión de usuarios
2. **Campo `cajero_version`** en la tabla personas
3. **Página `/tpv.tsx`** con validación de acceso para cajeros TPV
4. **Dashboard con modo TPV** (`isTPV={true}`)
5. **Limpieza automática** de búsqueda después de cada transacción en modo TPV

---

## Instrucciones de Instalación y Uso

### 1. Instalar dependencias de Electron

```bash
cd CLUB
npm install electron@^28.1.0 electron-builder@^24.9.1 electron-log@^5.0.3 --save-dev
```

### 2. Asegurarse de que el servidor Next.js esté ejecutándose

```bash
npm run dev
```

### 3. Ejecutar las aplicaciones Electron

```bash
# Dashboard TPV completo
npm start

# Ventana de búsqueda
npm run start:tpv-search

# Ventana de usuarios
npm run start:tpv-users
```

---

## Construcción de Aplicaciones de Escritorio

### Windows

```bash
npm run build:win
```

### Linux

```bash
npm run build:linux
```

### macOS

```bash
npm run build:mac
```

Los archivos generados estarán en el directorio `dist-electron/`.

---

## Flujo de Trabajo Recomendado

1. **Inicio del día:**
   - Ejecutar `npm run dev` para iniciar el servidor Next.js
   - Ejecutar `npm start` para abrir el Dashboard TPV principal

2. **Durante el trabajo:**
   - Usar la ventana de búsqueda rápida para buscar clientes
   - Presionar Enter cuando haya un único resultado
   - El campo "Importe gastado" se enfocará automáticamente
   - Escribir el importe y procesar la transacción

3. **Acceso rápido:**
   - Usar atajos de teclado (Ctrl+B para búsqueda, Ctrl+U para usuarios)
   - Acceder desde el System Tray haciendo clic en el icono

---

## Notas Técnicas

### Seguridad

- `nodeIntegration: false` - Previene acceso directo a Node.js desde el renderer
- `contextIsolation: true` - Aísla el contexto de cada ventana
- Los scripts de precarga exponen APIs seguras mediante `contextBridge`

### Rendimiento

- Las ventanas de búsqueda son muy ligeras (~150px de altura)
- El debounce de 300ms en búsquedas evita llamadas excesivas a la API
- El debounce de 1 segundo en Enter previene ejecuciones múltiples

### Compatibilidad

- Funciona en Windows, Linux y macOS
- Los iconos deben estar en `public/icons/`
- Requiere Node.js 18+ y Electron 28+

---

## Próximos Pasos (Opcionales)

1. **Personalización de iconos:** Añadir iconos específicos para cada ventana
2. **Configuración de usuario:** Permitir guardar preferencias de posición y tamaño
3. **Notificaciones:** Implementar notificaciones de escritorio para transacciones
4. **Atajos de teclado globales:** Configurar atajos que funcionen incluso sin foco
5. **Instalador:** Crear instaladores MSI/DEB para distribución

---

## Soporte

Para cualquier problema o duda sobre la implementación, revisa:
- `electron/README.md` - Documentación detallada
- Logs de Electron en la consola
- Logs del servidor Next.js

---

**Fecha de implementación:** Mayo 2024  
**Versión del sistema:** 1.0.0
