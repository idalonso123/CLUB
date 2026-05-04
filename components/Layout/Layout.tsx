import React from "react";
import Navbar from "@/components/Layout/Navbar";
import RewardNotificationModal from "@/components/Rewards/RewardNotificationModal";
import CarnetNotificationModal from "@/components/Rewards/CarnetNotificationModal";

type LayoutProps = {
  children: React.ReactNode;
};

/**
 * Layout principal de la aplicación Club ViveVerde
 *
 * Este componente envuelve TODAS las páginas de la aplicación y garantiza
 * que el fondo y los headers permanezcan bloqueados y constantes.
 *
 * CARACTERÍSTICAS DE BLOQUEO IMPLEMENTADAS:
 * 1. TopBar (barra verde superior) - FIJA en la parte superior
 * 2. Navbar (menú de navegación) - FIJA debajo de TopBar
 * 3. Fondo de página - SIEMPRE visible con la imagen de footer.jpg
 *
 * Los estilos CSS en globals.css usan !important para prevenir overrides
 * accidentales desde cualquier parte de la aplicación.
 */
const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="app-layout">
      {/* Header bloqueado: Contiene TopBar y Navbar */}
      <header className="app-header">
        <Navbar />
      </header>

      {/* Contenido principal con fondo bloqueado */}
      <main
        className="app-main-content"
        // Los estilos críticos están en CSS para evitar overrides inline
        role="main"
        aria-label="Contenido principal de la aplicación"
      >
        <div className="page-content-wrapper">
          {children}
        </div>
      </main>

      {/* Modal global de notificación de recompensas desbloqueadas */}
      {/* Este modal aparece en cualquier página cuando se desbloquea una recompensa por puntos */}
      <RewardNotificationModal />
      
      {/* Modal global de notificación de recompensas de carnets completados */}
      {/* Este modal aparece cuando el usuario completa un carnet de mascota */}
      <CarnetNotificationModal />
    </div>
  );
};

export default Layout;