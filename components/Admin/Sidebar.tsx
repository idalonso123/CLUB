import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/router';

type SectionType = 'dashboard' | 'users' | 'rewards' | 'mainpage' | 'logs' | 'analytics' | 'emails' | 'backup';

interface SidebarProps {
  activeSection?: SectionType;
  onSectionChange?: (section: SectionType) => void;
  userRole?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ activeSection = 'dashboard', onSectionChange, userRole }) => {
  const router = useRouter();
  
  // Estado para controlar la visibilidad del sidebar en móviles
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Verificar si el usuario es de marketing
  const isMarketing = userRole?.toLowerCase() === 'marketing';

  // Efecto para detectar el tamaño de la pantalla
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setIsMobileOpen(false);
      }
    };

    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  // Función para determinar si una ruta está activa
  const isRouteActive = (sectionId: string) => {
    const currentPath = router.pathname;
    const sectionRoutes: Record<string, string> = {
      'dashboard': '/admin/dashboard',
      'users': '/admin/users',
      'rewards': '/admin/rewards',
      'mainpage': '/admin/mainpage',
      'logs': '/admin/logs',
      'analytics': '/admin/analytics',
      'emails': '/marketing',
      'backup': '/admin/backup'
    };
    return currentPath === sectionRoutes[sectionId];
  };

  // Lista de todas las secciones disponibles
  const allSections = [
    { id: 'dashboard', name: 'Panel Principal', icon: 'fa-tachometer-alt', route: '/admin/dashboard' },
    { id: 'users', name: 'Usuarios', icon: 'fa-users', route: '/admin/users' },
    { id: 'rewards', name: 'Recompensas', icon: 'fa-gift', route: '/admin/rewards' },
    { id: 'mainpage', name: 'Página Principal', icon: 'fa-home', route: '/admin/mainpage' },
    { id: 'logs', name: 'Logs', icon: 'fa-file-alt', route: '/admin/logs' },
    { id: 'analytics', name: 'Google Analytics', icon: 'fa-chart-line', route: '/admin/analytics' },
    { id: 'emails', name: 'Marketing', icon: 'fa-envelope', route: '/marketing' },
    { id: 'backup', name: 'Copias de Seguridad', icon: 'fa-database', route: '/admin/backup' }
  ];
  
  // Filtrar secciones según el rol
  const sections = isMarketing 
    ? allSections.filter(s => s.id === 'emails')
    : allSections;

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

  // Función para navegar a una sección
  const handleSectionNavigate = (section: typeof allSections[0]) => {
    router.push(section.route);
    if (isMobile) {
      setIsMobileOpen(false);
    }
  };

  // Renderizado del botón para móviles - flecha hacia la derecha cuando cerrado
  const renderMobileButton = () => {
    // No mostrar el botón si no es móvil o si el sidebar está abierto
    if (!isMobile || isMobileOpen) return null;
    
    return (
      <button 
        onClick={() => {}}
        className="fixed bottom-5 left-2 z-50 w-8 h-8 flex items-center justify-center bg-transparent shadow-none rounded-md text-transparent focus:outline-none"
        style={{bottom: '20px', top: 'auto'}}
        aria-label="Abrir menú"
      >
        <i className="fas fa-arrow-right text-sm text-transparent"></i>
      </button>
    );
  };

  // Overlay para cuando el sidebar esté abierto en móvil
  const renderOverlay = () => {
    if (!isMobile || !isMobileOpen) return null;
    
    return (
      <div 
        className="fixed inset-0 bg-opacity-50 z-30"
        onClick={() => setIsMobileOpen(false)}
      />
    );
  };

  return (
    <>
      {renderMobileButton()}
      {renderOverlay()}
      
      <AnimatePresence>
        {(!isMobile || isMobileOpen) && (
          <motion.div 
            className={`bg-green-900 text-white shadow-lg h-screen z-40 overflow-y-auto
              ${isMobile ? 'fixed top-0 left-0 w-64' : 'w-64 sticky top-0'}`}
            variants={sidebarVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            {/* Titulo del panel - diferente para móvil y web */}
            <div className="p-4 text-center border-b border-green-700">
              <h1 className="text-xl font-bold">{isMobile ? 'Menu de Administracion' : 'Menu de Administracion'}</h1>
              <div className="text-gray-400 text-sm mt-1 transition-colors duration-200 hover:text-white">
                Garcenar Jardineria SL
              </div>
            </div>
            
            {/* Menú de navegación */}
            <nav className="mt-2">
              <ul>
                {sections.map((section) => (
                  <li key={section.id} className="mb-1">
                    <button
                      data-section-id={section.id}
                      onClick={() => handleSectionNavigate(section)}
                      className={`w-full text-left py-3 px-4 flex items-center transition-colors duration-200
                        ${isRouteActive(section.id) 
                          ? 'bg-green-700 border-l-4 border-white font-medium' 
                          : 'hover:bg-green-800'
                        }`}
                    >
                      <i className={`fas ${section.icon} mr-3 w-5 text-center`}></i>
                      <span>{section.name}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
            
            {/* Footer con información del usuario */}
            {/* Eliminado el enlace "Mi perfil" del sidebar - se mantiene solo en header */}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;