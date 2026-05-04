/**
 * Configuración centralizada de la aplicación Club ViveVerde
 * 
 * Este archivo contiene todos los datos de configuración que antes estaban hardcodeados.
 * Las URLs externas y datos sensibles se configuran a través de variables de entorno.
 * Para actualizar la información de la empresa, solo necesitas modificar las variables de entorno.
 * 
 * @author Club ViveVerde
 * @version 1.0.0
 */

// ============================================
// CONFIGURACIÓN DE LA EMPRESA (Desde Variables de Entorno)
// ============================================

export const COMPANY_CONFIG = {
  /** Nombre completo de la empresa */
  name: process.env.NEXT_PUBLIC_COMPANY_NAME || 'Club ViveVerde',
  
  /** Nombre corto para usar en títulos */
  shortName: process.env.NEXT_PUBLIC_COMPANY_SHORT_NAME || 'ViveVerde',
  
  /** Nombre sin "Club" */
  brandName: process.env.NEXT_PUBLIC_COMPANY_BRAND_NAME || 'ViveVerde',
  
  /** Email principal de contacto */
  email: {
    primary: process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'info@viveverde.es',
    support: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'soporte@viveverde.es',
  },
  
  /** Teléfono de contacto */
  phone: {
    prefix: process.env.NEXT_PUBLIC_PHONE_PREFIX || '+34',
    main: process.env.NEXT_PUBLIC_PHONE || '612345678',
  },
  
  /** Dirección física */
  address: {
    street: process.env.NEXT_PUBLIC_ADDRESS_STREET || '',
    city: process.env.NEXT_PUBLIC_ADDRESS_CITY || 'Aranjuez',
    province: process.env.NEXT_PUBLIC_ADDRESS_PROVINCE || 'Madrid',
    country: process.env.NEXT_PUBLIC_ADDRESS_COUNTRY || 'España',
    postalCode: process.env.NEXT_PUBLIC_ADDRESS_POSTAL_CODE || '',
  },
  
  /** Redes sociales - URLs desde variables de entorno */
  socialMedia: {
    facebook: process.env.NEXT_PUBLIC_SOCIAL_FACEBOOK || '',
    instagram: process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM || '',
    tiktok: process.env.NEXT_PUBLIC_SOCIAL_TIKTOK || '',
    youtube: process.env.NEXT_PUBLIC_SOCIAL_YOUTUBE || '',
    twitter: process.env.NEXT_PUBLIC_SOCIAL_TWITTER || '',
    linkedin: process.env.NEXT_PUBLIC_SOCIAL_LINKEDIN || '',
  },
  
  /** Google Maps URL para la ubicación */
  googleMapsUrl: process.env.NEXT_PUBLIC_GOOGLE_MAPS_URL || '',
} as const;

// ============================================
// CONFIGURACIÓN DEL SITIO WEB
// ============================================

export const SITE_CONFIG = {
  /** URL principal del sitio */
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://clubviveverde.com',
  
  /** URLs de páginas principales (rutas relativas) */
  pages: {
    home: '/',
    login: '/login',
    register: '/register',
    dashboard: '/dashboard',
    rewards: '/rewards',
    admin: '/admin',
    teller: '/teller',
    resetPassword: '/reset-password',
  },
  
  /** URLs externas - Configuradas desde variables de entorno */
  external: {
    viveverdeWebsite: process.env.NEXT_PUBLIC_EXTERNAL_WEBSITE_URL || 'https://viveverde.es',
    contactPage: process.env.NEXT_PUBLIC_EXTERNAL_CONTACT_URL || 'https://viveverde.es/contacta/',
    privacyPolicy: process.env.NEXT_PUBLIC_PRIVACY_POLICY_URL || '/pdf/Política de Privacidad - Club ViveVerde.pdf',
    termsAndConditions: process.env.NEXT_PUBLIC_TERMS_URL || '/pdf/Términos y Condiciones - Club ViveVerde.pdf',
    termsAndConditionsUsage: process.env.NEXT_PUBLIC_TERMS_USAGE_URL || '/terminos-condiciones-uso',
  },
  
  /** Versión actual de los documentos legales - Actualizar cuando se modifiquen */
  legalVersions: {
    /** Versión de los Términos y Condiciones */
    termsAndConditions: process.env.TERMS_VERSION || '1.0.0',
    /** Versión de la Política de Privacidad */
    privacyPolicy: process.env.PRIVACY_POLICY_VERSION || '1.0.0',
    /** Fecha de vigencia de los términos */
    termsEffectiveDate: process.env.TERMS_EFFECTIVE_DATE || '2026-04-28',
  },
  
  /** Configuración SEO */
  seo: {
    titleSuffix: process.env.NEXT_PUBLIC_SEO_TITLE_SUFFIX || 'Club ViveVerde',
    description: process.env.NEXT_PUBLIC_SEO_DESCRIPTION || 'Accede a tu cuenta de Club ViveVerde o regístrate para disfrutar de nuestro sistema de fidelización.',
    keywords: process.env.NEXT_PUBLIC_SEO_KEYWORDS || 'fidelización, puntos, recompensas, ecology, sostenible',
  },
} as const;

// ============================================
// CONFIGURACIÓN DE APIs EXTERNAS
// ============================================

export const API_CONFIG = {
  /** API de geolocalización (OpenStreetMap) */
  geolocation: {
    nominatimUrl: process.env.NEXT_PUBLIC_GEOLOCATION_API_URL || 'https://nominatim.openstreetmap.org',
    userAgent: process.env.GEOLOCATION_USER_AGENT || 'ClubViveVerdeApp/1.0 (contact@viveverde.es)',
  },
  
  /** API de Google Analytics */
  analytics: {
    measurementId: process.env.NEXT_PUBLIC_MEASUREMENT_ID_GOOGLE || 'G-ZLZS1NL81T',
    propertyId: process.env.GA_PROPERTY_ID || '488457135',
  },
} as const;

// ============================================
// CONFIGURACIÓN DE PLACEHOLDERS
// ============================================

export const PLACEHOLDERS = {
  /** Placeholder para URLs de imágenes */
  imageUrl: process.env.NEXT_PUBLIC_PLACEHOLDER_IMAGE_URL || 'https://ejemplo.com/imagen.jpg',
  
  /** Placeholder para números de teléfono */
  phone: process.env.NEXT_PUBLIC_PLACEHOLDER_PHONE || '612345678',
  
  /** Placeholder para URLs de ejemplo */
  exampleUrl: process.env.NEXT_PUBLIC_PLACEHOLDER_EXAMPLE_URL || 'https://ejemplo.com',
} as const;

// ============================================
// EXPORTACIÓN COMBINADA
// ============================================

/**
 * Exporta toda la configuración como un objeto único
 * para importación fácil: import { CONFIG } from '@/config'
 */
export const CONFIG = {
  company: COMPANY_CONFIG,
  site: SITE_CONFIG,
  api: API_CONFIG,
  placeholders: PLACEHOLDERS,
} as const;

export default CONFIG;
