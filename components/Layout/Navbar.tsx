import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import Link from "next/link";
import Logo from "@/components/Layout/Logo";

// Importamos los componentes modulares
import TopBar from "./Navbar/TopBar";
import NavLinks from "./Navbar/NavLinks";
import AuthButtons from "./Navbar/AuthButtons";
import MobileMenu from "./Navbar/MobileMenu";
import MobileOverlay from "./Navbar/MobileOverlay";

/**
 * Navbar principal de la aplicación Club ViveVerde
 *
 * Este componente incluye:
 * - TopBar: Barra verde superior con información de contacto (FIJA)
 * - Navbar: Menú de navegación principal (FIJA debajo de TopBar)
 *
 * AMBOS elementos están BLOQUEADOS mediante CSS con !important
 * para garantizar que permanezcan constantes en todas las pantallas.
 */
const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const router = useRouter();

  const isAdminRoute = router.pathname.startsWith("/admin");
  const isOnDashboard = router.pathname.startsWith("/dashboard");

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);

    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setIsLoggedIn(true);
        setUserRole(data.user?.role || "");
      } else {
        setIsLoggedIn(false);
        setUserRole("");
      }
    } catch (error) {
      console.error("Error al verificar autenticación:", error);
      setIsLoggedIn(false);
      setUserRole("");
    }
  };

  useEffect(() => {
    checkAuth();

    const handleRouteChange = () => {
      checkAuth();
    };

    router.events.on("routeChangeComplete", handleRouteChange);

    return () => {
      router.events.off("routeChangeComplete", handleRouteChange);
    };
  }, [router]);

  const handleLogout = async () => {
    try {
      // Limpiar el estado del menú móvil antes de cerrar sesión
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('mobileMenuIsInAdminMenu');
        sessionStorage.removeItem('mobileMenuIsInMarketingMenu');
        sessionStorage.removeItem('soportePreviousPage');
      }
      
      setIsLoggedIn(false);
      setUserRole("");

      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        router.push("/");
      } else {
        console.error("Error al cerrar sesión");
      }
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Verificar si el usuario tiene rol de administrador o cajero
  const isAdmin =
    userRole?.toLowerCase() === "administrador" ||
    userRole?.toLowerCase() === "admin" ||
    userRole?.toLowerCase() === "cajero";

  // Verificar si el usuario es solo administrador (no cajero)
  const isAdminOnly =
    userRole?.toLowerCase() === "administrador" ||
    userRole?.toLowerCase() === "admin";

  // Verificar si el usuario es de marketing
  const isMarketing = userRole?.toLowerCase() === "marketing";

  // Verificar si el usuario es solo cajero
  const isCajero = userRole?.toLowerCase() === "cajero";

  return (
    <>
      {/* Barra superior - BLOQUEADA mediante CSS con !important */}
      {/* position: fixed, z-index: 99999 */}
      <TopBar isAdminRoute={isAdminRoute} />

      {/* Barra de navegación principal - BLOQUEADA mediante CSS con !important */}
      {/* position: fixed, z-index: 9998 */}
      <motion.div
        // Usamos app-navbar que tiene estilos bloqueados en globals.css
        // La clase adicional solo añade estilos específicos del componente
        className={`navbar app-navbar ${isAdminRoute ? 'admin-navbar-mode' : ''}`}
      >
        <div className="relative mx-auto p-2 flex items-center justify-between md:justify-between">
          {/* Botón de menú móvil */}
          <motion.button
            onClick={toggleMenu}
            className="menu-button md:hidden text-2xl bg-green-50 p-2 rounded-full z-20 absolute right-2"
            aria-label="Abrir menú"
          >
            <i className={`fa-solid ${isMenuOpen ? "fa-times" : "fa-bars"}`}></i>
          </motion.button>

          {/* Logo - Centrado en móvil */}
          <motion.div
            className="z-10 flex items-center md:items-start"
          >
            <Logo />
          </motion.div>

          {/* Links de navegación (escritorio) */}
          <NavLinks
            isAdmin={isAdmin}
            isAdminOnly={isAdminOnly}
            isMarketing={isMarketing}
            isLoggedIn={isLoggedIn}
          />

          {/* Menú móvil */}
          <MobileMenu
            isMenuOpen={isMenuOpen}
            isAdmin={isAdmin}
            isAdminOnly={isAdminOnly}
            isMarketing={isMarketing}
            isCajero={isCajero}
            isLoggedIn={isLoggedIn}
            isOnDashboard={isOnDashboard}
            handleLogout={handleLogout}
            onClose={() => setIsMenuOpen(false)}
          />

          {/* Botones de contacto y autenticación (escritorio) */}
          <div className="hidden md:flex space-x-2 lg:space-x-4 items-center">
            <Link href="/soporte">
              <motion.button
                onClick={() => {
                  // Guardar la página correcta según el tipo de usuario
                  if (typeof window !== 'undefined') {
                    if (isAdminOnly) {
                      // Si es administrador, guardar Panel de Control
                      sessionStorage.setItem('soportePreviousPage', '/admin/dashboard');
                    } else if (isAdmin && !isAdminOnly) {
                      // Si es cajero, guardar Panel de Cajero
                      sessionStorage.setItem('soportePreviousPage', '/teller');
                    } else if (isMarketing) {
                      // Si es marketing, guardar Panel de Marketing
                      sessionStorage.setItem('soportePreviousPage', '/marketing');
                    } else {
                      // Para usuarios normales, guardar Puntos de Fidelidad
                      sessionStorage.setItem('soportePreviousPage', '/puntos-fidelidad');
                    }
                  }
                }}
                className="bg-green-800 px-4 py-2 rounded-full text-white font-bold flex justify-center items-center hover:bg-green-700 transition duration-300 ease-in-out text-sm"
              >
                <i className="fa-solid fa-envelope"></i>
                <span className="ml-2">Soporte</span>
              </motion.button>
            </Link>

            <AuthButtons
              isLoggedIn={isLoggedIn}
              isOnDashboard={isOnDashboard}
              handleLogout={handleLogout}
              userRole={userRole}
            />
          </div>
        </div>
      </motion.div>

      {/* Overlay para menú móvil */}
      <MobileOverlay
        isMenuOpen={isMenuOpen}
        isMobile={isMobile}
        onClose={() => setIsMenuOpen(false)}
      />
    </>
  );
};

export default Navbar;