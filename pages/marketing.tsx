import React, { useState, useEffect } from "react";
import Head from "next/head";
import LoadingSpinner from "@/components/Common/LoadingSpinner";
import MarketingDashboard from "@/components/Marketing/MarketingDashboard";

const MarketingPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  // Verificación de rol (admin, administrador o marketing)
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
          (profile.user.role === "admin" ||
            profile.user.role === "administrador" ||
            profile.user.role === "marketing")
        ) {
          setIsAuthorized(true);
          setUserRole(profile.user.role);
        } else {
          throw new Error("No autorizado");
        }
      } catch {
        setIsAuthorized(false);
      } finally {
        setIsLoading(false);
      }
    };
    checkPermission();
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner size="lg" message="Cargando..." />
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="max-w-xl mx-auto mt-20 text-center">
        <Head>
          <title>Marketing - Club ViveVerde</title>
          <meta
            name="description"
            content="Accede a tu cuenta de Club ViveVerde para acceder a esta sección."
          />
        </Head>
        <h1 className="text-2xl font-bold mb-4 text-red-700">Acceso restringido</h1>
        <p>Solo administradores o usuarios de marketing pueden acceder a esta sección.</p>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Marketing - Club ViveVerde</title>
        <meta
          name="description"
          content="Gestiona tus campañas de email marketing, plantillas y automatizaciones desde el panel de marketing."
        />
      </Head>
      <MarketingDashboard userRole={userRole} />
    </>
  );
};

export default MarketingPage;
