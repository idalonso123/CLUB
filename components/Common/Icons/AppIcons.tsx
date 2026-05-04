/**
 * Iconos SVG Centralizados para Club ViveVerde
 * 
 * Este archivo proporciona iconos SVG como alternativa a emojis,
 * siguiendo las mejores prácticas de accesibilidad y consistencia visual.
 * 
 * @author Club ViveVerde
 * @version 1.0.0
 */

import React from 'react';

interface IconProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

// Helper para clases de tamaño
const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6'
};

/**
 * Icono de smartphone/móvil
 */
export const SmartphoneIcon = ({ className = '', size = 'md' }: IconProps) => (
  <svg 
    className={`${sizeClasses[size]} ${className}`} 
    fill="none" 
    viewBox="0 0 24 24" 
    stroke="currentColor"
    aria-hidden="true"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
  </svg>
);

/**
 * Icono de Tablet
 */
export const TabletIcon = ({ className = '', size = 'md' }: IconProps) => (
  <svg 
    className={`${sizeClasses[size]} ${className}`} 
    fill="none" 
    viewBox="0 0 24 24" 
    stroke="currentColor"
    aria-hidden="true"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
  </svg>
);

/**
 * Icono de Computadora/PC
 */
export const DesktopIcon = ({ className = '', size = 'md' }: IconProps) => (
  <svg 
    className={`${sizeClasses[size]} ${className}`} 
    fill="none" 
    viewBox="0 0 24 24" 
    stroke="currentColor"
    aria-hidden="true"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

/**
 * Icono de Alerta/Advertencia
 */
export const WarningIcon = ({ className = '', size = 'md' }: IconProps) => (
  <svg 
    className={`${sizeClasses[size]} ${className}`} 
    fill="none" 
    viewBox="0 0 24 24" 
    stroke="currentColor"
    aria-hidden="true"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

/**
 * Icono de Éxito/Check
 */
export const SuccessIcon = ({ className = '', size = 'md' }: IconProps) => (
  <svg 
    className={`${sizeClasses[size]} ${className}`} 
    fill="none" 
    viewBox="0 0 24 24" 
    stroke="currentColor"
    aria-hidden="true"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

/**
 * Icono de Error/Cruz
 */
export const ErrorIcon = ({ className = '', size = 'md' }: IconProps) => (
  <svg 
    className={`${sizeClasses[size]} ${className}`} 
    fill="none" 
    viewBox="0 0 24 24" 
    stroke="currentColor"
    aria-hidden="true"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

/**
 * Icono de Informação
 */
export const InfoIcon = ({ className = '', size = 'md' }: IconProps) => (
  <svg 
    className={`${sizeClasses[size]} ${className}`} 
    fill="none" 
    viewBox="0 0 24 24" 
    stroke="currentColor"
    aria-hidden="true"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

/**
 * Icono de Celebration/Fiesta
 */
export const CelebrationIcon = ({ className = '', size = 'md' }: IconProps) => (
  <svg 
    className={`${sizeClasses[size]} ${className}`} 
    fill="none" 
    viewBox="0 0 24 24" 
    stroke="currentColor"
    aria-hidden="true"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

/**
 * Icono de Ojos/Ver
 */
export const EyeIcon = ({ className = '', size = 'md' }: IconProps) => (
  <svg 
    className={`${sizeClasses[size]} ${className}`} 
    fill="none" 
    viewBox="0 0 24 24" 
    stroke="currentColor"
    aria-hidden="true"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

/**
 * Icono de Pulgar arriba/Like
 */
export const ThumbsUpIcon = ({ className = '', size = 'md' }: IconProps) => (
  <svg 
    className={`${sizeClasses[size]} ${className}`} 
    fill="none" 
    viewBox="0 0 24 24" 
    stroke="currentColor"
    aria-hidden="true"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a1 1 0 01.707 1.707l-2.828 2.828a1 1 0 01-1.414 0L9 10H7a1 1 0 01-1-1V7a1 1 0 011-1h5.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V15a1 1 0 01-1 1h-2z" />
  </svg>
);

/**
 * Icono de Descarga
 */
export const DownloadIcon = ({ className = '', size = 'md' }: IconProps) => (
  <svg 
    className={`${sizeClasses[size]} ${className}`} 
    fill="none" 
    viewBox="0 0 24 24" 
    stroke="currentColor"
    aria-hidden="true"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);

/**
 * Icono de Instalar
 */
export const InstallIcon = ({ className = '', size = 'md' }: IconProps) => (
  <svg 
    className={`${sizeClasses[size]} ${className}`} 
    fill="none" 
    viewBox="0 0 24 24" 
    stroke="currentColor"
    aria-hidden="true"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);

// Exportar mapa de iconos para uso dinámico
export const ICON_MAP = {
  smartphone: SmartphoneIcon,
  tablet: TabletIcon,
  desktop: DesktopIcon,
  warning: WarningIcon,
  success: SuccessIcon,
  error: ErrorIcon,
  info: InfoIcon,
  celebration: CelebrationIcon,
  eye: EyeIcon,
  thumbsUp: ThumbsUpIcon,
  download: DownloadIcon,
  install: InstallIcon,
} as const;

export type IconName = keyof typeof ICON_MAP;