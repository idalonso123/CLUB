import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import NavLinks from "./NavLinks";
import AuthButtons from "./AuthButtons";

interface MobileMenuProps {
  isMenuOpen: boolean;
  isAdmin: boolean;
  isAdminOnly: boolean;
  isMarketing?: boolean;
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
  isLoggedIn,
  isOnDashboard,
  handleLogout,
  onClose
}) => {
  const [isInAdminMenu, setIsInAdminMenu] = useState(false);

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
            <h1 className="text-xl font-bold">Club ViveVerde</h1>
            <div className="text-gray-400 text-sm mt-1">
              {isInAdminMenu ? 'Panel Administrativo' : (isLoggedIn ? 'Menú de Usuario' : 'Menú Principal')}
            </div>
          </div>
          
          {/* Botón para volver al menú principal (solo en modo admin) */}
          {isInAdminMenu && (
            <div className="p-2 border-b border-green-700">
              <motion.button
                onClick={() => setIsInAdminMenu(false)}
                className="w-full text-left py-2 px-4 flex items-center hover:bg-green-800 transition-colors duration-200"
              >
                <i className="fas fa-arrow-left mr-3 w-5 text-center"></i>
                <span>Volver al Menú</span>
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
                />
              </li>
            </ul>
          </nav>
          
          {/* Botones de autenticación (solo si no está en modo admin) */}
          {!isInAdminMenu && (
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
