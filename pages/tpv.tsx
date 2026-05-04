import React, { useState, useEffect } from "react";
import Head from "next/head";
import LoadingSpinner from "@/components/Common/LoadingSpinner";
import TellerDashboard from "@/components/Teller/dashboard";
import TPVSetup from "@/components/Teller/TPVSetup";

interface TPVPageProps {}

const TPVPage: React.FC<TPVPageProps> = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [protocolRegistered, setProtocolRegistered] = useState(false);
  const [isCheckingProtocol, setIsCheckingProtocol] = useState(true);

  // Verificar si el protocolo clubviveverde:// está registrado en el navegador
  const checkProtocolInBrowser = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (typeof window === 'undefined') {
        resolve(false);
        return;
      }

      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = 'clubviveverde://status';
      
      let timeoutId: NodeJS.Timeout;
      let resolved = false;
      
      const cleanup = () => {
        if (timeoutId) clearTimeout(timeoutId);
        if (iframe.parentNode) {
          iframe.parentNode.removeChild(iframe);
        }
      };
      
      const handleResult = (registered: boolean) => {
        if (resolved) return;
        resolved = true;
        cleanup();
        setIsCheckingProtocol(false);
        resolve(registered);
      };
      
      // Timeout de 2 segundos para detectar que el protocolo no está registrado
      timeoutId = setTimeout(() => {
        handleResult(false);
      }, 2000);
      
      iframe.onload = () => {
        handleResult(true);
      };
      
      iframe.onerror = () => {
        handleResult(false);
      };
      
      document.body.appendChild(iframe);
    });
  };

  // Verificación de rol (solo cajeros con versión TPV)
  useEffect(() => {
    const checkPermission = async () => {
      try {
        const resp = await fetch("/api/auth/refresh", { method: "POST" });
        if (!resp.ok) throw new Error("No autorizado");
        const profileResp = await fetch("/api/user/profile");
        if (!profileResp.ok) throw new Error("No autorizado");
        const profile = await profileResp.json();
        if (
          profile.success &&
          profile.user &&
          profile.user.role === "cajero" &&
          profile.user.cajero_version === "tpv"
        ) {
          setIsAuthorized(true);
          setUserRole(profile.user.role);
        } else {
          throw new Error("No autorizado - Se requiere acceso TPV");
        }
      } catch {
        setIsAuthorized(false);
      } finally {
        setIsLoading(false);
      }
    };
    checkPermission();
  }, []);

  // Verificar protocolo en el navegador después de verificar permisos
  useEffect(() => {
    if (!isAuthorized || isLoading) return;

    const verifyProtocol = async () => {
      setIsCheckingProtocol(true);
      const registered = await checkProtocolInBrowser();
      setProtocolRegistered(registered);
    };

    verifyProtocol();
  }, [isAuthorized, isLoading]);

  const handleSetupComplete = () => {
    // Cuando la instalación se completa, verificar de nuevo el protocolo
    setIsCheckingProtocol(true);
    checkProtocolInBrowser().then((registered) => {
      setProtocolRegistered(registered);
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100">
        <LoadingSpinner size="lg" message="Cargando TPV..." />
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="max-w-xl mx-auto mt-20 text-center">
        <Head>
          <title>TPV - Club ViveVerde</title>
          <meta
            name="description"
            content="Acceso restringido al sistema TPV de Club ViveVerde."
          />
        </Head>
        <h1 className="text-2xl font-bold mb-4 text-red-700">Acceso restringido</h1>
        <p>Solo cajeros con versión TPV pueden acceder a esta sección.</p>
        <p className="text-sm text-gray-500 mt-2">
          Si crees que esto es un error, contacta con el administrador.
        </p>
      </div>
    );
  }

  // Si estamos verificando el protocolo, mostrar pantalla de carga
  if (isCheckingProtocol) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-green-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl text-gray-700">Verificando sistema...</p>
          <p className="text-sm text-gray-500 mt-2">Comprobando instalación de la aplicación</p>
        </div>
      </div>
    );
  }

  // Mostrar pantalla de configuración si el protocolo NO está registrado
  if (!protocolRegistered) {
    return (
      <>
        <Head>
          <title>Configuración TPV - Club ViveVerde</title>
        </Head>
        <TPVSetup onSetupComplete={handleSetupComplete} />
      </>
    );
  }

  // Protocolo registrado - mostrar TPV dashboard
  return (
    <>
      <Head>
        <title>TPV - Club ViveVerde</title>
        <meta
          name="description"
          content="Sistema TPV para cajeros de Club ViveVerde."
        />
      </Head>
      <TellerDashboard userRole={userRole} isTPV={true} />
    </>
  );
};

export default TPVPage;