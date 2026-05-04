/**
 * Loading Skeleton Components
 * Componentes para mostrar estados de carga animados
 */

import React from 'react';

/**
 * Skeleton base con animación
 */
interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
}

export function Skeleton({
  className = '',
  variant = 'text',
  width,
  height
}: SkeletonProps) {
  const baseClasses = 'animate-pulse bg-gray-200';
  
  const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-md'
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={style}
    />
  );
}

/**
 * Skeleton para tarjeta de usuario
 */
export function UserCardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow p-4 mb-4">
      <div className="flex items-center space-x-4">
        <Skeleton variant="circular" width={48} height={48} />
        <div className="flex-1">
          <Skeleton className="h-4 w-32 mb-2" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="h-8 w-16" variant="rectangular" />
      </div>
    </div>
  );
}

/**
 * Skeleton para tabla de usuarios
 */
export function UsersTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-4 border-b">
        <div className="flex space-x-4">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/6" />
        </div>
      </div>
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="p-4 border-b last:border-b-0 flex space-x-4 items-center">
          <Skeleton variant="circular" width={40} height={40} />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-20" variant="rectangular" />
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton para lista de recompensas
 */
export function RewardsListSkeleton({ items = 4 }: { items?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="bg-white rounded-lg shadow p-4">
          <Skeleton className="h-32 w-full mb-4" variant="rectangular" />
          <Skeleton className="h-6 w-3/4 mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-2/3 mb-4" />
          <div className="flex justify-between items-center">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-8 w-24" variant="rectangular" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton para contenido de dashboard
 */
export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-6">
            <Skeleton className="h-4 w-24 mb-4" />
            <Skeleton className="h-8 w-16" />
          </div>
        ))}
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <Skeleton className="h-6 w-32 mb-4" />
          <Skeleton className="h-64 w-full" variant="rectangular" />
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <Skeleton className="h-6 w-32 mb-4" />
          <Skeleton className="h-64 w-full" variant="rectangular" />
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton para formulario
 */
export function FormSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: fields }).map((_, index) => (
        <div key={index}>
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-10 w-full" variant="rectangular" />
        </div>
      ))}
      <Skeleton className="h-10 w-full mt-6" variant="rectangular" />
    </div>
  );
}

/**
 * Skeleton para página completa
 */
export function PageSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <div className="flex space-x-4">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-6 max-w-7xl mx-auto">
        <DashboardSkeleton />
      </div>
    </div>
  );
}

/**
 * Spinner de carga
 */
export function Spinner({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div
        className={`${sizeClasses[size]} animate-spin rounded-full border-4 border-gray-200 border-t-green-600`}
      />
    </div>
  );
}

/**
 * Overlay de carga con mensaje
 */
export function LoadingOverlay({ 
  message = 'Cargando...' 
}: { 
  message?: string 
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 text-center">
        <Spinner size="lg" className="mx-auto mb-4" />
        <p className="text-gray-700">{message}</p>
      </div>
    </div>
  );
}

/**
 * Componente de loading state genérico
 */
interface LoadingStateProps {
  isLoading: boolean;
  children: React.ReactNode;
  skeleton?: React.ReactNode;
  error?: Error | null;
  onRetry?: () => void;
}

export function LoadingState({
  isLoading,
  children,
  skeleton,
  error,
  onRetry
}: LoadingStateProps) {
  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-800 font-medium">Error al cargar datos</p>
        <p className="text-red-600 text-sm mt-1">{error.message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-2 text-sm text-red-700 underline hover:text-red-900"
          >
            Reintentar
          </button>
        )}
      </div>
    );
  }

  if (isLoading) {
    return skeleton ? (
      <>{skeleton}</>
    ) : (
      <div className="flex items-center justify-center p-8">
        <Spinner size="lg" />
      </div>
    );
  }

  return <>{children}</>;
}

export default Skeleton;
