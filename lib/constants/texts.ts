/**
 * Constantes de textos de la aplicación Club ViveVerde
 * 
 * Este archivo contiene todos los textos de la interfaz de usuario.
 * Para actualizar textos, solo necesitas modificar este archivo.
 * 
 * @author Club ViveVerde
 * @version 1.0.0
 */

// ============================================
// TEXTOS COMUNES
// ============================================

export const COMMON_TEXTS = {
  // Botones
  buttons: {
    save: 'Guardar',
    saveChanges: 'Guardar Cambios',
    cancel: 'Cancelar',
    back: 'Volver',
    continue: 'Continuar',
    close: 'Cerrar',
    submit: 'Enviar',
    delete: 'Eliminar',
    edit: 'Editar',
    add: 'Añadir',
    search: 'Buscar',
    filter: 'Filtrar',
    export: 'Exportar',
    import: 'Importar',
    refresh: 'Actualizar',
    loading: 'Cargando...',
    loadingShort: 'Cargando...',
    send: 'Enviar',
    confirm: 'Confirmar',
    reset: 'Restablecer',
    viewAll: 'Ver Todo',
    learnMore: 'Más Información',
    contact: 'Contactar',
    register: 'Registrarse',
    login: 'Iniciar Sesión',
    logout: 'Cerrar Sesión',
  },
  
  // Estados
  states: {
    active: 'Activo',
    inactive: 'Inactivo',
    pending: 'Pendiente',
    completed: 'Completado',
    cancelled: 'Cancelado',
    enabled: 'Habilitado',
    disabled: 'Deshabilitado',
  },
  
  //通用
  general: {
    yes: 'Sí',
    no: 'No',
    all: 'Todos',
    none: 'Ninguno',
    error: 'Error',
    success: 'Éxito',
    warning: 'Advertencia',
    info: 'Información',
    or: 'o',
    and: 'y',
    with: 'con',
    without: 'sin',
  },
  
  // Fechas y tiempo
  dates: {
    today: 'Hoy',
    yesterday: 'Ayer',
    tomorrow: 'Mañana',
    thisWeek: 'Esta semana',
    lastWeek: 'Semana pasada',
    thisMonth: 'Este mes',
    lastMonth: 'Mes pasado',
  },
} as const;

// ============================================
// TEXTOS DE AUTENTICACIÓN
// ============================================

export const AUTH_TEXTS = {
  // Login
  login: {
    title: 'Bienvenido a Club ViveVerde',
    subtitle: 'Ingresa tus credenciales para acceder a tu cuenta',
    emailPlaceholder: 'correo@ejemplo.com',
    passwordPlaceholder: 'Tu contraseña',
    rememberMe: 'Recordarme',
    forgotPassword: '¿Olvidaste tu contraseña?',
    submitButton: 'Iniciar Sesión',
    noAccount: '¿No tienes cuenta?',
    registerLink: 'Regístrate aquí',
    welcomeBack: '¡Bienvenido de nuevo!',
  },
  
  // Register
  register: {
    title: 'Únete a Club ViveVerde',
    subtitle: 'Crea tu cuenta y empieza a acumular puntos',
    firstNamePlaceholder: 'Tu nombre',
    lastNamePlaceholder: 'Tu apellido',
    emailPlaceholder: 'correo@ejemplo.com',
    phonePlaceholder: 'Tu número de teléfono',
    passwordPlaceholder: 'Crea una contraseña',
    confirmPasswordPlaceholder: 'Confirma tu contraseña',
    termsLabel: 'Acepto los',
    termsLink: 'Términos y Condiciones',
    privacyLabel: 'He leído la',
    privacyLink: 'Política de Privacidad',
    submitButton: 'Crear Cuenta',
    alreadyAccount: '¿Ya tienes cuenta?',
    loginLink: 'Inicia sesión aquí',
    oldCustomerTitle: '¿Has sido cliente de ViveVerde anteriormente?',
    oldCustomerYes: 'Sí, soy cliente anterior',
    oldCustomerNo: 'No, es la primera vez',
    successMessage: '¡Tu cuenta ha sido creada exitosamente!',
  },
  
  // Reset Password
  resetPassword: {
    title: 'Restablecer Contraseña',
    subtitle: 'Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña',
    emailPlaceholder: 'Tu correo electrónico',
    submitButton: 'Enviar Enlace',
    backToLogin: 'Volver a Iniciar Sesión',
    successMessage: 'Si el correo existe en nuestro sistema, recibirás un enlace para restablecer tu contraseña.',
    emailSentTitle: 'Correo Enviado',
    emailSentMessage: 'Hemos enviado un correo electrónico a {email} con instrucciones para restablecer tu contraseña.',
  },
  
  // Errores de autenticación
  errors: {
    invalidCredentials: 'Correo electrónico o contraseña incorrectos',
    accountLocked: 'Tu cuenta ha sido bloqueada. Contacta con soporte.',
    sessionExpired: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
    genericError: 'Error al procesar la solicitud. Por favor, inténtalo de nuevo.',
  },
} as const;

