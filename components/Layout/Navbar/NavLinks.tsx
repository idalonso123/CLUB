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
  isInMarketingMenu?: boolean;
  setIsInMarketingMenu?: (value: boolean) => void;
  isInTellerMenu?: boolean;
  setIsInTellerMenu?: (value: boolean) => void;
  handleLogout?: () => Promise<void>;
}

const NavLinks: React.FC<NavLinksProps> = ({ 
  isAdmin, 
  isAdminOnly, 
  isMarketing = false, 
  isMobile = false, 
  isLoggedIn = false, 
  closeMenu, 
  isInAdminMenu = false, 
  setIsInAdminMenu,
  isInMarketingMenu = false,
  setIsInMarketingMenu,
  isInTellerMenu = false,
  setIsInTellerMenu,
  handleLogout
}) => {
  const router = useRouter();
  
  // Detectar si estamos en la página de marketing
  const isOnMarketingPage = router.pathname.startsWith("/marketing");
  
  // Detectar si el admin accedió a marketing desde su menú
  const isAdminInMarketing = isAdminOnly && isOnMarketingPage;
  
  // Función helper para cerrar el menú y navegar
  const handleLinkClick = (href: string, closeMenuOnNavigate: boolean = true) => {
    // Cerrar el menú móvil al navegar - igual para admin que para marketing
    if (closeMenu && closeMenu) {
      closeMenu();
    }
    router.push(href);
  };

  // Función para navegar a una sección de marketing usando query params
  const handleMarketingSectionClick = (section: string) => {
    if (closeMenu) {
      closeMenu();
    }
    if (section === 'dashboard') {
      router.push('/marketing');
    } else {
      router.push(`/marketing?section=${section}`);
    }
  };
  
  const getLinkClass = (path: string) => {
    const isActive = router.pathname === path || router.pathname.startsWith(path);
    return isActive 
      ? "bg-green-700 border-l-4 border-white font-medium" 
      : "hover:bg-green-800";
  };

  if (isMobile) {
    // Si estamos en la página de soporte, mostrar menú simplificado con opción de volver
    const isOnSupportPage = router.pathname.startsWith("/soporte");
    if (isOnSupportPage) {
      return (
        <>
          {/* Opción Mi Perfil en soporte */}
          <motion.div className="mb-1">
            <motion.button
              onClick={() => handleLinkClick("/dashboard")}
              className={`w-full text-left py-3 px-4 flex items-center transition-colors duration-200 ${getLinkClass("/dashboard")}`}
            >
              <i className="fas fa-user mr-3 w-5 text-center"></i>
              <span>Mi perfil</span>
            </motion.button>
          </motion.div>
        </>
      );
    }

    // Si está en la página de marketing O viene del menú de marketing siendo usuario de marketing, mostrar el SIDEBAR de marketing
    if (isOnMarketingPage || (isInMarketingMenu && isMarketing)) {
      return (
        <>
          {/* Botón Volver a Administrador (solo cuando el admin accedió a marketing desde su menú) */}
          {(isAdminOnly && isInMarketingMenu) && (
            <motion.div className="mb-1">
              <Link
                href="/admin/dashboard"
                className={`w-full text-left py-3 px-4 flex items-center transition-colors duration-200 hover:bg-green-800`}
                onClick={() => {
                  if (closeMenu) closeMenu();
                }}
              >
                <i className="fas fa-arrow-left mr-3 w-5 text-center"></i>
                <span>Volver a Administrador</span>
              </Link>
            </motion.div>
          )}


          <motion.div className="mb-1">
            <motion.button
              onClick={() => handleLinkClick("/")}
              className="w-full text-left py-3 px-4 flex items-center transition-colors duration-200 hover:bg-green-800"
            >
              <i className="fas fa-home mr-3 w-5 text-center"></i>
              <span>Pantalla de inicio</span>
            </motion.button>
          </motion.div>

          <motion.div className="mb-1">
            <motion.button
              className="w-full text-left py-3 px-4 flex items-center transition-colors duration-200 hover:bg-green-800"
              onClick={() => {
                // Marcar que viene del menú de marketing
                if (setIsInMarketingMenu) {
                  setIsInMarketingMenu(true);
                }
                // Si estamos en la página de marketing, usar window.history.pushState para cambiar sección
                // Si no, usar router.push para navegación completa
                if (isOnMarketingPage) {
                  if (typeof window !== 'undefined') {
                    const url = new URL(window.location.href);
                    url.pathname = '/marketing';
                    url.searchParams.delete('section');
                    window.history.pushState({}, '', url.toString());
                    window.dispatchEvent(new PopStateEvent('popstate'));
                  }
                } else {
                  router.push('/marketing');
                }
                if (closeMenu) {
                  setTimeout(() => closeMenu(), 100);
                }
              }}
            >
              <i className="fas fa-tachometer-alt mr-3 w-5 text-center"></i>
              <span>Panel Principal</span>
            </motion.button>
          </motion.div>

          <motion.div className="mb-1">
            <motion.button
              className="w-full text-left py-3 px-4 flex items-center transition-colors duration-200 hover:bg-green-800"
              onClick={() => {
                // Marcar que viene del menú de marketing
                if (setIsInMarketingMenu) {
                  setIsInMarketingMenu(true);
                }
                // Si estamos en la página de marketing, usar window.history.pushState para cambiar sección
                // Si no, usar router.push para navegación completa
                if (isOnMarketingPage) {
                  if (typeof window !== 'undefined') {
                    const url = new URL(window.location.href);
                    url.pathname = '/marketing';
                    url.searchParams.set('section', 'templates');
                    window.history.pushState({}, '', url.toString());
                    window.dispatchEvent(new PopStateEvent('popstate'));
                  }
                } else {
                  router.push('/marketing?section=templates');
                }
                if (closeMenu) {
                  setTimeout(() => closeMenu(), 100);
                }
              }}
            >
              <i className="fas fa-file-alt mr-3 w-5 text-center"></i>
              <span>Plantillas</span>
            </motion.button>
          </motion.div>

          <motion.div className="mb-1">
            <motion.button
              className="w-full text-left py-3 px-4 flex items-center transition-colors duration-200 hover:bg-green-800"
              onClick={() => {
                // Marcar que viene del menú de marketing
                if (setIsInMarketingMenu) {
                  setIsInMarketingMenu(true);
                }
                // Si estamos en la página de marketing, usar window.history.pushState para cambiar sección
                // Si no, usar router.push para navegación completa
                if (isOnMarketingPage) {
                  if (typeof window !== 'undefined') {
                    const url = new URL(window.location.href);
                    url.pathname = '/marketing';
                    url.searchParams.set('section', 'campaigns');
                    window.history.pushState({}, '', url.toString());
                    window.dispatchEvent(new PopStateEvent('popstate'));
                  }
                } else {
                  router.push('/marketing?section=campaigns');
                }
                if (closeMenu) {
                  setTimeout(() => closeMenu(), 100);
                }
              }}
            >
              <i className="fas fa-envelope mr-3 w-5 text-center"></i>
              <span>Campañas</span>
            </motion.button>
          </motion.div>

          <motion.div className="mb-1">
            <motion.button
              className="w-full text-left py-3 px-4 flex items-center transition-colors duration-200 hover:bg-green-800"
              onClick={() => {
                // Marcar que viene del menú de marketing
                if (setIsInMarketingMenu) {
                  setIsInMarketingMenu(true);
                }
                // Si estamos en la página de marketing, usar window.history.pushState para cambiar sección
                // Si no, usar router.push para navegación completa
                if (isOnMarketingPage) {
                  if (typeof window !== 'undefined') {
                    const url = new URL(window.location.href);
                    url.pathname = '/marketing';
                    url.searchParams.set('section', 'subscribers');
                    window.history.pushState({}, '', url.toString());
                    window.dispatchEvent(new PopStateEvent('popstate'));
                  }
                } else {
                  router.push('/marketing?section=subscribers');
                }
                if (closeMenu) {
                  setTimeout(() => closeMenu(), 100);
                }
              }}
            >
              <i className="fas fa-users mr-3 w-5 text-center"></i>
              <span>Suscriptores</span>
            </motion.button>
          </motion.div>

          <motion.div className="mb-1">
            <motion.button
              className="w-full text-left py-3 px-4 flex items-center transition-colors duration-200 hover:bg-green-800"
              onClick={() => {
                // Marcar que viene del menú de marketing
                if (setIsInMarketingMenu) {
                  setIsInMarketingMenu(true);
                }
                // Si estamos en la página de marketing, usar window.history.pushState para cambiar sección
                // Si no, usar router.push para navegación completa
                if (isOnMarketingPage) {
                  if (typeof window !== 'undefined') {
                    const url = new URL(window.location.href);
                    url.pathname = '/marketing';
                    url.searchParams.set('section', 'segments');
                    window.history.pushState({}, '', url.toString());
                    window.dispatchEvent(new PopStateEvent('popstate'));
                  }
                } else {
                  router.push('/marketing?section=segments');
                }
                if (closeMenu) {
                  setTimeout(() => closeMenu(), 100);
                }
              }}
            >
              <i className="fas fa-layer-group mr-3 w-5 text-center"></i>
              <span>Segmentos</span>
            </motion.button>
          </motion.div>

          <motion.div className="mb-1">
            <motion.button
              className="w-full text-left py-3 px-4 flex items-center transition-colors duration-200 hover:bg-green-800"
              onClick={() => {
                // Marcar que viene del menú de marketing
                if (setIsInMarketingMenu) {
                  setIsInMarketingMenu(true);
                }
                // Si estamos en la página de marketing, usar window.history.pushState para cambiar sección
                // Si no, usar router.push para navegación completa
                if (isOnMarketingPage) {
                  if (typeof window !== 'undefined') {
                    const url = new URL(window.location.href);
                    url.pathname = '/marketing';
                    url.searchParams.set('section', 'automations');
                    window.history.pushState({}, '', url.toString());
                    window.dispatchEvent(new PopStateEvent('popstate'));
                  }
                } else {
                  router.push('/marketing?section=automations');
                }
                if (closeMenu) {
                  setTimeout(() => closeMenu(), 100);
                }
              }}
            >
              <i className="fas fa-cogs mr-3 w-5 text-center"></i>
              <span>Automatizaciones</span>
            </motion.button>
          </motion.div>

          <motion.div className="mb-1 pt-2 border-t border-green-700 mt-2">
            <Link
              href="/soporte"
              className="w-full text-left py-3 px-4 flex items-center transition-colors duration-200 hover:bg-green-800"
              onClick={() => {
                // Guardar la página correcta según el tipo de usuario
                if (typeof window !== 'undefined') {
                  if (isAdminOnly) {
                    sessionStorage.setItem('soportePreviousPage', '/admin/dashboard');
                  } else if (isMarketing) {
                    sessionStorage.setItem('soportePreviousPage', '/marketing');
                  }
                }
                if (closeMenu) closeMenu();
              }}
            >
              <i className="fas fa-life-ring mr-3 w-5 text-center"></i>
              <span>Soporte</span>
            </Link>
          </motion.div>

          <motion.div className="mb-1">
            <Link
              href="/dashboard"
              className="w-full text-left py-3 px-4 flex items-center transition-colors duration-200 hover:bg-green-800"
              onClick={() => {
                // Solo si es usuario de marketing y viene del menú de marketing, guardar el estado
                if (typeof window !== 'undefined' && isInMarketingMenu && isMarketing) {
                  sessionStorage.setItem('cameFromMarketingMenu', 'true');
                }
                if (closeMenu) closeMenu();
              }}
            >
              <i className="fas fa-user mr-3 w-5 text-center"></i>
              <span>Mi perfil</span>
            </Link>
          </motion.div>
        </>
      );
    }

    // Si es cajero (isInTellerMenu es true O es un usuario con rol cajero), mostrar las opciones del menú de cajero
    if (isInTellerMenu) {
      return (
        <>
          {/* Botón Volver a Administrador (solo cuando el admin accedió a cajero desde su menú) */}
          {(isAdmin || isAdminOnly) && (
            <motion.div className="mb-1">
              <motion.button
                onClick={() => {
                  // Limpiar el estado del menú de cajero
                  if (typeof window !== 'undefined') {
                    sessionStorage.removeItem('cameFromTellerMenu');
                  }
                  if (setIsInTellerMenu) {
                    setIsInTellerMenu(false);
                  }
                  if (closeMenu) closeMenu();
                  router.push('/admin/dashboard');
                }}
                className={`w-full text-left py-3 px-4 flex items-center transition-colors duration-200 hover:bg-green-800`}
              >
                <i className="fas fa-arrow-left mr-3 w-5 text-center"></i>
                <span>Volver a Administrador</span>
              </motion.button>
            </motion.div>
          )}

          <motion.div className="mb-1">
            <motion.button
              onClick={() => handleLinkClick("/")}
              className={`w-full text-left py-3 px-4 flex items-center transition-colors duration-200 ${getLinkClass("/")}`}
            >
              <i className="fas fa-home mr-3 w-5 text-center"></i>
              <span>Pantalla de inicio</span>
            </motion.button>
          </motion.div>

          <motion.div className="mb-1">
            <motion.button
              onClick={() => handleLinkClick("/teller")}
              className={`w-full text-left py-3 px-4 flex items-center transition-colors duration-200 ${getLinkClass("/teller")}`}
            >
              <i className="fas fa-cash-register mr-3 w-5 text-center"></i>
              <span>Cajero</span>
            </motion.button>
          </motion.div>

          <motion.div className="mb-1">
            <motion.button
              onClick={() => handleLinkClick("/soporte")}
              className={`w-full text-left py-3 px-4 flex items-center transition-colors duration-200 ${getLinkClass("/soporte")}`}
            >
              <i className="fas fa-envelope mr-3 w-5 text-center"></i>
              <span>Soporte</span>
            </motion.button>
          </motion.div>

          <motion.div className="mb-1">
            <motion.button
              onClick={() => handleLinkClick("/dashboard")}
              className={`w-full text-left py-3 px-4 flex items-center transition-colors duration-200 ${getLinkClass("/dashboard")}`}
            >
              <i className="fas fa-user mr-3 w-5 text-center"></i>
              <span>Mi perfil</span>
            </motion.button>
          </motion.div>
        </>
      );
    }

    // Si está en el submenú administrativo, mostrar las opciones del panel administrativo
    if (isInAdminMenu) {
      return (
        <>
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
              <span>Página Principal</span>
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
              <span>Sistema de Correos (Marketing)</span>
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

          {/* Separador antes de Mi perfil */}
          <motion.div className="border-t border-green-700 my-2"></motion.div>

          {/* Mi perfil */}
          <motion.div className="mb-1">
            <Link
              href="/dashboard"
              className="w-full text-left py-3 px-4 flex items-center transition-colors duration-200 hover:bg-green-800"
              onClick={() => {
                if (closeMenu) closeMenu();
              }}
            >
              <i className="fas fa-user mr-3 w-5 text-center"></i>
              <span>Mi perfil</span>
            </Link>
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
                onClick={() => handleLinkClick("/")}
                className={`w-full text-left py-3 px-4 flex items-center transition-colors duration-200 ${getLinkClass("/")}`}
              >
                <i className="fas fa-home mr-3 w-5 text-center"></i>
                <span>Pantalla de inicio</span>
              </motion.button>
            </motion.div>

            <motion.div className="mb-1">
              <motion.button
                onClick={() => handleLinkClick("/puntos-fidelidad")}
                className={`w-full text-left py-3 px-4 flex items-center transition-colors duration-200 ${getLinkClass("/puntos-fidelidad")}`}
              >
                <i className="fas fa-star mr-3 w-5 text-center"></i>
                <span>Mis Puntos</span>
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

      {isAdminOnly && (
        <motion.div className="mb-1">
          <motion.button
            onClick={() => handleLinkClick("/")}
            className={`w-full text-left py-3 px-4 flex items-center transition-colors duration-200 ${getLinkClass("/")}`}
          >
            <i className="fas fa-home mr-3 w-5 text-center"></i>
            <span>Pantalla de inicio</span>
          </motion.button>
        </motion.div>
      )}

        {/* Enlace a Cajero para administradores y cajeros (móvil) */}
        {(isAdmin || isAdminOnly) && (
          <motion.div className="mb-1">
            <motion.button
              onClick={() => {
                // Marcar que viene del menú de cajero para mantener el menú de cajero abierto
                if (setIsInTellerMenu) {
                  setIsInTellerMenu(true);
                }
                handleLinkClick("/teller");
              }}
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
              // NO cerrar el menú, cambiar al submenú del Panel Administrativo
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

        {/* Menú para usuarios de marketing (móvil) - ENTRADA AL SUBMENÚ DE MARKETING */}
        {isMarketing && !isOnMarketingPage && (
          <motion.div className="mb-1">
            <motion.button
              onClick={() => {
                // No cerrar el menú, cambiar al submenú de marketing
                if (setIsInMarketingMenu) {
                  setIsInMarketingMenu(true);
                }
              }}
              className={`w-full text-left py-3 px-4 flex items-center transition-colors duration-200 ${getLinkClass("/marketing")}`}
            >
              <i className="fas fa-bullhorn mr-3 w-5 text-center"></i>
              <span>Marketing</span>
            </motion.button>
          </motion.div>
        )}

        {/* Botón de Soporte */}
        <motion.div 
          className="mb-1 pt-2 px-4"
        >
          <motion.button
            onClick={() => {
              // Guardar la página correcta según el tipo de usuario
              if (typeof window !== 'undefined') {
                if (isAdminOnly) {
                  // Si es administrador, guardar Panel de Control
                  sessionStorage.setItem('soportePreviousPage', '/admin/dashboard');
                } else if (isAdmin && !isAdminOnly) {
                  // Si es cajero, guardar Panel de Cajero
                  sessionStorage.setItem('soportePreviousPage', '/teller');
                } else if (isMarketing) {
                  // Si es marketing, guardar Panel de Marketing
                  sessionStorage.setItem('soportePreviousPage', '/marketing');
                } else {
                  // Para usuarios normales, guardar Puntos de Fidelidad
                  sessionStorage.setItem('soportePreviousPage', '/puntos-fidelidad');
                }
              }
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
                href="/"
                className={`${getLinkClass(
                  "/"
                )} hover:text-green-900 text-lg font-medium relative overflow-hidden group`}
              >
                <span>Pantalla de inicio</span>
                <motion.span
                  className="absolute bottom-0 left-0 w-full h-0.5 bg-green-700 transform origin-left scale-x-0 transition-transform"
                />
              </Link>
            </motion.div>

            <motion.div>
              <Link
                href="/puntos-fidelidad"
                className={`${getLinkClass(
                  "/puntos-fidelidad"
                )} hover:text-green-900 text-lg font-medium relative overflow-hidden group`}
              >
                <span>Mis Puntos</span>
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
            <motion.button
              onClick={() => {
                // Marcar que viene del menú de cajero para mantener el menú de cajero abierto
                if (typeof window !== 'undefined') {
                  sessionStorage.setItem('cameFromTellerMenu', 'true');
                }
                router.push('/teller');
              }}
              className={`${getLinkClass(
                "/teller"
              )} hover:text-green-900 text-lg font-medium relative overflow-hidden group`}
            >
              <span>Cajero</span>
              <motion.span
                className="absolute bottom-0 left-0 w-full h-0.5 bg-green-700 transform origin-left scale-x-0 transition-transform"
              />
            </motion.button>
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
