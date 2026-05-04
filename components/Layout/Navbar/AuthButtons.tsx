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
  userRole?: string | null;
}

const AuthButtons: React.FC<AuthButtonsProps> = ({
  isLoggedIn,
  isOnDashboard,
  handleLogout,
  isMobile = false,
  closeMenu,
  userRole
}) => {
  const router = useRouter();
  
  // Función helper para cerrar el menú y navegar
  const handleLinkClick = (href: string) => {
    if (closeMenu) {
      closeMenu();
    }
    router.push(href);
  };
  
  // Función para obtener el enlace de perfil - Siempre lleva a /dashboard para editar datos personales
  const getProfileLink = (role: string | null | undefined): string => {
    // Siempre llevar a /dashboard para que todos los usuarios puedan editar sus datos personales
    return "/dashboard";
  };

  // Obtener el enlace correcto para el perfil
  const profileLink = getProfileLink(userRole);

  // Si es móvil, aplicamos estilos para el sidebar del admin
  const buttonBaseClasses = isMobile
    ? "w-full text-left py-3 px-4 flex items-center transition-colors duration-200 hover:bg-green-800 border-l-4 border-transparent"
    : "bg-green-800 px-4 py-2 rounded-full text-white font-bold flex justify-center items-center hover:bg-green-700 transition duration-300 ease-in-out text-sm";

  // Botón base con ancho fijo para que ambos botones tengan el mismo tamaño
  const fixedWidthButtonClasses = isMobile
    ? "w-full text-left py-3 px-4 flex items-center transition-colors duration-200 hover:bg-green-800 border-l-4 border-transparent"
    : "bg-green-800 px-6 py-2 rounded-full text-white font-bold flex justify-center items-center hover:bg-green-700 transition duration-300 ease-in-out text-sm min-w-[140px]";

  // Contenedor móvil - ajustar para el sidebar
  const containerClasses = isMobile ? "" : "";

  // Si está logueado en móvil, mostrar solo Mi Perfil (el botón de cerrar sesión se movió a Mi perfil)
  if (isLoggedIn && isMobile) {
    return (
      <motion.div className="space-y-1">
        <motion.button
          onClick={() => handleLinkClick(profileLink)}
          className={`${buttonBaseClasses} bg-green-700 border-l-white`}
        >
          <i className="fa-solid fa-user mr-3 w-5 text-center"></i>
          <span>Mi Perfil</span>
        </motion.button>
      </motion.div>
    );
  }

  if (isLoggedIn) {
    return (
      <motion.div className="flex space-x-2 lg:space-x-4">
        <motion.button
          onClick={() => handleLinkClick(profileLink)}
          className={fixedWidthButtonClasses}
        >
          <i className="fa-solid fa-user mr-2 w-5 text-center"></i>
          <span>Mi Perfil</span>
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