// ============================================
// TEXTOS DE VALIDACIÓN
// ============================================

export const VALIDATION_TEXTS = {
  // Campos requeridos
  required: 'Este campo es obligatorio',
  requiredWithField: '{field} es obligatorio',
  
  // Email
  email: {
    invalid: 'Por favor ingresa un correo electrónico válido',
    notFound: 'No existe una cuenta con este correo electrónico',
    alreadyExists: 'Ya existe una cuenta con este correo electrónico',
  },
  
  // Contraseña
  password: {
    tooShort: 'La contraseña debe tener al menos {min} caracteres',
    tooLong: 'La contraseña no puede tener más de {max} caracteres',
    mismatch: 'Las contraseñas no coinciden',
    invalid: 'La contraseña es incorrecta',
    requirements: 'La contraseña debe contener al menos una letra mayúscula, una minúscula y un número',
    resetSuccess: 'Tu contraseña ha sido restablecida exitosamente',
  },
  
  // Teléfono
  phone: {
    invalid: 'Por favor ingresa un número de teléfono válido',
    tooShort: 'El teléfono debe tener al menos {min} dígitos',
    tooLong: 'El teléfono no puede tener más de {max} dígitos',
  },
  
  // Nombre
  name: {
    invalid: 'Por favor ingresa un nombre válido',
    tooShort: 'El nombre debe tener al menos {min} caracteres',
    tooLong: 'El nombre no puede tener más de {max} caracteres',
  },
  
  // Apellido
  lastName: {
    invalid: 'Por favor ingresa un apellido válido',
    tooShort: 'El apellido debe tener al menos {min} caracteres',
    tooLong: 'El apellido no puede tener más de {max} caracteres',
  },
  
  // Código postal
  postalCode: {
    invalid: 'Por favor ingresa un código postal válido',
    notFound: 'No se encontró información para este código postal',
  },
  
  // Generic
  generic: {
    minLength: 'Debe tener al menos {min} caracteres',
    maxLength: 'No puede tener más de {max} caracteres',
    invalidFormat: 'El formato no es válido',
    invalidValue: 'El valor no es válido',
    notMatch: 'Los valores no coinciden',
  },
} as const;

// ============================================
// TEXTOS DE FORMULARIOS
// ============================================

export const FORM_TEXTS = {
  // Labels
  labels: {
    // Datos personales
    firstName: 'Nombre',
    lastName: 'Apellido',
    fullName: 'Nombre Completo',
    email: 'Correo Electrónico',
    phone: 'Teléfono',
    phonePrefix: 'Prefijo',
    birthDate: 'Fecha de Nacimiento',
    gender: 'Género',
    
    // Ubicación
    address: 'Dirección',
    street: 'Calle',
    number: 'Número',
    floor: 'Piso',
    door: 'Puerta',
    postalCode: 'Código Postal',
    city: 'Ciudad',
    province: 'Provincia',
    country: 'País',
    location: 'Ubicación',
    
    // Cuenta
    username: 'Usuario',
    password: 'Contraseña',
    confirmPassword: 'Confirmar Contraseña',
    currentPassword: 'Contraseña Actual',
    newPassword: 'Nueva Contraseña',
    
    // Misc
    notes: 'Notas',
    description: 'Descripción',
    observations: 'Observaciones',
    reason: 'Razón',
    comments: 'Comentarios',
    message: 'Mensaje',
    subject: 'Asunto',
    category: 'Categoría',
    type: 'Tipo',
    status: 'Estado',
    date: 'Fecha',
    time: 'Hora',
    amount: 'Cantidad',
    points: 'Puntos',
    balance: 'Saldo',
    total: 'Total',
    search: 'Buscar',
    filter: 'Filtrar',
    sortBy: 'Ordenar por',
    order: 'Orden',
    perPage: 'Por página',
    of: 'de',
    results: 'resultados',
    showing: 'Mostrando',
    to: 'a',
  },
  
  // Placeholders
  placeholders: {
    search: 'Buscar...',
    select: 'Seleccionar...',
    selectOption: 'Selecciona una opción',
    writeMessage: 'Escribe tu mensaje aquí...',
    writeComment: 'Escribe un comentario...',
    writeReason: 'Escribe la razón...',
  },
  
  // Títulos de secciones
  sections: {
    personalInfo: 'Información Personal',
    contactInfo: 'Información de Contacto',
    locationInfo: 'Información de Ubicación',
    accountInfo: 'Información de la Cuenta',
    securityInfo: 'Seguridad',
    preferences: 'Preferencias',
    additionalInfo: 'Información Adicional',
    billingInfo: 'Información de Facturación',
    shippingInfo: 'Información de Envío',
  },
} as const;

