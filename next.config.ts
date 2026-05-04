import type { NextConfig } from "next";
import withPWA from 'next-pwa';

/**
 * Configuración de Next.js
 */
const nextConfig: NextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  // Optimizaciones de producción
  poweredByHeader: false,
  // Configuración de compressión
  compress: true,
  // Configuración de Turbopack (vacío para usar webpack de next-pwa)
  turbopack: {},
  // Rewrites para uploads
  async rewrites() {
    return [
      {
        source: '/uploads/:filename*',
        destination: '/api/uploads/apiPhotos?filename=:filename*'
      }
    ];
  },
  // Configuración de imágenes para permitir dominios externos
  // Usamos comodines (*) para reducir el número de patrones
  images: {
    remotePatterns: [
      // Google Drive y servicios relacionados
      {
        protocol: 'https',
        hostname: 'drive.google.com',
      },
      {
        protocol: 'https',
        hostname: '*.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'photos.google.com',
      },
      // Servicios de hosting de imágenes populares
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      {
        protocol: 'https',
        hostname: '*.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.jsdelivr.net',
      },
      {
        protocol: 'https',
        hostname: '*.imgbb.com',
      },
      {
        protocol: 'https',
        hostname: '*.ibb.co',
      },
      {
        protocol: 'https',
        hostname: 'i.postimg.cc',
      },
      {
        protocol: 'https',
        hostname: 'postimg.cc',
      },
    ],
    // Deshabilitar optimización de imágenes para evitar problemas
    unoptimized: true,
  },
};

/**
 * Configuración del Service Worker / PWA
 * Optimizada para evitar problemas de caché
 */
const pwaConfig = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  // Deshabilitar en desarrollo para evitar problemas
  disable: process.env.NODE_ENV === 'development',
  // Configuración de build
  buildExcludes: [
    /middleware_runtime\.js$/,
  ],
  // Runtime caching configurado para evitar caché obsoleta
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/fonts\.(?:gstatic|googleapis)\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts',
        expiration: {
          maxEntries: 10,
          maxAgeSeconds: 60 * 60 * 24 * 365 // 1 año
        },
        cacheableResponse: {
          statuses: [0, 200]
        }
      }
    },
    {
      urlPattern: /\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-font-assets',
        expiration: {
          maxEntries: 10,
          maxAgeSeconds: 60 * 60 * 24 * 365 // 1 año
        }
      }
    },
    {
      urlPattern: /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-image-assets',
        expiration: {
          maxEntries: 64,
          maxAgeSeconds: 60 * 60 * 24 * 30 // 30 días
        }
      }
    },
    {
      urlPattern: /\/_next\/image\?url=.+$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'next-image',
        expiration: {
          maxEntries: 64,
          maxAgeSeconds: 60 * 60 * 24 // 24 horas
        }
      }
    },
    {
      urlPattern: /\.(?:js)$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-js-assets',
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 60 * 60 * 24 // 24 horas
        }
      }
    },
    {
      urlPattern: /\.(?:css|less)$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-style-assets',
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 60 * 60 * 24 // 24 horas
        }
      }
    },
    {
      urlPattern: /\/_next\/data\/.+\/.+\.json$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'next-data',
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 60 * 60 * 24 // 24 horas
        }
      }
    },
    {
      urlPattern: /\.(?:json|xml|csv)$/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'static-data-assets',
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 60 * 60 * 24 // 24 horas
        },
        networkTimeoutSeconds: 10
      }
    },
    {
      urlPattern: ({ url }: { url: URL }) => {
        const isSameOrigin = self.origin === url.origin;
        return isSameOrigin && !url.pathname.startsWith('/api/');
      },
      handler: 'NetworkFirst',
      options: {
        cacheName: 'pages',
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 60 * 60 * 24 // 24 horas
        },
        networkTimeoutSeconds: 10
      }
    }
  ]
});

export default pwaConfig(nextConfig);