import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useRouter } from "next/router";

interface NavLinksProps {
  isAdmin: boolean;
  isAdminOnly: boolean;
  isMobile?: boolean;
  isLoggedIn?: boolean; // Añadida nueva prop para verificar si está logueado
  openHelpModal: () => void; // Prop para abrir el modal de ayuda
}

const NavLinks: React.FC<NavLinksProps> = ({ isAdmin, isAdminOnly, isMobile = false, isLoggedIn = false, openHelpModal }) => {
  const router = useRouter();
  
  const getLinkClass = (path: string) => {
    return router.pathname === path 
      ? "text-green-900 border-b-2 border-green-900"
      : "";
  };

  if (isMobile) {
    return (
      <>
        <motion.div>
          <Link
            href="/"
            className={`${getLinkClass(
              "/"
            )} hover:text-green-900 block py-2 px-4 ${
              router.pathname === "/" ? "bg-green-50" : ""
            }`}
          >
            Inicio
          </Link>
        </motion.div>

        {/* Rewards para usuarios logueados o administradores (móvil) */}
        {(isLoggedIn || isAdmin) && (
          <motion.div>
            <Link
              href="/rewards"
              className={`${getLinkClass(
                "/rewards"
              )} hover:text-green-900 block py-2 px-4 ${
                router.pathname.startsWith("/rewards")
                  ? "bg-green-50"
                  : ""
              }`}
            >
              Recompensas
            </Link>
          </motion.div>
        )}

        {/* Enlace a Cajero para administradores y cajeros (móvil) */}
        {(isAdmin || isAdminOnly) && (
          <motion.div>
            <Link
              href="/teller"
              className={`${getLinkClass(
                "/teller"
              )} hover:text-green-900 block py-2 px-4 ${
                router.pathname.startsWith("/teller")
                  ? "bg-green-50"
                  : ""
              }`}
            >
              Cajero
            </Link>
          </motion.div>
        )}

        {isAdminOnly && (
          <motion.div>
            <Link
              href="/admin"
              className={`${getLinkClass(
                "/admin"
              )} hover:text-green-900 block py-2 px-4 ${
                router.pathname.startsWith("/admin")
                  ? "bg-green-50"
                  : ""
              }`}
            >
              Panel Administrativo
            </Link>
          </motion.div>
        )}

        <motion.div
          className="px-4 pt-2"
        >
          <motion.button
            onClick={openHelpModal}
            className="w-full bg-green-800 p-2 rounded-full text-white font-bold flex justify-center items-center hover:bg-green-700 transition duration-300 ease-in-out"
          >
            <i className="fa-solid fa-envelope"></i>
            <span className="ml-2">Soporte</span>
          </motion.button>
        </motion.div>
      </>
    );
  }

  return (
    <div className="hidden md:flex flex-1 justify-center">
      <nav className="flex flex-row space-x-6 py-4">
        <motion.div>
          <Link
            href="/"
            className={`${getLinkClass(
              "/"
            )} hover:text-green-900 text-lg font-medium relative overflow-hidden group`}
          >
            <span>Inicio</span>
            <motion.span
              className="absolute bottom-0 left-0 w-full h-0.5 bg-green-700 transform origin-left scale-x-0 transition-transform"
            />
          </Link>
        </motion.div>

        {/* Rewards para usuarios logueados o administradores (desktop) */}
        {(isLoggedIn || isAdmin) && (
          <motion.div>
            <Link
              href="/rewards"
              className={`${getLinkClass(
                "/rewards"
              )} hover:text-green-900 text-lg font-medium relative overflow-hidden group`}
            >
              <span>Recompensas</span>
              <motion.span
                className="absolute bottom-0 left-0 w-full h-0.5 bg-green-700 transform origin-left scale-x-0 transition-transform"
              />
            </Link>
          </motion.div>
        )}

        {/* Enlace a Cajero para administradores y cajeros (desktop) */}
        {(isAdmin || isAdminOnly) && (
          <motion.div>
            <Link
              href="/teller"
              className={`${getLinkClass(
                "/teller"
              )} hover:text-green-900 text-lg font-medium relative overflow-hidden group`}
            >
              <span>Cajero</span>
              <motion.span
                className="absolute bottom-0 left-0 w-full h-0.5 bg-green-700 transform origin-left scale-x-0 transition-transform"
              />
            </Link>
          </motion.div>
        )}

        {isAdminOnly && (
          <motion.div>
            <Link
              href="/admin"
              className={`${getLinkClass(
                "/admin"
              )} hover:text-green-900 text-lg font-medium relative overflow-hidden group`}
            >
              <span>Panel Administrativo</span>
              <motion.span
                className="absolute bottom-0 left-0 w-full h-0.5 bg-green-700 transform origin-left scale-x-0 transition-transform"
              />
            </Link>
          </motion.div>
        )}
      </nav>
    </div>
  );
};

export default NavLinks;