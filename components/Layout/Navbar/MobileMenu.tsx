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
  const pathname = router.pathname;
  
  // Estado para saber si el usuario ha seleccionado "Panel Administrativo" desde el menú
  const [hasSelectedAdminMenu, setHasSelectedAdminMenu] = useState(false);
  
  // Estado para saber si el usuario viene del menú de marketing
  const [cameFromMarketing, setCameFromMarketing] = useState(false);
  
  // Estado para saber si el usuario ha seleccionado "Menú de Cajero" desde el menú
  const [hasSelectedTellerMenu, setHasSelectedTellerMenu] = useState(false);
  
  // Leer el estado de sessionStorage cuando se abre el menú
  useEffect(() => {
    if (isMenuOpen && typeof window !== 'undefined') {
      const marketingFromSession = sessionStorage.getItem('cameFromMarketingMenu');
      setCameFromMarketing(marketingFromSession === 'true');
      
      // Leer si el usuario vino del menú de cajero
      const tellerFromSession = sessionStorage.getItem('cameFromTellerMenu');
      setHasSelectedTellerMenu(tellerFromSession === 'true');
    }
  }, [isMenuOpen]);
  
  // Detectar el tipo de menú a mostrar BASADO EN LA URL Y EL ESTADO
  
  const isOnSupportPage = pathname.startsWith("/soporte");
  const isOnMarketingPage = pathname.startsWith("/marketing");
  const isOnAdminDashboard = pathname === "/admin/dashboard";
  const isOnAdminPage = pathname.startsWith("/admin");
  const isOnUserDashboard = pathname.startsWith("/dashboard");
  const isOnTellerPage = pathname === "/teller";
  
  // Determinar qué menú mostrar:
  // 1. Si está en soporte → mostrar menú de soporte
  // 2. Si está en marketing → mostrar SIDEBAR de marketing
  // 3. Si el usuario es cajero (y no es admin-only ni marketing) → mostrar SIDEBAR de cajero SIEMPRE
  // 4. Si está en admin (no dashboard) O ha seleccionado "Panel Administrativo" → mostrar SIDEBAR
  // 5. Si viene del menú de marketing (está en dashboard) Y es usuario de marketing → mostrar SIDEBAR de marketing
  // 6. En todos los demás casos → mostrar menú principal
  const showAdminSidebar = (isOnAdminPage && !isOnAdminDashboard) || hasSelectedAdminMenu;
  const showSupportMenu = isOnSupportPage;
  const showMarketingSidebar = (isOnMarketingPage) || (isOnUserDashboard && cameFromMarketing && isMarketing);
  // Para cajeros, mostrar el menú de cajero SIEMPRE (no cambia según la página)
  // Tambien mostrar si el admin accedio al panel de cajero y esta en el menu de cajero
  const showTellerSidebar = isCajero || isOnTellerPage || hasSelectedTellerMenu;
  
  // Resetear el estado cuando cambia de página o cierra el menú
  const handleNavigationOrClose = () => {
    if (!isOnAdminPage || isOnAdminDashboard) {
      setHasSelectedAdminMenu(false);
    }
  };
  
  // Determinar el título del menú
  const getMenuTitle = () => {
    if (showSupportMenu) {
      return 'Centro de Ayuda';
    }
    if (showMarketingSidebar) {
      return 'Menú de Marketing';
    }
    if (showTellerSidebar) {
      return 'Menú de Cajero';
    }
    if (showAdminSidebar) {
      return 'Panel Administrativo';
    }
    if (isLoggedIn) {
      if (isCajero) {
        return 'Menú de Cajero';
      }
      if (isAdminOnly) {
        return 'Menú de Administrador';
      }
      if (isMarketing) {
        return 'Menú de Marketing';
      }
      return 'Menú de Usuario';
    }
    return 'Menú Principal';
  };

  // Determinar si mostrar botón "Volver al Menú" (solo en Panel Administrativo, NO en Cajero ni Marketing)
  const showBackButton = showAdminSidebar && !isOnMarketingPage;

  // Determinar si mostrar botón "Volver" para soporte
  const showSupportBackButton = showSupportMenu;

  // Obtener la página anterior guardada cuando venimos de soporte
  const getPreviousPage = () => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('soportePreviousPage') || '/';
    }
    return '/';
  };

  // Función para volver al menú principal
  const handleBackToMainMenu = () => {
    setHasSelectedAdminMenu(false);
    setHasSelectedTellerMenu(false);
    // Navegar al dashboard del admin
    router.push('/admin/dashboard');
    onClose();
  };

  // Animación para el sidebar
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

  return (
    <AnimatePresence>
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
          
          {/* Botón para volver al menú principal (cuando está en admin o marketing) */}
          {showBackButton && (
            <div className="p-2 border-b border-green-700">
              <motion.button
                onClick={handleBackToMainMenu}
                className="w-full text-left py-2 px-4 flex items-center hover:bg-green-800 transition-colors duration-200"
              >
                <i className="fas fa-arrow-left mr-3 w-5 text-center"></i>
                <span>Volver al Menú</span>
              </motion.button>
            </div>
          )}

          {/* Botón para volver a la página anterior (cuando está en soporte) */}
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
              <li>
                <NavLinks 
                  isAdmin={isAdmin} 
                  isAdminOnly={isAdminOnly} 
                  isMarketing={isMarketing}
                  isMobile={true} 
                  isLoggedIn={isLoggedIn} 
                  closeMenu={onClose}
                  isInAdminMenu={showAdminSidebar}
                  setIsInAdminMenu={setHasSelectedAdminMenu}
                  isInMarketingMenu={showMarketingSidebar}
                  setIsInMarketingMenu={(value: boolean) => {
                    if (typeof window !== 'undefined') {
                      sessionStorage.setItem('cameFromMarketingMenu', value.toString());
                    }
                    setCameFromMarketing(value);
                  }}
                  isInTellerMenu={showTellerSidebar}
                  setIsInTellerMenu={(value: boolean) => {
                    if (typeof window !== 'undefined') {
                      sessionStorage.setItem('cameFromTellerMenu', value.toString());
                    }
                    setHasSelectedTellerMenu(value);
                  }}
                  handleLogout={handleLogout}
                />
              </li>
            </ul>
          </nav>
          
          {/* Botones de autenticación (solo si no está en admin, marketing, cajero ni soporte) */}
          {!showAdminSidebar && !showMarketingSidebar && !showTellerSidebar && !showSupportMenu && (
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
