import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useRouter } from "next/router";

interface AuthButtonsProps {
  isLoggedIn: boolean;
  isOnDashboard: boolean;
  handleLogout: () => Promise<void>;
  isMobile?: boolean;
  closeMenu?: () => void;
}

const AuthButtons: React.FC<AuthButtonsProps> = ({
  isLoggedIn,
  isOnDashboard,
  handleLogout,
  isMobile = false,
  closeMenu
}) => {
  const router = useRouter();
  
  // Función helper para cerrar el menú y navegar
  const handleLinkClick = (href: string) => {
    if (closeMenu) {
      closeMenu();
    }
    router.push(href);
  };
  
  // Función helper para cerrar sesión
  const handleLogoutClick = async () => {
    if (closeMenu) {
      closeMenu();
    }
    await handleLogout();
  };

  // Si es móvil, aplicamos estilos para el sidebar del admin
  const buttonBaseClasses = isMobile
    ? "w-full text-left py-3 px-4 flex items-center transition-colors duration-200 hover:bg-green-800 border-l-4 border-transparent"
    : "bg-green-800 px-4 py-2 rounded-full text-white font-bold flex justify-center items-center hover:bg-green-700 transition duration-300 ease-in-out text-sm";

  // Para el botón de cerrar sesión
  const logoutButtonClasses = isMobile
    ? "w-full text-left py-3 px-4 flex items-center transition-colors duration-200 hover:bg-red-800 border-l-4 border-transparent"
    : "bg-green-800 px-4 py-2 rounded-full text-white font-bold flex justify-center items-center hover:bg-red-600 transition duration-300 ease-in-out text-sm";

  // Contenedor móvil - ajustar para el sidebar
  const containerClasses = isMobile ? "" : "";

  // Si está en el dashboard, mostrar ambos botones separados
  if (isOnDashboard && isMobile) {
    return (
      <motion.div className="space-y-1">
        <motion.button
          onClick={() => handleLinkClick("/dashboard")}
          className={`${buttonBaseClasses} bg-green-700 border-l-white`}
        >
          <i className="fa-solid fa-user mr-3 w-5 text-center"></i>
          <span>Mi Perfil</span>
        </motion.button>
        <motion.button
          onClick={handleLogoutClick}
          className={logoutButtonClasses}
        >
          <i className="fa-solid fa-right-from-bracket mr-3 w-5 text-center"></i>
          <span>Cerrar Sesión</span>
        </motion.button>
      </motion.div>
    );
  }

  if (isLoggedIn) {
    return (
      <motion.div className="space-y-1">
        <motion.button
          onClick={() => handleLinkClick("/dashboard")}
          className={buttonBaseClasses}
        >
          <i className="fa-solid fa-user mr-3 w-5 text-center"></i>
          <span>Mi Perfil</span>
        </motion.button>
        <motion.button
          onClick={handleLogoutClick}
          className={logoutButtonClasses}
        >
          <i className="fa-solid fa-right-from-bracket mr-3 w-5 text-center"></i>
          <span>Cerrar Sesión</span>
        </motion.button>
      </motion.div>
    );
  }

  return (
    <motion.div className="space-y-1">
      <motion.button
        onClick={() => handleLinkClick("/login")}
        className={buttonBaseClasses}
      >
        <i className="fa-solid fa-sign-in-alt mr-3 w-5 text-center"></i>
        <span>Iniciar Sesión</span>
      </motion.button>
    </motion.div>
  );
};

export default AuthButtons;
