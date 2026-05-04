import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function VerifyEmail() {
  const router = useRouter();
  const { token } = router.query;
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [showResend, setShowResend] = useState(false);
  const [email, setEmail] = useState('');
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  useEffect(() => {
    if (token && typeof token === 'string') {
      verifyToken(token);
    }
  }, [token]);

  const verifyToken = async (tokenString: string) => {
    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: tokenString }),
      });

      const data = await response.json();

      if (data.success) {
        setStatus('success');
        setMessage(data.message);
      } else {
        setStatus('error');
        setMessage(data.message);
        
        // Mostrar opción de reenviar para cualquier error de verificación
        setShowResend(true);
      }
    } catch (error) {
      setStatus('error');
      setMessage('Error al verificar el email. Por favor intenta de nuevo.');
    }
  };

  const handleResend = async () => {
    if (!email) {
      setMessage('Por favor ingresa tu email');
      return;
    }

    setResending(true);
    try {
      const response = await fetch('/api/auth/send-verification-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        setResendSuccess(true);
        setMessage('Email de verificación enviado. Revisa tu bandeja de entrada.');
      } else {
        setMessage(data.message);
      }
    } catch (error) {
      setMessage('Error al enviar el email. Por favor intenta de nuevo.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f3f4f6',
      padding: '20px'
    }}>
      <Head>
        <title>Verificar Email - Club ViveVerde</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      <div style={{
        backgroundColor: 'white',
        borderRadius: '10px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        padding: '40px',
        maxWidth: '450px',
        width: '100%',
        textAlign: 'center'
      }}>
        {/* Logo - Mariposa */}
        <div style={{
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'center'
        }}>
          <img 
            src="/icons/Logo-ViveVerde.png" 
            alt="Club ViveVerde" 
            width={80} 
            height={80}
            style={{ objectFit: 'contain' }}
          />
        </div>

        <h1 style={{
          fontSize: '24px',
          fontWeight: 'bold',
          color: '#166534',
          marginBottom: '10px'
        }}>
          Club ViveVerde
        </h1>

        {status === 'loading' && (
          <>
            <div style={{
              margin: '20px 0',
              display: 'flex',
              justifyContent: 'center'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                border: '4px solid #e5e7eb',
                borderTop: '4px solid #166534',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
                }}></div>
            </div>
            <p style={{
              color: '#6b7280',
              fontSize: '16px'
            }}>
              Verificando tu email...
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div style={{
              margin: '20px 0',
              display: 'flex',
              justifyContent: 'center'
            }}>
              <svg 
                width="80" 
                height="80" 
                viewBox="0 0 100 100" 
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="50" cy="50" r="45" fill="#166534"/>
                <path d="M30 50L45 65L70 35" stroke="white" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <p style={{
              color: '#166534',
              fontSize: '18px',
              fontWeight: '600',
              marginBottom: '10px'
            }}>
              ¡Email verificado!
            </p>
            <p style={{
              color: '#6b7280',
              fontSize: '14px',
              marginBottom: '20px'
            }}>
              {message}
            </p>
            <Link 
              href="/login"
              style={{
                display: 'inline-block',
                backgroundColor: '#166534',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '5px',
                textDecoration: 'none',
                fontWeight: '600',
                fontSize: '14px'
              }}
            >
              Ir a iniciar sesión
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div style={{
              margin: '20px 0',
              display: 'flex',
              justifyContent: 'center'
            }}>
              <svg 
                width="60" 
                height="60" 
                viewBox="0 0 24 24" 
                fill="none"
                stroke="#ef4444"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
            </div>
            <p style={{
              color: '#dc2626',
              fontSize: '18px',
              fontWeight: '600',
              marginBottom: '10px'
            }}>
              Error de verificación
            </p>
            <p style={{
              color: '#6b7280',
              fontSize: '14px',
              marginBottom: '20px'
            }}>
              {message}
            </p>
            
            {showResend && !resendSuccess && (
              <div style={{
                marginTop: '20px',
                padding: '15px',
                backgroundColor: '#f9fafb',
                borderRadius: '5px',
                textAlign: 'left'
              }}>
                <p style={{
                  color: '#374151',
                  fontSize: '14px',
                  marginBottom: '10px'
                }}>
                  ¿No recibiste el email? Ingresa tu dirección de correo para recibir un nuevo enlace de verificación.
                </p>
                <input
                  type="email"
                  placeholder="Tu email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #d1d5db',
                    borderRadius: '5px',
                    fontSize: '14px',
                    marginBottom: '10px',
                    boxSizing: 'border-box'
                  }}
                />
                <button
                  onClick={handleResend}
                  disabled={resending}
                  style={{
                    width: '100%',
                    backgroundColor: '#166534',
                    color: 'white',
                    padding: '10px',
                    border: 'none',
                    borderRadius: '5px',
                    fontWeight: '600',
                    fontSize: '14px',
                    cursor: resending ? 'not-allowed' : 'pointer',
                    opacity: resending ? 0.7 : 1
                  }}
                >
                  {resending ? 'Enviando...' : 'Reenviar email de verificación'}
                </button>
              </div>
            )}
            
            {resendSuccess && (
              <div style={{
                marginTop: '20px',
                padding: '15px',
                backgroundColor: '#dcfce7',
                borderRadius: '5px'
              }}>
                <p style={{
                  color: '#166534',
                  fontSize: '14px'
                }}>
                  ¡Email enviado! Revisa tu bandeja de entrada.
                </p>
              </div>
            )}
            
            {!showResend && !resendSuccess && (
              <Link 
                href="/login"
                style={{
                  display: 'inline-block',
                  marginTop: '20px',
                  color: '#166534',
                  textDecoration: 'underline',
                  fontSize: '14px'
                }}
              >
                Volver al inicio de sesión
              </Link>
            )}
          </>
        )}
      </div>

      <style jsx global>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}