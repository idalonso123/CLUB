import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import Logo from "@/components/Layout/Logo";

// Importamos los componentes modulares
import TopBar from "./Navbar/TopBar";
import NavLinks from "./Navbar/NavLinks";
import AuthButtons from "./Navbar/AuthButtons";
import MobileMenu from "./Navbar/MobileMenu";
import MobileOverlay from "./Navbar/MobileOverlay";
import HelpModal from "@/components/Common/HelpModal";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
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

  return (
    <>
      {/* Barra superior */}
      <TopBar isAdminRoute={isAdminRoute} />

      {/* Barra de navegación principal */}
      <motion.div
        className={`navbar bg-white/95 backdrop-blur-sm shadow-md relative ${!isAdminRoute ? 'fixed top-[41px] mb-10 w-full z-30' : 'z-40'}`}
      >
        <div className="relative mx-auto p-4 flex items-center justify-between">
          {/* Logo */}
          <motion.div
            className="z-10 flex items-center"
          >
            <Logo />
          </motion.div>
          
          {/* Botón de menú móvil */}
          <motion.button
            onClick={toggleMenu}
            className="menu-button md:hidden text-2xl bg-green-50 p-2 rounded-full z-20"
            aria-label="Abrir menú"
          >
            <i className={`fa-solid ${isMenuOpen ? "fa-times" : "fa-bars"}`}></i>
          </motion.button>

          {/* Links de navegación (escritorio) */}
          <NavLinks 
            isAdmin={isAdmin}
            isAdminOnly={isAdminOnly}
            isLoggedIn={isLoggedIn} 
            openHelpModal={() => setIsHelpModalOpen(true)} 
          />
          
          {/* Menú móvil */}
          <MobileMenu 
            isMenuOpen={isMenuOpen} 
            isAdmin={isAdmin}
            isAdminOnly={isAdminOnly}
            isLoggedIn={isLoggedIn}
            isOnDashboard={isOnDashboard}
            handleLogout={handleLogout}
            openHelpModal={() => setIsHelpModalOpen(true)}
          />

          {/* Botones de contacto y autenticación (escritorio) */}
          <div className="hidden md:flex space-x-2 lg:space-x-4 items-center">
            <motion.button
              onClick={() => setIsHelpModalOpen(true)}
              className="bg-green-800 px-4 py-2 rounded-full text-white font-bold flex justify-center items-center hover:bg-green-700 transition duration-300 ease-in-out text-sm"
            >
              <i className="fa-solid fa-envelope"></i>
              <span className="ml-2">Soporte</span>
            </motion.button>

            <AuthButtons 
              isLoggedIn={isLoggedIn} 
              isOnDashboard={isOnDashboard}
              handleLogout={handleLogout}
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
      
      {/* Modal de ayuda */}
      <HelpModal 
        isOpen={isHelpModalOpen} 
        onClose={() => setIsHelpModalOpen(false)} 
      />
    </>
  );
};

export default Navbar;