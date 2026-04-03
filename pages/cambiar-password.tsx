'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Head from 'next/head';

const CambiarPasswordPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);

  // Validar el token al cargar la página
  useEffect(() => {
    if (!token) {
      setIsValidToken(false);
    } else {
      setIsValidToken(true);
    }
  }, [token]);

  // Validar requisitos de contraseña
  const validatePassword = (pwd: string): string[] => {
    const errors: string[] = [];
    if (pwd.length < 8) {
      errors.push('La contraseña debe tener al menos 8 caracteres');
    }
    if (!/[A-Z]/.test(pwd)) {
      errors.push('Debe contener al menos una mayúscula');
    }
    if (!/[a-z]/.test(pwd)) {
      errors.push('Debe contener al menos una minúscula');
    }
    if (!/[0-9]/.test(pwd)) {
      errors.push('Debe contener al menos un número');
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) {
      errors.push('Debe contener al menos un carácter especial');
    }
    return errors;
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    setPasswordErrors(validatePassword(newPassword));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validaciones básicas
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (passwordErrors.length > 0) {
      setError('Por favor, cumple todos los requisitos de la contraseña');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token,
          newPassword: password
        })
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        // Redirigir al login después de 3 segundos
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } else {
        let errorMsg = data.message || 'Error al restablecer la contraseña';
        
        // Mostrar detalles del error para diagnóstico
        if (process.env.NODE_ENV === 'development' && data.error) {
          errorMsg += `\n\nDetalles técnicos:\n${data.error}`;
        }
        
        setError(errorMsg);
      }
    } catch (err) {
      setError('Error de conexión. Por favor, inténtalo más tarde.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring' as const, stiffness: 300, damping: 24, staggerChildren: 0.07 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 100 } }
  };

  // Estado de carga inicial
  if (isValidToken === null) {
    return (
      <div className="flex flex-col items-center justify-center mt-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
        <p className="mt-4 text-gray-600">Verificando enlace...</p>
      </div>
    );
  }

  // Token inválido o ausente
  if (!isValidToken) {
    return (
      <>
        <Head>
          <title>Enlace Inválido - Club ViveVerde</title>
        </Head>
        <div className="flex flex-col items-center mt-20">
          <motion.div
            className="w-full max-w-md mx-auto p-6 sm:p-8 bg-white rounded-lg shadow-md border border-gray-200"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={itemVariants} className="text-center mb-6">
              <div className="flex justify-center mb-4">
                <div className="bg-red-100 rounded-full p-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              </div>
              <h2 className="text-2xl font-semibold text-red-800 mb-2">Enlace Inválido</h2>
              <p className="text-gray-600">
                El enlace de restablecimiento no es válido o ha expirado.
              </p>
            </motion.div>

            <motion.div variants={itemVariants} className="text-center">
              <Link
                href="/reset-password"
                className="inline-block px-6 py-3 bg-green-800 text-white rounded-md hover:bg-green-900 transition-colors"
              >
                Solicitar nuevo enlace
              </Link>
            </motion.div>

            <motion.div variants={itemVariants} className="text-center mt-4">
              <Link
                href="/login"
                className="text-green-800 hover:underline hover:text-green-900 transition-colors"
              >
                Volver a inicio de sesión
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </>
    );
  }

  // Éxito
  if (success) {
    return (
      <>
        <Head>
          <title>Contraseña Actualizada - Club ViveVerde</title>
        </Head>
        <div className="flex flex-col items-center mt-20">
          <motion.div
            className="w-full max-w-md mx-auto p-6 sm:p-8 bg-white rounded-lg shadow-md border border-gray-200"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="bg-green-100 rounded-full p-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <h2 className="text-2xl font-semibold text-green-800 mb-2">¡Contraseña Actualizada!</h2>
              <p className="text-gray-600 mb-6">
                Tu contraseña ha sido cambiada correctamente.
              </p>
              <p className="text-sm text-gray-500 mb-6">
                Serás redirigido al inicio de sesión en unos segundos...
              </p>
              <Link
                href="/login"
                className="inline-block px-6 py-3 bg-green-800 text-white rounded-md hover:bg-green-900 transition-colors"
              >
                Ir a inicio de sesión
              </Link>
            </div>
          </motion.div>
        </div>
      </>
    );
  }

  // Formulario de nueva contraseña
  return (
    <>
      <Head>
        <title>Nueva Contraseña - Club ViveVerde</title>
      </Head>
      <div className="flex flex-col items-center mt-20">
        <motion.div
          className="w-full max-w-md mx-auto p-6 sm:p-8 bg-white rounded-lg shadow-md border border-gray-200"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants} className="text-center mb-6">
            <h2 className="text-2xl font-semibold text-green-800">Nueva Contraseña</h2>
            <p className="mt-2 text-gray-600 text-sm">
              Introduce tu nueva contraseña a continuación.
            </p>
          </motion.div>

          <motion.form
            onSubmit={handleSubmit}
            className="space-y-4"
            variants={itemVariants}
          >
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Nueva Contraseña
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={handlePasswordChange}
                placeholder="Mínimo 8 caracteres"
                required
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:outline-none"
                disabled={isSubmitting}
              />
              {password.length > 0 && passwordErrors.length > 0 && (
                <div className="mt-2 p-2 bg-red-50 rounded-md border border-red-100">
                  <p className="text-xs text-red-700 font-medium mb-1">La contraseña debe cumplir:</p>
                  <ul className="text-xs text-red-600 space-y-0.5">
                    {passwordErrors.map((err, idx) => (
                      <li key={idx}>• {err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirmar Contraseña
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repite la contraseña"
                required
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:outline-none"
                disabled={isSubmitting}
              />
            </div>

            {error && (
              <motion.div
                className="p-3 bg-red-50 text-red-700 text-sm rounded-md whitespace-pre-wrap"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <p className="font-medium">Error:</p>
                <p>{error}</p>
              </motion.div>
            )}

            <motion.button
              type="submit"
              className="w-full p-3 bg-green-800 text-white rounded-md hover:bg-green-900 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
              disabled={isSubmitting || password.length === 0 || confirmPassword.length === 0}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Guardando...
                </span>
              ) : (
                'Guardar Nueva Contraseña'
              )}
            </motion.button>

            <motion.div
              className="text-center mt-2 text-sm"
              variants={itemVariants}
            >
              <Link
                href="/login"
                className="text-green-800 hover:underline hover:text-green-900 transition-colors"
              >
                Volver a inicio de sesión
              </Link>
            </motion.div>
          </motion.form>
        </motion.div>
      </div>
    </>
  );
};

export default CambiarPasswordPage;