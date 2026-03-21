/**
 * Utilidades para gestión de páginas y textos dinámicos
 * 
 * Este archivo proporciona funciones helper para generar textos dinámicos
 * que dependen de la configuración de la empresa.
 * 
 * @author Club ViveVerde
 * @version 1.0.0
 */

import { SITE_CONFIG, COMPANY_CONFIG } from '@/lib/config';

/**
 * Genera el título de una página con el sufijo configurado
 */
export function generatePageTitle(pageTitle: string): string {
  return `${pageTitle} - ${SITE_CONFIG.seo.titleSuffix}`;
}

/**
 * Genera el título de una página con el sufijo (alternativa)
 */
export function pageTitle(pageTitle: string): string {
  return `${pageTitle} | ${SITE_CONFIG.seo.titleSuffix}`;
}

/**
 * Genera la descripción meta para una página
 */
export function metaDescription(description: string): string {
  return description;
}

/**
 * Genera el texto de welcome dinámico
 */
export function welcomeText(): string {
  return `Bienvenido a ${COMPANY_CONFIG.name}`;
}

/**
 * Genera el texto de registro
 */
export function registerTitle(): string {
  return `Únete a ${COMPANY_CONFIG.name}`;
}

/**
 * Genera el texto de login
 */
export function loginTitle(): string {
  return `Bienvenido de vuelta a ${COMPANY_CONFIG.shortName}`;
}

/**
 * Genera el subtítulo de login
 */
export function loginSubtitle(): string {
  return `Inicia sesión para acceder a tu cuenta de ${COMPANY_CONFIG.name}`;
}

/**
 * Genera el subtítulo de registro
 */
export function registerSubtitle(): string {
  return `Regístrate para comenzar tu experiencia eco-friendly con ${COMPANY_CONFIG.name}`;
}

/**
 * Genera el texto de recuperación de contraseña
 */
export function resetPasswordTitle(): string {
  return `Restablecer Contraseña - ${COMPANY_CONFIG.name}`;
}

/**
 * Genera el título del panel de administración
 */
export function adminPanelTitle(): string {
  return `Panel de Administración - ${COMPANY_CONFIG.name}`;
}

/**
 * Genera el título de recompensas
 */
export function rewardsTitle(): string {
  return `Recompensas - ${COMPANY_CONFIG.name}`;
}

/**
 * Genera el título del cajero
 */
export function tellerTitle(): string {
  return `Cajero - ${COMPANY_CONFIG.name}`;
}

/**
 * Genera el texto de copyright
 */
export function copyrightText(year: number = new Date().getFullYear()): string {
  return `© ${year} ${COMPANY_CONFIG.name}. Todos los derechos reservados.`;
}

/**
 * Genera la URL completa del sitio
 */
export function getFullUrl(path: string = ''): string {
  return `${SITE_CONFIG.url}${path}`;
}

/**
 * Genera el texto de términos y condiciones
 */
export function termsAndConditionsTitle(): string {
  return `Términos y Condiciones - ${COMPANY_CONFIG.name}`;
}

/**
 * Genera el texto de política de privacidad
 */
export function privacyPolicyTitle(): string {
  return `Política de Privacidad - ${COMPANY_CONFIG.name}`;
}

/**
 * Genera el texto de términos de uso de tarjeta
 */
export function termsUsageTitle(): string {
  return `Términos y Condiciones de Uso – Tarjeta ${COMPANY_CONFIG.name}`;
}

/**
 * Obtiene la URL de términos
 */
export function getTermsUrl(): string {
  return SITE_CONFIG.external.termsAndConditions;
}

/**
 * Obtiene la URL de privacidad
 */
export function getPrivacyUrl(): string {
  return SITE_CONFIG.external.privacyPolicy;
}

/**
 * Obtiene la URL de términos de uso
 */
export function getTermsUsageUrl(): string {
  return SITE_CONFIG.external.termsAndConditionsUsage;
}

/**
 * Obtiene el email de contacto
 */
export function getContactEmail(): string {
  return COMPANY_CONFIG.email.primary;
}

/**
 * Obtiene el nombre de la empresa para display
 */
export function getCompanyName(): string {
  return COMPANY_CONFIG.name;
}

/**
 * Obtiene el nombre corto de la empresa
 */
export function getCompanyShortName(): string {
  return COMPANY_CONFIG.shortName;
}

/**
 * Obtiene el nombre de la marca
 */
export function getBrandName(): string {
  return COMPANY_CONFIG.brandName;
}

// Export default with all functions
const pageUtils = {
  generatePageTitle,
  pageTitle,
  metaDescription,
  welcomeText,
  registerTitle,
  loginTitle,
  loginSubtitle,
  registerSubtitle,
  resetPasswordTitle,
  adminPanelTitle,
  rewardsTitle,
  tellerTitle,
  copyrightText,
  getFullUrl,
  termsAndConditionsTitle,
  privacyPolicyTitle,
  termsUsageTitle,
  getTermsUrl,
  getPrivacyUrl,
  getTermsUsageUrl,
  getContactEmail,
  getCompanyName,
  getCompanyShortName,
  getBrandName,
};

export default pageUtils;
