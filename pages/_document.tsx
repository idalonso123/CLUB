import { Html, Head, Main, NextScript } from "next/document";
import { COMPANY_CONFIG, SITE_CONFIG } from "@/lib/config";

export default function Document() {
  return (
    <Html lang="es">
      <Head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" integrity="sha512-iecdLmaskl7CVkqkXNQ/ZH/XLlvWZOJyj7Yy7tcenmpD1ypASozpmT/E0iPtmFIB46ZmdtAc9eNBvH0H/ZpiBw==" crossOrigin="anonymous" referrerPolicy="no-referrer" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" type="image/svg+xml" href="/icons/favicon.svg" />
        <link rel="icon" href="/icons/favicon.ico" type="image/x-icon" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/favicon-16x16.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="48x48" href="/icons/favicon-48x48.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icons/android-chrome-192x192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/icons/android-chrome-512x512.png" />
        <link rel="mask-icon" href="/icons/safari-pinned-tab.svg" color="#0D542B" />
        <meta name="msapplication-TileColor" content="#0D542B" />
        <meta name="msapplication-TileImage" content="/icons/mstile-144x144.png" />
        <meta name="theme-color" content="#0D542B" />
        <meta name="application-name" content={COMPANY_CONFIG.name} />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content={COMPANY_CONFIG.name} />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="author" content="Garcenar Jardineria SL" />
        <meta name="description" content={`${COMPANY_CONFIG.name} - Aplicación de fidelización para clientes de ${COMPANY_CONFIG.brandName}. Acumula puntos en tus compras y canjéalos por fantásticas recompensas.`} />
        <meta name="keywords" content={`${COMPANY_CONFIG.brandName}, ${COMPANY_CONFIG.name}, Aplicación de Fidelización, Puntos, Recompensas, Sostenible, Jardinería, Espacios Verdes, Servicios de Jardinería`} />
        <meta name="image" content="/icons/icon-512x512.png" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={SITE_CONFIG.url} />
        <meta property="og:title" content={`${COMPANY_CONFIG.name} - Aplicación de Fidelización`} />
        <meta property="og:description" content={`Acumula puntos en tus compras en ${COMPANY_CONFIG.name} y canjéalos por fantásticas recompensas. ¡Únete al ${COMPANY_CONFIG.name}!`} />
        <meta property="og:image" content="/icons/icon-512x512.png" />
        <meta property="og:site_name" content={COMPANY_CONFIG.name} />
        <meta property="og:locale" content="es_ES" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={`${COMPANY_CONFIG.name} - Aplicación de Fidelización`} />
        <meta name="twitter:description" content={`Acumula puntos en tus compras en ${COMPANY_CONFIG.name} y canjéalos por fantásticas recompensas. ¡Únete al ${COMPANY_CONFIG.name}!`} />
        <meta name="twitter:image" content="/icons/icon-512x512.png" />
        <link rel="apple-touch-icon" href="/icons/apple-icon-180.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/apple-icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-icon-180x180.png" />
        <link rel="apple-touch-icon" sizes="167x167" href="/icons/apple-icon-167x167.png" />
        <link rel="apple-touch-startup-image" href="/icons/apple-splash-2048-2732.png" media="(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/icons/apple-splash-1668-2388.png" media="(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/icons/apple-splash-1536-2048.png" media="(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/icons/apple-splash-1125-2436.png" media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/icons/apple-splash-1242-2688.png" media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/icons/apple-splash-828-1792.png" media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/icons/apple-splash-750-1334.png" media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/icons/apple-splash-640-1136.png" media="(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}