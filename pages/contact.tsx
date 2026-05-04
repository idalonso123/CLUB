import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { SITE_CONFIG, COMPANY_CONFIG } from '@/lib/config';

export default function Contact() {
  const router = useRouter();

  useEffect(() => {
    // Redirigir a la página de contacto externa
    window.location.href = SITE_CONFIG.external.contactPage;
  }, []);

  return (
    <>
      <Head>
        <title>Contacto - {COMPANY_CONFIG.name}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f3f4f6',
        padding: '20px'
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '10px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          padding: '40px',
          maxWidth: '450px',
          width: '100%',
          textAlign: 'center'
        }}>
          <div style={{
            marginBottom: '20px',
            display: 'flex',
            justifyContent: 'center'
          }}>
            <img 
              src="/icons/Logo-ViveVerde.png" 
              alt={COMPANY_CONFIG.name} 
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
            {COMPANY_CONFIG.name}
          </h1>

          <p style={{
            color: '#6b7280',
            fontSize: '16px',
            marginBottom: '20px'
          }}>
            Redirigiendo a la página de contacto...
          </p>

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
            color: '#9ca3af',
            fontSize: '14px'
          }}>
            Si no eres redirigido automáticamente,{' '}
            <a 
              href={SITE_CONFIG.external.contactPage}
              style={{
                color: '#166534',
                textDecoration: 'underline'
              }}
            >
              haz clic aquí
            </a>
          </p>
        </div>

        <style jsx global>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </>
  );
}
