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
      const mobileMenu = document.querySelector('.mobile-menu');
      const menuButton = document.querySelector('.menu-button');
      
      if (
        mobileMenu && 
        !mobileMenu.contains(event.target as Node) &&
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
  
  return null;
};

export default MobileOverlay;