// ============================================
// TEXTOS DEFeedback (Mensajes)
// ============================================

export const FEEDBACK_TEXTS = {
  // Éxito
  success: {
    generic: 'Operación realizada exitosamente',
    saved: 'Cambios guardados correctamente',
    deleted: 'Eliminado correctamente',
    created: 'Creado correctamente',
    updated: 'Actualizado correctamente',
    sent: 'Enviado correctamente',
    copied: 'Copiado al portapapeles',
    imported: 'Importado correctamente',
    exported: 'Exportado correctamente',
    verified: 'Verificado correctamente',
    confirmed: 'Confirmado correctamente',
    registered: 'Registro completado exitosamente',
    login: 'Has iniciado sesión correctamente',
    logout: 'Has cerrado sesión correctamente',
  },
  
  // Errores
  error: {
    generic: 'Ha ocurrido un error. Por favor, inténtalo de nuevo.',
    network: 'Error de conexión. Verifica tu conexión a internet.',
    server: 'Error del servidor. Por favor, inténtalo más tarde.',
    unauthorized: 'No tienes autorización para realizar esta acción.',
    forbidden: 'Acceso denegado.',
    notFound: 'Recurso no encontrado.',
    timeout: 'La solicitud ha expirado. Por favor, inténtalo de nuevo.',
    validation: 'Por favor, verifica los datos ingresados.',
    duplicate: 'Ya existe un registro con estos datos.',
    insufficientPoints: 'No tienes suficientes puntos para esta operación.',
    maxRedemptions: 'Has alcanzado el límite máximo de canjes.',
  },
  
  // Advertencias
  warning: {
    unsavedChanges: 'Tienes cambios sin guardar. ¿Estás seguro de abandonar?',
    deleteConfirm: '¿Estás seguro de que deseas eliminar este elemento?',
    actionCannotBeUndone: 'Esta acción no se puede deshacer.',
    sessionExpiring: 'Tu sesión está por expirar.',
    pointsExpiring: 'Tienes puntos próximos a expirar.',
  },
  
  // Información
  info: {
    requiredFields: 'Los campos marcados con * son obligatorios',
    loadingData: 'Cargando datos...',
    noData: 'No hay datos disponibles',
    noResults: 'No se encontraron resultados',
    processing: 'Procesando tu solicitud...',
    redirecting: 'Redireccionando...',
  },
} as const;

// ============================================
// TEXTOS DE PÁGINAS
// ============================================

