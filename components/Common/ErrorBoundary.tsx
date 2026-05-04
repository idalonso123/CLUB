/**
 * Error Boundary Component
 * Catches React errors and displays a fallback UI
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary para capturar errores de React
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log del error para debugging
    console.error('ErrorBoundary capturó un error:', error, errorInfo);
    
    // Llamar callback de error si existe
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // En producción, aquí se enviaría a un servicio de error tracking
    if (process.env.NODE_ENV === 'production') {
      this.logErrorToService(error, errorInfo);
    }
  }

  /**
   * Envía el error a un servicio de tracking (ej: Sentry)
   */
  private logErrorToService(error: Error, errorInfo: ErrorInfo): void {
    // Implementación para Sentry u otro servicio
    // Sentry.captureException(error, { extra: errorInfo });
    
    // Por ahora, solo log
    console.error('Error en producción:', {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    });
  }

  handleRetry = (): void => {
    this.setState({
      hasError: false,
      error: null
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

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
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-4 p-3 bg-red-50 rounded text-left text-sm text-red-700 overflow-auto max-h-40">
                <p className="font-semibold">Error:</p>
                <p className="whitespace-pre-wrap">{this.state.error.message}</p>
                {this.state.error.stack && (
                  <details className="mt-2">
                    <summary className="cursor-pointer font-semibold">
                      Stack trace
                    </summary>
                    <pre className="mt-1 text-xs whitespace-pre-wrap">
                      {this.state.error.stack}
                    </pre>
                  </details>
                )}
              </div>
            )}
            
            <button
              onClick={this.handleRetry}
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

    return this.props.children;
  }
}

/**
 * Hook para usar el Error Boundary programáticamente
 */
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  const handleError = React.useCallback((err: Error | string) => {
    const error = typeof err === 'string' ? new Error(err) : err;
    setError(error);
    
    // En producción, enviar a servicio de tracking
    if (process.env.NODE_ENV === 'production') {
      console.error('Error capturado:', error);
    }
  }, []);

  const clearError = React.useCallback(() => {
    setError(null);
  }, []);

  return { error, handleError, clearError };
}

/**
 * Componente para mostrar errores de forma inline
 */
interface ErrorDisplayProps {
  error: Error | null;
  onRetry?: () => void;
  className?: string;
}

export function ErrorDisplay({ error, onRetry, className = '' }: ErrorDisplayProps) {
  if (!error) return null;

  return (
    <div className={`p-4 bg-red-50 border border-red-200 rounded-lg ${className}`}>
      <div className="flex items-start">
        <svg
          className="h-5 w-5 text-red-400 mt-0.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <div className="ml-3 flex-1">
          <p className="text-sm text-red-800 font-medium">
            {error.message || 'Ha ocurrido un error'}
          </p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
            >
              Reintentar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ErrorBoundary;
