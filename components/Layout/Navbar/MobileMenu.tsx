import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import NavLinks from "./NavLinks";
import AuthButtons from "./AuthButtons";
import { useRouter } from "next/router";

interface MobileMenuProps {
  isMenuOpen: boolean;
  isAdmin: boolean;
  isAdminOnly: boolean;
  isMarketing?: boolean;
  isCajero?: boolean;
  isLoggedIn: boolean;
  isOnDashboard: boolean;
  handleLogout: () => Promise<void>;
  onClose: () => void;
}

const MobileMenu: React.FC<MobileMenuProps> = ({
  isMenuOpen,
  isAdmin,
  isAdminOnly,
  isMarketing = false,
  isCajero = false,
  isLoggedIn,
  isOnDashboard,
  handleLogout,
  onClose
}) => {
  const router = useRouter();
  const [isInAdminMenu, setIsInAdminMenu] = useState(false);
  const [isInMarketingMenu, setIsInMarketingMenu] = useState(false);

  // Detectar si estamos en la página de marketing
  const isOnMarketingPage = router.pathname.startsWith("/marketing");

  // Detectar si estamos en la página de soporte
  const isOnSupportPage = router.pathname.startsWith("/soporte");

  // Detectar si estamos específicamente en /admin/dashboard (Panel Principal)
  const isOnAdminDashboard = router.pathname === "/admin/dashboard";

  // Detectar si estamos en cualquier otra página del Panel Administrativo (NO es dashboard)
  // Incluye: /admin/users, /admin/rewards, /admin/mainpage, /admin/logs, /admin/analytics, /admin/backup
  const isOnOtherAdminPage = router.pathname.startsWith("/admin") && !isOnAdminDashboard;

  // Estado para rastrear si el menú ya ha mostrado el submenú en esta apertura
  const [hasShownSubmenu, setHasShownSubmenu] = useState(false);

  // Obtener la página anterior guardada cuando venimos de soporte
  const getPreviousPage = () => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('soportePreviousPage') || '/';
    }
    return '/';
  };

  // Al montar el componente, restaurar el estado desde sessionStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedAdminMenu = sessionStorage.getItem('mobileMenuIsInAdminMenu');
      const savedMarketingMenu = sessionStorage.getItem('mobileMenuIsInMarketingMenu');
      const cameFromAdminButton = sessionStorage.getItem('cameFromAdminButton');
      
      if (savedAdminMenu === 'true') {
        setIsInAdminMenu(true);
      }
      if (savedMarketingMenu === 'true') {
        setIsInMarketingMenu(true);
      }
      
      // Si viene del botón "Panel Administrativo" en MobileMenu, mostrar SIDEBAR
      // Esto aplica cuando acaba de navegar desde MobileMenu a una página del admin
      if (cameFromAdminButton === 'true') {
        setIsInAdminMenu(true);
        setHasShownSubmenu(true);
        // Limpiar el flag
        sessionStorage.removeItem('cameFromAdminButton');
      }
    }
  }, []); // Solo se ejecuta al montar el componente

  // Cuando estamos en /admin/dashboard (Panel Principal), NO mostrar SIDEBAR
  // Mostrar MobileMenu normal
  useEffect(() => {
    if (isOnAdminDashboard && isAdminOnly) {
      setIsInAdminMenu(false);
    }
  }, [isOnAdminDashboard, isAdminOnly]);

  // Cuando estamos en otra página del admin (NO dashboard), mostrar SIDEBAR
  useEffect(() => {
    if (isOnOtherAdminPage && isAdminOnly) {
      setIsInAdminMenu(true);
      setHasShownSubmenu(true);
    }
  }, [isOnOtherAdminPage, isAdminOnly]);

  // Cuando se abre el menú y estamos en la página de marketing, mostrar submenú de marketing
  useEffect(() => {
    if (isMenuOpen && isOnMarketingPage) {
      setIsInMarketingMenu(true);
      setHasShownSubmenu(true);
    }
  }, [isMenuOpen, isOnMarketingPage]);

  // Cuando se abre el menú y NO estamos en marketing, soporte ni páginas del admin
  // resetear submenús para mostrar el menú principal completo
  useEffect(() => {
    if (isMenuOpen && !isOnMarketingPage && !isOnSupportPage && !router.pathname.startsWith("/admin")) {
      if (!hasShownSubmenu) {
        if (!isMarketing) {
          setIsInMarketingMenu(false);
          setIsInAdminMenu(false);
          
          if (typeof window !== 'undefined') {
            sessionStorage.removeItem('mobileMenuIsInAdminMenu');
            sessionStorage.removeItem('mobileMenuIsInMarketingMenu');
            sessionStorage.removeItem('cameFromAdminButton');
          }
        } else {
          setIsInMarketingMenu(true);
          setIsInAdminMenu(false);
          setHasShownSubmenu(true);
        }
      }
    }
  }, [isMenuOpen, isOnMarketingPage, isOnSupportPage, isMarketing, hasShownSubmenu, router.pathname]);

  // Cuando el usuario entra en el submenú de admin, marcar que ha mostrado un submenú
  useEffect(() => {
    if (isInAdminMenu) {
      setHasShownSubmenu(true);
    }
  }, [isInAdminMenu]);

  // Cuando el usuario entra en el submenú de marketing, marcar que ha mostrado un submenú
  useEffect(() => {
    if (isInMarketingMenu) {
      setHasShownSubmenu(true);
    }
  }, [isInMarketingMenu]);

  // Resetear el indicador cuando el menú se cierra completamente
  useEffect(() => {
    if (!isMenuOpen) {
      setHasShownSubmenu(false);
    }
  }, [isMenuOpen]);

  // Guardar el estado del sidebar cuando cambia
  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('mobileMenuIsInAdminMenu', isInAdminMenu.toString());
      sessionStorage.setItem('mobileMenuIsInMarketingMenu', isInMarketingMenu.toString());
    }
  }, [isInAdminMenu, isInMarketingMenu]);

  // NO resetear los submenús cuando se cierra el menú
  // El estado se mantiene en sessionStorage para que al reabrir el menú permanezca en el sidebar

  // Animación para el sidebar (exactamente igual que Sidebar.tsx del admin)
  // El menú se desliza desde el lado izquierdo de la pantalla hacia la derecha
  const sidebarVariants = {
    hidden: { x: -300, opacity: 0 },
    visible: { 
      x: 0, 
      opacity: 1,
      transition: { 
        duration: 0.5, 
        type: "spring" as const, 
        stiffness: 100 
      }
    }
  };

  // Determinar el título del menú según el submenú activo
  const getMenuTitle = () => {
    if (isInMarketingMenu) {
      return 'Menú de Marketing';
    }
    if (isInAdminMenu) {
      return 'Panel Administrativo';
    }
    if (isOnSupportPage) {
      return 'Centro de Ayuda';
    }
    if (isLoggedIn) {
      if (isAdminOnly) {
        return 'Menú de Administrador';
      }
      if (isCajero) {
        return 'Menú de Cajero';
      }
      if (isMarketing) {
        return 'Menú de Marketing';
      }
      return 'Menú de Usuario';
    }
    return 'Menú Principal';
  };

  // Determinar si mostrar el botón "Volver al Menú"
  // Mostrar si estamos en el submenú de admin Y NO estamos en marketing ni en soporte
  const showBackButton = isInAdminMenu && !isOnMarketingPage && !isOnSupportPage;

  // Determinar si mostrar el botón "Volver" para soporte
  const showSupportBackButton = isOnSupportPage;

  return (
    <AnimatePresence>
      {/* Sidebar móvil (exactamente igual que Sidebar.tsx del admin) */}
      {/* Se desliza horizontalmente desde el lado izquierdo hacia la derecha */}
      {isMenuOpen && (
        <motion.div 
          className="bg-green-900 text-white shadow-lg h-screen z-40 overflow-y-auto fixed top-0 left-0 w-64 md:hidden"
          variants={sidebarVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
        >
          {/* Título del menú */}
          <div className="p-4 text-center border-b border-green-700">
            <h1 className="text-xl font-bold">{getMenuTitle()}</h1>
            <div className="text-gray-400 text-sm mt-1">
              Club ViveVerde
            </div>
          </div>
          
          {/* Botón para volver al menú principal (solo en modo admin y NO en marketing) */}
          {showBackButton && (
            <div className="p-2 border-b border-green-700">
              <motion.button
                onClick={() => {
                  if (isInAdminMenu) {
                    setIsInAdminMenu(false);
                  }
                  if (isInMarketingMenu) {
                    setIsInMarketingMenu(false);
                  }
                }}
                className="w-full text-left py-2 px-4 flex items-center hover:bg-green-800 transition-colors duration-200"
              >
                <i className="fas fa-arrow-left mr-3 w-5 text-center"></i>
                <span>Volver al Menú</span>
              </motion.button>
            </div>
          )}

          {/* Botón para volver a la página anterior (solo cuando estamos en soporte) */}
          {showSupportBackButton && (
            <div className="p-2 border-b border-green-700">
              <motion.button
                onClick={() => {
                  const previousPage = getPreviousPage();
                  router.push(previousPage);
                  onClose();
                }}
                className="w-full text-left py-2 px-4 flex items-center hover:bg-green-800 transition-colors duration-200"
              >
                <i className="fas fa-arrow-left mr-3 w-5 text-center"></i>
                <span>Volver</span>
              </motion.button>
            </div>
          )}
          
          {/* Navegación - Enlaces de navegación */}
          <nav className="mt-2">
            <ul className="space-y-1">
              {/* Enlaces de navegación móvil */}
              <li>
                <NavLinks 
                  isAdmin={isAdmin} 
                  isAdminOnly={isAdminOnly} 
                  isMarketing={isMarketing}
                  isMobile={true} 
                  isLoggedIn={isLoggedIn} 
                  closeMenu={onClose}
                  isInAdminMenu={isInAdminMenu}
                  setIsInAdminMenu={setIsInAdminMenu}
                  isInMarketingMenu={isInMarketingMenu}
                  setIsInMarketingMenu={setIsInMarketingMenu}
                  handleLogout={handleLogout}
                />
              </li>
            </ul>
          </nav>
          
          {/* Botones de autenticación (solo si no está en modo admin, marketing o soporte) */}
          {!isInAdminMenu && !isInMarketingMenu && !isOnSupportPage && (
            <div className="p-4">
              <AuthButtons 
                isLoggedIn={isLoggedIn} 
                isOnDashboard={isOnDashboard} 
                handleLogout={handleLogout}
                isMobile={true}
                closeMenu={onClose}
              />
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MobileMenu;
