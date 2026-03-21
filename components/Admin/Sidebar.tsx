import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

type SectionType = 'dashboard' | 'users' | 'rewards' | 'mainpage' | 'logs' | 'analytics' | 'emails' | 'backup';

interface SidebarProps {
  activeSection: SectionType;
  onSectionChange: (section: SectionType) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeSection, onSectionChange }) => {
  // Estado para controlar la visibilidad del sidebar en móviles
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

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

  // Animación para el sidebar
  const sidebarVariants = {
    hidden: { x: -300, opacity: 0 },
    visible: { 
      x: 0, 
      opacity: 1,
      transition: { 
        duration: 0.5, 
        type: "spring", 
        stiffness: 100 
      }
    }
  };

  // Lista de todas las secciones disponibles
  const sections = [
    { id: 'dashboard', name: 'Panel de Control', icon: 'fa-tachometer-alt' },
    { id: 'users', name: 'Usuarios', icon: 'fa-users' },
    { id: 'rewards', name: 'Recompensas', icon: 'fa-gift' },
    { id: 'mainpage', name: 'Página Principal', icon: 'fa-home' },
    { id: 'logs', name: 'Logs', icon: 'fa-file-alt' },
    { id: 'analytics', name: 'Google Analytics', icon: 'fa-chart-line' },
    { id: 'emails', name: 'Sistema de Correos', icon: 'fa-envelope' },
    { id: 'backup', name: 'Copias de Seguridad', icon: 'fa-database' }
  ];

  // Función para cerrar el sidebar al cambiar de sección en móvil
  const handleSectionChange = (section: SectionType) => {
    onSectionChange(section);
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
        onClick={() => setIsMobileOpen(true)}
        className="fixed bottom-5 left-2 z-50 w-8 h-8 flex items-center justify-center bg-green-700 shadow-md rounded-md text-white focus:outline-none"
        style={{bottom: '20px', top: 'auto'}}
        aria-label="Abrir menú"
      >
        <i className="fas fa-arrow-right text-sm"></i>
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
            {/* Título del panel */}
            <div className="p-4 text-center border-b border-green-700">
              <h1 className="text-xl font-bold">Panel de Administración</h1>
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
                      onClick={() => handleSectionChange(section.id as SectionType)}
                      className={`w-full text-left py-3 px-4 flex items-center transition-colors duration-200
                        ${activeSection === section.id 
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
            <div className="absolute bottom-0 w-full p-4 border-t border-green-700">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-green-700 flex items-center justify-center">
                  <i className="fas fa-user"></i>
                </div>
                <div>
                  <p className="font-medium">Administrador</p>
                  <Link href="/dashboard" className="text-sm text-green-300 hover:text-white">
                    Ver perfil
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;