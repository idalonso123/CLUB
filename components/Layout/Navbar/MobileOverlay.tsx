import React, { useEffect } from "react";

interface MobileOverlayProps {
  isMenuOpen: boolean;
  isMobile: boolean;
  onClose: () => void;
}

const MobileOverlay: React.FC<MobileOverlayProps> = ({
  isMenuOpen,
  isMobile,
  onClose
}) => {
  useEffect(() => {
    if (!isMenuOpen || !isMobile) return;
    
    const handleClickOutside = (event: MouseEvent) => {
      // El sidebar del menú móvil tiene la clase: fixed top-0 left-0 w-64
      const sidebar = document.querySelector('.fixed.left-0.w-64');
      const menuButton = document.querySelector('.menu-button');
      
      if (
        sidebar && 
        !sidebar.contains(event.target as Node) &&
        menuButton && 
        !menuButton.contains(event.target as Node)
      ) {
        onClose();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside as EventListener);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside as EventListener);
    };
  }, [isMenuOpen, isMobile, onClose]);
  
  // No renderizar overlay - el menú se muestra sin fondo oscurecido
  return null;
};

export default MobileOverlay;