export const PAGE_TEXTS = {
  // Página principal
  home: {
    title: 'Club ViveVerde',
    subtitle: 'Tu programa de fidelización ecológico',
    welcome: 'Bienvenido a Club ViveVerde',
    heroTitle: 'Acumula puntos con cada compra',
    heroSubtitle: 'Y canjéalos por fantásticas recompensas exclusivas',
    ctaTitle: '¿Listo para empezar?',
    ctaButton: 'Únete ahora',
    features: {
      title: '¿Por qué unirte a Club ViveVerde?',
      feature1Title: 'Acumula Puntos',
      feature1Desc: 'Por cada compra acumulas puntos que puedes canjear después.',
      feature2Title: 'Recompensas Exclusivas',
      feature2Desc: 'Accede a ofertas y recompensas solo para miembros.',
      feature3Title: 'Programa Ecológico',
      feature3Desc: 'Contribuye al cuidado del medio ambiente con cada compra.',
    },
  },
  
  // Dashboard / Panel de usuario
  dashboard: {
    title: 'Mi Panel',
    welcome: 'Bienvenido, {name}',
    yourPoints: 'Tus Puntos',
    availablePoints: 'Puntos Disponibles',
    pointsToExpire: 'Puntos por Expirar',
    yourRewards: 'Tus Recompensas',
    recentActivity: 'Actividad Reciente',
    quickActions: 'Acciones Rápidas',
    profile: 'Mi Perfil',
    myPoints: 'Mis Puntos',
    myRewards: 'Mis Recompensas',
    redemptionHistory: 'Historial de Canjes',
  },
  
  // Recompensas
  rewards: {
    title: 'Recompensas',
    subtitle: 'Canjea tus puntos por increíbles recompensas',
    availableRewards: 'Recompensas Disponibles',
    myPoints: 'Mis Puntos',
    pointsRequired: 'Puntos requeridos',
    redeem: 'Canjear',
    redeemNow: 'Canjear Ahora',
    pointsFormat: '{points} puntos',
    category: 'Categoría',
    allCategories: 'Todas las Categorías',
    filterBy: 'Filtrar por',
    sortBy: 'Ordenar por',
    priceAsc: 'Menor precio',
    priceDesc: 'Mayor precio',
    nameAsc: 'Nombre A-Z',
    nameDesc: 'Nombre Z-A',
    noRewards: 'No hay recompensas disponibles en este momento',
    notEnoughPoints: 'No tienes suficientes puntos para esta recompensa',
    redemptionSuccess: '¡Canje realizado exitosamente!',
    redemptionConfirm: '¿Confirmas el canje de {points} puntos por {reward}?',
  },
  
  // Admin
  admin: {
    title: 'Panel de Administración',
    dashboard: 'Panel Principal',
    users: 'Usuarios',
    rewards: 'Recompensas',
    mainPage: 'Página Principal',
    analytics: 'Analíticas',
    logs: 'Registros',
    config: 'Configuración',
    stats: 'Estadísticas',
    totalUsers: 'Total de Usuarios',
    activeUsers: 'Usuarios Activos',
    totalPoints: 'Total de Puntos',
    totalRewards: 'Recompensas Canjeadas',
    recentActivity: 'Actividad Reciente',
    userGrowth: 'Crecimiento de Usuarios',
  },
  
  // Cajero / Teller
  teller: {
    title: 'Cajero',
    searchUser: 'Buscar Usuario',
    addPoints: 'Añadir Puntos',
    redeemPoints: 'Canjear Puntos',
    userNotFound: 'Usuario no encontrado',
    enterBarcode: 'Introduce el código de barras',
    selectUser: 'Seleccionar usuario',
    confirmPoints: 'Confirmar puntos',
    transactionComplete: 'Transacción completada',
  },
} as const;

// ============================================
// TEXTOS DE NAVEGACIÓN
// ============================================

export const NAV_TEXTS = {
  // Menú principal
  menu: {
    home: 'Inicio',
    login: 'Iniciar Sesión',
    register: 'Registrarse',
    dashboard: 'Mi Panel',
    rewards: 'Recompensas',
    profile: 'Mi Perfil',
    logout: 'Cerrar Sesión',
    admin: 'Administración',
    teller: 'Cajero',
  },
  
  // Footer
  footer: {
    about: 'Sobre Nosotros',
    contact: 'Contacto',
    privacy: 'Política de Privacidad',
    terms: 'Términos y Condiciones',
    cookies: 'Política de Cookies',
    faq: 'Preguntas Frecuentes',
    help: 'Ayuda',
    copyright: '© {year} Club ViveVerde. Todos los derechos reservados.',
    developedBy: 'Desarrollado por',
  },
} as const;

// ============================================
// EXPORTACIÓN COMBINADA
// ============================================

/**
 * Exporta todos los textos como un objeto único
 * para importación fácil: import { TEXTS } from '@/lib/constants/texts'
 */
export const TEXTS = {
  common: COMMON_TEXTS,
  auth: AUTH_TEXTS,
  validation: VALIDATION_TEXTS,
  forms: FORM_TEXTS,
  feedback: FEEDBACK_TEXTS,
  pages: PAGE_TEXTS,
  nav: NAV_TEXTS,
} as const;

export default TEXTS;

// ============================================
// TIPOS EXPORTADOS
// ============================================

export type CommonTextsType = typeof COMMON_TEXTS;
export type AuthTextsType = typeof AUTH_TEXTS;
export type ValidationTextsType = typeof VALIDATION_TEXTS;
export type FormTextsType = typeof FORM_TEXTS;
export type FeedbackTextsType = typeof FEEDBACK_TEXTS;
export type PageTextsType = typeof PAGE_TEXTS;
export type NavTextsType = typeof NAV_TEXTS;
export type AllTextsType = typeof TEXTS;
