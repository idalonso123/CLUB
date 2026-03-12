import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";

interface AuthButtonsProps {
  isLoggedIn: boolean;
  isOnDashboard: boolean;
  handleLogout: () => Promise<void>;
  isMobile?: boolean;
}

const AuthButtons: React.FC<AuthButtonsProps> = ({
  isLoggedIn,
  isOnDashboard,
  handleLogout,
  isMobile = false
}) => {

  // Aplicamos clases diferentes según si es vista móvil o escritorio
  const buttonBaseClasses = isMobile
    ? "w-full bg-green-800 p-2 rounded-full text-white font-bold flex justify-center items-center hover:bg-green-700 transition duration-300 ease-in-out"
    : "bg-green-800 px-4 py-2 rounded-full text-white font-bold flex justify-center items-center hover:bg-green-700 transition duration-300 ease-in-out text-sm";

  // Para el botón de cerrar sesión, cambiamos el hover color
  const logoutButtonClasses = isMobile
    ? "w-full bg-green-800 p-2 rounded-full text-white font-bold flex justify-center items-center hover:bg-red-600 transition duration-300 ease-in-out"
    : "bg-green-800 px-4 py-2 rounded-full text-white font-bold flex justify-center items-center hover:bg-red-600 transition duration-300 ease-in-out text-sm";

  // Contenedor móvil
  const containerClasses = isMobile ? "px-4 pt-2" : "";

  if (isOnDashboard) {
    return (
      <motion.div className={containerClasses}>
        <motion.button
          onClick={handleLogout}
          className={logoutButtonClasses}
        >
          <i className="fa-solid fa-right-from-bracket"></i>
          <span className="ml-2">Cerrar Sesión</span>
        </motion.button>
      </motion.div>
    );
  }

  if (isLoggedIn) {
    return (
      <motion.div className={containerClasses}>
        <Link href="/dashboard">
          <motion.div
            className={buttonBaseClasses}
          >
            <i className="fa-solid fa-user"></i>
            <span className="ml-2">Mi Perfil</span>
          </motion.div>
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div className={containerClasses}>
      <Link href="/login">
        <motion.div
          className={buttonBaseClasses}
        >
          <i className="fa-solid fa-sign-in-alt"></i>
          <span className="ml-2">Iniciar Sesión</span>
        </motion.div>
      </Link>
    </motion.div>
  );
};

export default AuthButtons;