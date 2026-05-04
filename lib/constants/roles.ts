/**
 * Constantes de Roles de la Aplicación Club ViveVerde
 * 
 * Este archivo centraliza todas las definiciones de roles de usuario.
 * IMPORTANTE: Mantener sincronizado con los roles definidos en la base de datos.
 * 
 * @author Club ViveVerde
 * @version 1.0.0
 */

// ============================================
// ROLES DISPONIBLES
// ============================================

export const ROLES = {
  ADMINISTRADOR: 'administrador',
  ADMIN: 'admin',
  CAJERO: 'cajero',
  MARKETING: 'marketing',
  USUARIO: 'usuario',
} as const;

// Tipo para roles
export type RoleType = typeof ROLES[keyof typeof ROLES];

// ============================================
// GRUPOS DE ROLES POR PERMISOS
// ============================================

// Roles que tienen permisos de administrador
export const ADMIN_ROLES: RoleType[] = [
  ROLES.ADMINISTRADOR,
  ROLES.ADMIN,
];

// Roles que pueden acceder al panel de cajero
export const TELLER_ROLES: RoleType[] = [
  ROLES.ADMINISTRADOR,
  ROLES.ADMIN,
  ROLES.CAJERO,
];

// Roles que pueden acceder al panel de marketing
export const MARKETING_ROLES: RoleType[] = [
  ROLES.ADMINISTRADOR,
  ROLES.ADMIN,
  ROLES.MARKETING,
];

// ============================================
// HELPERS DE ROLES
// ============================================

/**
 * Verifica si un rol es de administrador
 */
export function isAdminRole(role: string | null | undefined): boolean {
  if (!role) return false;
  return ADMIN_ROLES.includes(role as RoleType);
}

/**
 * Verifica si un rol puede acceder al panel de cajero
 */
export function canAccessTellerPanel(role: string | null | undefined): boolean {
  if (!role) return false;
  return TELLER_ROLES.includes(role as RoleType);
}

/**
 * Verifica si un rol puede acceder al panel de marketing
 */
export function canAccessMarketingPanel(role: string | null | undefined): boolean {
  if (!role) return false;
  return MARKETING_ROLES.includes(role as RoleType);
}

/**
 * Verifica si un rol es válido
 */
export function isValidRole(role: string): boolean {
  return Object.values(ROLES).includes(role as RoleType);
}

/**
 * Obtiene el nombre legible de un rol
 */
export function getRoleDisplayName(role: string): string {
  const roleNames: Record<string, string> = {
    [ROLES.ADMINISTRADOR]: 'Administrador',
    [ROLES.ADMIN]: 'Admin',
    [ROLES.CAJERO]: 'Cajero',
    [ROLES.MARKETING]: 'Marketing',
    [ROLES.USUARIO]: 'Usuario',
  };
  return roleNames[role] || role;
}

// ============================================
// OPCIONES PARA SELECTS
// ============================================

export const ROLE_OPTIONS = [
  { value: '', label: 'Todos los roles' },
  { value: ROLES.ADMINISTRADOR, label: 'Administrador' },
  { value: ROLES.ADMIN, label: 'Admin' },
  { value: ROLES.CAJERO, label: 'Cajero' },
  { value: ROLES.MARKETING, label: 'Marketing' },
  { value: ROLES.USUARIO, label: 'Usuario' },
] as const;

// ============================================
// ROLES PARA SUPERADMIN (futuro)
// ============================================

// Roles que pueden gestionar otros usuarios
export const USER_MANAGER_ROLES: RoleType[] = [
  ROLES.ADMINISTRADOR,
  ROLES.ADMIN,
];

// Roles que pueden ver logs del sistema
export const LOG_VIEWER_ROLES: RoleType[] = [
  ROLES.ADMINISTRADOR,
  ROLES.ADMIN,
  ROLES.CAJERO,
];

// Roles que pueden hacer copias de seguridad
export const BACKUP_MANAGER_ROLES: RoleType[] = [
  ROLES.ADMINISTRADOR,
  ROLES.ADMIN,
];