import "@/styles/globals.css";
import type { AppProps } from "next/app";
import Layout from "@/components/Layout/Layout";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/contexts/AuthContext";
import RewardsProvider from "@/components/Admin/RewardsProvider";
import MainPageProvider from "@/components/Admin/MainPageProvider";
import GoogleAnalytics from "@/components/HomePages/GoogleAnalytics";
import { Toaster } from "react-hot-toast";
import { ErrorBoundary } from "@/components/Common/ErrorBoundary";
import { QueryProvider } from "@/components/Providers/QueryProvider";
import { useEffect } from "react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/**
 * Componente de error fallback para el Error Boundary
 */
function ErrorFallback({ resetErrorBoundary }: { resetErrorBoundary?: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
        <div className="mb-4">
          <svg
            className="mx-auto h-16 w-16 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        
        <h1 className="text-xl font-bold text-gray-900 mb-2">
          Algo salió mal
        </h1>
        
        <p className="text-gray-600 mb-4">
          Lo sentimos, ha ocurrido un error inesperado. Por favor, intenta de nuevo.
        </p>
        
        <button
          onClick={() => {
            if (resetErrorBoundary) {
              resetErrorBoundary();
            } else {
              window.location.href = '/';
            }
          }}
          className="w-full px-4 py-2 bg-green-700 text-white rounded-md hover:bg-green-800 transition-colors"
        >
          Reintentar
        </button>
        
        <button
          onClick={() => window.location.href = '/'}
          className="w-full mt-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
        >
          Ir al inicio
        </button>
      </div>
    </div>
  );
}

/**
 * Manejador global de errores no capturados
 */
function useGlobalErrorHandler() {
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('Error global capturado:', event.error);
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Promesa rechazada no manejada:', event.reason);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);
}

export default function App({ Component, pageProps }: AppProps) {
  const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_MEASUREMENT_ID_GOOGLE || "club-viveverde-secret-key";
  
  // Activar manejador global de errores
  useGlobalErrorHandler();

  return (
    <ErrorBoundary fallback={<ErrorFallback />}>
      <QueryProvider>
        <div className={`${geistSans.variable} ${geistMono.variable}`}>
          <GoogleAnalytics measurementId={GA_MEASUREMENT_ID} />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
                borderRadius: '8px',
                padding: '16px',
              },
              success: {
                iconTheme: {
                  primary: '#10B981',
                  secondary: '#fff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#EF4444',
                  secondary: '#fff',
                },
              },
            }}
          />
          <AuthProvider>
            <RewardsProvider>
              <MainPageProvider>
                <Layout>
                  <Component {...pageProps} />
                </Layout>
              </MainPageProvider>
            </RewardsProvider>
          </AuthProvider>
        </div>
      </QueryProvider>
    </ErrorBoundary>
  );
}
