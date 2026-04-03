import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useRouter } from "next/router";

interface NavLinksProps {
  isAdmin: boolean;
  isAdminOnly: boolean;
  isMarketing?: boolean;
  isMobile?: boolean;
  isLoggedIn?: boolean;
  closeMenu?: () => void;
  isInAdminMenu?: boolean;
  setIsInAdminMenu?: (value: boolean) => void;
}

const NavLinks: React.FC<NavLinksProps> = ({ isAdmin, isAdminOnly, isMarketing = false, isMobile = false, isLoggedIn = false, closeMenu, isInAdminMenu = false, setIsInAdminMenu }) => {
  const router = useRouter();
  
  // Función helper para cerrar el menú y navegar
  const handleLinkClick = (href: string) => {
    if (closeMenu) {
      closeMenu();
    }
    router.push(href);
  };
  
  const getLinkClass = (path: string) => {
    const isActive = router.pathname === path || router.pathname.startsWith(path);
    return isActive 
      ? "bg-green-700 border-l-4 border-white font-medium" 
      : "hover:bg-green-800";
  };

  if (isMobile) {
    // Si está en el submenú administrativo, mostrar las opciones del panel administrativo
    if (isInAdminMenu) {
      return (
        <>
          <motion.div className="mb-1">
            <motion.button
              onClick={() => handleLinkClick("/admin/dashboard")}
              className={`w-full text-left py-3 px-4 flex items-center transition-colors duration-200 ${getLinkClass("/admin/dashboard")}`}
            >
              <i className="fas fa-tachometer-alt mr-3 w-5 text-center"></i>
              <span>Panel de Control</span>
            </motion.button>
          </motion.div>

          <motion.div className="mb-1">
            <motion.button
              onClick={() => handleLinkClick("/admin/users")}
              className={`w-full text-left py-3 px-4 flex items-center transition-colors duration-200 ${getLinkClass("/admin/users")}`}
            >
              <i className="fas fa-users mr-3 w-5 text-center"></i>
              <span>Usuarios</span>
            </motion.button>
          </motion.div>

          <motion.div className="mb-1">
            <motion.button
              onClick={() => handleLinkClick("/admin/rewards")}
              className={`w-full text-left py-3 px-4 flex items-center transition-colors duration-200 ${getLinkClass("/admin/rewards")}`}
            >
              <i className="fas fa-gift mr-3 w-5 text-center"></i>
              <span>Recompensas</span>
            </motion.button>
          </motion.div>

          <motion.div className="mb-1">
            <motion.button
              onClick={() => handleLinkClick("/admin/mainpage")}
              className={`w-full text-left py-3 px-4 flex items-center transition-colors duration-200 ${getLinkClass("/admin/mainpage")}`}
            >
              <i className="fas fa-home mr-3 w-5 text-center"></i>
              <span>Pagina Principal</span>
            </motion.button>
          </motion.div>

          <motion.div className="mb-1">
            <motion.button
              onClick={() => handleLinkClick("/admin/logs")}
              className={`w-full text-left py-3 px-4 flex items-center transition-colors duration-200 ${getLinkClass("/admin/logs")}`}
            >
              <i className="fas fa-file-alt mr-3 w-5 text-center"></i>
              <span>Logs</span>
            </motion.button>
          </motion.div>

          <motion.div className="mb-1">
            <motion.button
              onClick={() => handleLinkClick("/admin/analytics")}
              className={`w-full text-left py-3 px-4 flex items-center transition-colors duration-200 ${getLinkClass("/admin/analytics")}`}
            >
              <i className="fas fa-chart-line mr-3 w-5 text-center"></i>
              <span>Google Analytics</span>
            </motion.button>
          </motion.div>

          <motion.div className="mb-1">
            <motion.button
              onClick={() => handleLinkClick("/marketing")}
              className={`w-full text-left py-3 px-4 flex items-center transition-colors duration-200 ${getLinkClass("/marketing")}`}
            >
              <i className="fas fa-envelope mr-3 w-5 text-center"></i>
              <span>Sistema de Correos</span>
            </motion.button>
          </motion.div>

          <motion.div className="mb-1">
            <motion.button
              onClick={() => handleLinkClick("/admin/backup")}
              className={`w-full text-left py-3 px-4 flex items-center transition-colors duration-200 ${getLinkClass("/admin/backup")}`}
            >
              <i className="fas fa-database mr-3 w-5 text-center"></i>
              <span>Copias de seguridad</span>
            </motion.button>
          </motion.div>
        </>
      );
    }

    // Menú principal móvil
    return (
      <>
        {/* Solo mostrar Inicio si NO está logueado (móvil) */}
        {!isLoggedIn && (
          <motion.div className="mb-1">
            <motion.button
              onClick={() => handleLinkClick("/")}
              className={`w-full text-left py-3 px-4 flex items-center transition-colors duration-200 ${getLinkClass("/")}`}
            >
              <i className="fas fa-home mr-3 w-5 text-center"></i>
              <span>Inicio</span>
            </motion.button>
          </motion.div>
        )}

        {/* Menú para usuarios logueados que son clientes (no admin, cajero ni marketing) */}
        {isLoggedIn && !isAdmin && !isMarketing && (
          <>
            <motion.div className="mb-1">
              <motion.button
                onClick={() => handleLinkClick("/puntos-fidelidad")}
                className={`w-full text-left py-3 px-4 flex items-center transition-colors duration-200 ${getLinkClass("/puntos-fidelidad")}`}
              >
                <i className="fas fa-star mr-3 w-5 text-center"></i>
                <span>Puntos Fidelidad</span>
              </motion.button>
            </motion.div>

            <motion.div className="mb-1">
              <motion.button
                onClick={() => handleLinkClick("/carnets-mascotas")}
                className={`w-full text-left py-3 px-4 flex items-center transition-colors duration-200 ${getLinkClass("/carnets-mascotas")}`}
              >
                <i className="fas fa-paw mr-3 w-5 text-center"></i>
                <span>Carnets Mascotas</span>
              </motion.button>
            </motion.div>

            <motion.div className="mb-1">
              <motion.button
                onClick={() => handleLinkClick("/rewards")}
                className={`w-full text-left py-3 px-4 flex items-center transition-colors duration-200 ${getLinkClass("/rewards")}`}
              >
                <i className="fas fa-gift mr-3 w-5 text-center"></i>
                <span>Recompensas</span>
              </motion.button>
            </motion.div>
          </>
        )}

        {/* Rewards para administradores no logueados (móvil) */}
        {!isLoggedIn && isAdmin && (
          <motion.div className="mb-1">
            <motion.button
              onClick={() => handleLinkClick("/rewards")}
              className={`w-full text-left py-3 px-4 flex items-center transition-colors duration-200 ${getLinkClass("/rewards")}`}
            >
              <i className="fas fa-gift mr-3 w-5 text-center"></i>
              <span>Recompensas</span>
            </motion.button>
          </motion.div>
        )}

        {/* Enlace a Cajero para administradores y cajeros (móvil) */}
        {(isAdmin || isAdminOnly) && (
          <motion.div className="mb-1">
            <motion.button
              onClick={() => handleLinkClick("/teller")}
              className={`w-full text-left py-3 px-4 flex items-center transition-colors duration-200 ${getLinkClass("/teller")}`}
            >
              <i className="fas fa-cash-register mr-3 w-5 text-center"></i>
              <span>Cajero</span>
            </motion.button>
          </motion.div>
        )}

        {isAdminOnly && (
          <motion.div className="mb-1">
            <motion.button
              onClick={() => handleLinkClick("/marketing")}
              className={`w-full text-left py-3 px-4 flex items-center transition-colors duration-200 ${getLinkClass("/marketing")}`}
            >
              <i className="fas fa-bullhorn mr-3 w-5 text-center"></i>
              <span>Marketing</span>
            </motion.button>
          </motion.div>
        )}

        {isAdminOnly && (
          <motion.div className="mb-1">
            <motion.button
              onClick={() => {
                // No cerrar el menú, cambiar al submenú administrativo
                if (setIsInAdminMenu) {
                  setIsInAdminMenu(true);
                }
              }}
              className={`w-full text-left py-3 px-4 flex items-center transition-colors duration-200 ${getLinkClass("/admin")}`}
            >
              <i className="fas fa-cog mr-3 w-5 text-center"></i>
              <span>Panel Administrativo</span>
            </motion.button>
          </motion.div>
        )}

        {/* Menú para usuarios de marketing (móvil) */}
        {isMarketing && (
          <motion.div className="mb-1">
            <motion.button
              onClick={() => handleLinkClick("/marketing")}
              className={`w-full text-left py-3 px-4 flex items-center transition-colors duration-200 ${getLinkClass("/marketing")}`}
            >
              <i className="fas fa-envelope mr-3 w-5 text-center"></i>
              <span>Sistema de Correos</span>
            </motion.button>
          </motion.div>
        )}

        {/* Botón de Soporte */}
        <motion.div 
          className="mb-1 pt-2 px-4"
        >
          <motion.button
            onClick={() => {
              if (closeMenu) closeMenu();
              handleLinkClick("/soporte");
            }}
            className={`w-full text-left py-3 px-4 flex items-center transition-colors duration-200 ${getLinkClass("/soporte")}`}
          >
            <i className="fas fa-envelope mr-3 w-5 text-center"></i>
            <span>Soporte</span>
          </motion.button>
        </motion.div>
      </>
    );
  }

  return (
    <div className="hidden md:flex flex-1 justify-center">
      <nav className="flex flex-row space-x-6 py-4">
        {/* Solo mostrar Inicio si NO está logueado */}
        {!isLoggedIn && (
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
        )}

        {/* Menú para usuarios logueados que son clientes (no admin, cajero ni marketing) - desktop */}
        {isLoggedIn && !isAdmin && !isMarketing && (
          <>
            <motion.div>
              <Link
                href="/puntos-fidelidad"
                className={`${getLinkClass(
                  "/puntos-fidelidad"
                )} hover:text-green-900 text-lg font-medium relative overflow-hidden group`}
              >
                <span>Puntos Fidelidad</span>
                <motion.span
                  className="absolute bottom-0 left-0 w-full h-0.5 bg-green-700 transform origin-left scale-x-0 transition-transform"
                />
              </Link>
            </motion.div>

            <motion.div>
              <Link
                href="/carnets-mascotas"
                className={`${getLinkClass(
                  "/carnets-mascotas"
                )} hover:text-green-900 text-lg font-medium relative overflow-hidden group`}
              >
                <span>Carnets Mascotas</span>
                <motion.span
                  className="absolute bottom-0 left-0 w-full h-0.5 bg-green-700 transform origin-left scale-x-0 transition-transform"
                />
              </Link>
            </motion.div>

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
          </>
        )}

        {/* Rewards para administradores no logueados (desktop) */}
        {!isLoggedIn && isAdmin && (
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
              href="/marketing"
              className={`${getLinkClass(
                "/marketing"
              )} hover:text-green-900 text-lg font-medium relative overflow-hidden group`}
            >
              <span>Marketing</span>
              <motion.span
                className="absolute bottom-0 left-0 w-full h-0.5 bg-green-700 transform origin-left scale-x-0 transition-transform"
              />
            </Link>
          </motion.div>
        )}

        {isAdminOnly && (
          <motion.div>
            <Link
              href="/admin/dashboard"
              className={`${getLinkClass(
                "/admin/dashboard"
              )} hover:text-green-900 text-lg font-medium relative overflow-hidden group`}
            >
              <span>Panel Administrativo</span>
              <motion.span
                className="absolute bottom-0 left-0 w-full h-0.5 bg-green-700 transform origin-left scale-x-0 transition-transform"
              />
            </Link>
          </motion.div>
        )}

        {/* Menú para usuarios de marketing (desktop) */}
        {isMarketing && (
          <motion.div>
            <Link
              href="/marketing"
              className={`${getLinkClass(
                "/marketing"
              )} hover:text-green-900 text-lg font-medium relative overflow-hidden group`}
            >
              <span>Sistema de Correos</span>
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
