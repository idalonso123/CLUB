import React from "react";
import { motion } from "framer-motion";
import NavLinks from "./NavLinks";
import AuthButtons from "./AuthButtons";

interface MobileMenuProps {
  isMenuOpen: boolean;
  isAdmin: boolean;
  isAdminOnly: boolean;
  isLoggedIn: boolean;
  isOnDashboard: boolean;
  handleLogout: () => Promise<void>;
  openHelpModal: () => void;
}

const MobileMenu: React.FC<MobileMenuProps> = ({
  isMenuOpen,
  isAdmin,
  isAdminOnly,
  isLoggedIn,
  isOnDashboard,
  handleLogout,
  openHelpModal
}) => {
  if (!isMenuOpen) return null;

  return (
    <motion.nav
      className="mobile-menu md:hidden flex flex-col space-y-4 w-full py-4 bg-white/95 backdrop-blur-sm shadow-lg absolute top-full left-0 z-50"
    >
      {/* Enlaces de navegación */}
      <NavLinks isAdmin={isAdmin} isAdminOnly={isAdminOnly} isMobile={true} isLoggedIn={isLoggedIn} openHelpModal={openHelpModal} />
      
      {/* Botones de autenticación */}
      <AuthButtons 
        isLoggedIn={isLoggedIn} 
        isOnDashboard={isOnDashboard} 
        handleLogout={handleLogout}
        isMobile={true}
      />
    </motion.nav>
  );
};

export default MobileMenu;