# Guía de Rebranding - Club ViveVerde

Esta guía te permite cambiar completamente el nombre y branding de la aplicación.

## Pasos para Rebranding

### 1. Cambiar Variables de Entorno (.env)

Edita tu archivo `.env.local` con los nuevos valores:

```bash
# Nombre de la empresa
NEXT_PUBLIC_COMPANY_NAME="Nueva Empresa"
NEXT_PUBLIC_COMPANY_SHORT_NAME="NuevaEmpresa"
NEXT_PUBLIC_COMPANY_BRAND_NAME="NuevaMarca"

# Email
NEXT_PUBLIC_CONTACT_EMAIL="info@nuevaempresa.com"

# Teléfono
NEXT_PUBLIC_PHONE="600000000"

# Redes Sociales
NEXT_PUBLIC_SOCIAL_FACEBOOK="https://www.facebook.com/nuevaempresa/"
NEXT_PUBLIC_SOCIAL_INSTAGRAM="https://www.instagram.com/nuevaempresa/"

# URLs
NEXT_PUBLIC_SITE_URL="https://nuevaempresa.com"
NEXT_PUBLIC_EXTERNAL_WEBSITE_URL="https://nuevaempresa.com"
NEXT_PUBLIC_EXTERNAL_CONTACT_URL="https://nuevaempresa.com/contacto"

# SEO
NEXT_PUBLIC_SEO_TITLE_SUFFIX="Nueva Empresa"
NEXT_PUBLIC_SEO_DESCRIPTION="Únete a nuestra empresa y disfruta de nuestro programa de fidelización."
```

### 2. Actualizar PDFs de Términos y Privacidad

Los PDFs deben ser renombrados o recreados con el nuevo nombre:
- `Términos y Condiciones - Nueva Empresa.pdf`
- `Política de Privacidad - Nueva Empresa.pdf`
- `Términos y Condiciones de Uso – Tarjeta Nueva Empresa.pdf`

### 3. Actualizar URLs de PDFs en Configuración

En `.env.local`:

```bash
NEXT_PUBLIC_PRIVACY_POLICY_URL="/pdf/Política de Privacidad - Nueva Empresa.pdf"
NEXT_PUBLIC_TERMS_URL="/pdf/Términos y Condiciones - Nueva Empresa.pdf"
NEXT_PUBLIC_TERMS_USAGE_URL="/pdf/Términos y Condiciones de Uso – Tarjeta Nueva Empresa.pdf"
```

### 4. Reconstruir la Aplicación

```bash
npm run build
```

## Archivos Modificados para Soporte de Rebranding

| Archivo | Descripción |
|---------|-------------|
| `lib/config.ts` | Configuración centralizada con variables de entorno |
| `lib/constants/texts.ts` | Textos de UI |
| `lib/utils/pageUtils.ts` | Utilidades para títulos dinámicos |
| `.env.example` | Documentación de variables de entorno |

## Estructura de Configuración

```
COMPANY_CONFIG
├── name           → Nombre completo
├── shortName      → Nombre corto
├── brandName      → Nombre de marca
├── email          → Emails de contacto
├── phone          → Teléfono
├── address        → Dirección
├── socialMedia    → Redes sociales
└── googleMapsUrl  → URL de Google Maps

SITE_CONFIG
├── url            → URL principal
├── pages          → Rutas de páginas
├── external       → URLs externas
└── seo            → Configuración SEO
```

## Ejemplo de Cambio Completo

### Antes:
- Nombre: Club ViveVerde
- URL: https://clubviveverde.com
- Email: info@viveverde.es

### Después:
- Nombre: Mi Nueva Empresa
- URL: https://muevaempresa.com  
- Email: info@nuevaempresa.com

Solo necesitas cambiar las variables de entorno y la aplicación se actualizará automáticamente.

## Notas

- Las variables con prefijo `NEXT_PUBLIC_` son visibles en el navegador
- Las variables sin prefijo solo están disponibles en el servidor
- Algunos textos en `lib/constants/texts.ts` también contienen el nombre de la empresa y pueden necesitar actualización manual para algunos casos específicos
