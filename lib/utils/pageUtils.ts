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
  return `Términos y Condiciones de Uso – ${COMPANY_CONFIG.name}`;
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


/**
 * Utilidades para validación y procesamiento de URLs de imágenes externas
 * Permite usar imágenes de Google Drive y otros servicios externos
 */

/**
 * Lista de dominios permitidos para imágenes externas
 */
export const ALLOWED_IMAGE_DOMAINS = [
  // Google Drive / Google Photos
  'drive.google.com',
  'lh3.googleusercontent.com',
  'lh4.googleusercontent.com',
  'lh5.googleusercontent.com',
  'lh6.googleusercontent.com',
  'photos.google.com',
  'plus.google.com',
  // Dominios googleusercontent.com dinámicos
  'googleusercontent.com',
  // Otros servicios de hosting de imágenes
  'images.unsplash.com',
  'picsum.photos',
  'imgbb.com',
  'ibb.co',
  'i.postimg.cc',
  'postimg.cc',
  'cdn.jsdelivr.net',
  // Amazon S3
  'amazonaws.com',
  's3.amazonaws.com',
  // Imgur
  'imgur.com',
  'i.imgur.com',
];

/**
 * Verifica si una URL es de un dominio permitido
 */
export function isAllowedImageUrl(url: string): boolean {
  if (!url) return false;
  
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    
    // Verificar si el hostname es exactamente uno de los permitidos
    if (ALLOWED_IMAGE_DOMAINS.includes(hostname)) {
      return true;
    }
    
    // Verificar si termina con uno de los dominios permitidos (para subdominios)
    // Por ejemplo: abcdefgh-ijklmnopqrstuvwxyz123456.chromium.googleusercontent.com
    for (const domain of ALLOWED_IMAGE_DOMAINS) {
      if (domain.startsWith('*.')) {
        const baseDomain = domain.slice(2);
        if (hostname.endsWith(baseDomain) || hostname === baseDomain.slice(1)) {
          return true;
        }
      } else if (hostname.endsWith('.' + domain)) {
        return true;
      }
    }
    
    return false;
  } catch {
    return false;
  }
}

/**
 * Convierte enlaces de Google Drive al formato de descarga directa
 * Google Drive Sharing Link -> Direct Image URL
 * 
 * Ejemplos:
 * - https://drive.google.com/file/d/FILE_ID/view -> https://drive.google.com/uc?export=view&id=FILE_ID
 * - https://drive.google.com/open?id=FILE_ID -> https://drive.google.com/uc?export=view&id=FILE_ID
 */
export function convertGoogleDriveLink(url: string): string {
  if (!url) return url;

  try {
    const urlObj = new URL(url);

    // Verificar si es un enlace de Google Drive
    if (urlObj.hostname === 'drive.google.com') {
      // Caso 1: /file/d/FILE_ID/view
      const fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)\//);
      if (fileMatch) {
        return `https://drive.google.com/uc?export=view&id=${fileMatch[1]}`;
      }

      // Caso 2: /open?id=FILE_ID
      const openMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
      if (openMatch) {
        return `https://drive.google.com/uc?export=view&id=${openMatch[1]}`;
      }

      // Caso 3: /uc?export=view&id=FILE_ID (ya es formato directo)
      const ucMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
      if (ucMatch) {
        return url; // Ya esta en formato correcto
      }
    }
  } catch {
    // Si hay error, devolver la URL original
  }

  return url;
}

/**
 * Procesa una URL de imagen, convirtiendo enlaces de Google Drive
 * y validando que sean de dominios permitidos
 */
export function processImageUrl(url: string | undefined | null): string {
  if (!url) return '';
  
  // Convertir enlaces de Google Drive
  const convertedUrl = convertGoogleDriveLink(url.trim());
  
  // Verificar si es de un dominio permitido
  if (!isAllowedImageUrl(convertedUrl)) {
    console.warn('URL de imagen no permitida:', convertedUrl);
    return '';
  }
  
  return convertedUrl;
}
