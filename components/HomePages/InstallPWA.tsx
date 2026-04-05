import { useState, useEffect } from 'react';
import { motion } from "framer-motion";
import toast from 'react-hot-toast';
import { SmartphoneIcon, TabletIcon, DesktopIcon, SuccessIcon, ErrorIcon } from '@/components/Common/Icons/AppIcons';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

const InstallPWA = () => {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  
  useEffect(() => {
    // Verificar si la app ya está instalada
    const checkIfInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isIOSStandalone = (window as any).navigator.standalone === true;
      setIsInstalled(isStandalone || isIOSStandalone);
    };
    
    checkIfInstalled();
    
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };
    const handleAppInstalled = () => {
      console.log('PWA ya instalada');
      setIsInstalled(true);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    
    // También escuchar cambios en el modo de visualización
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleDisplayModeChange = (e: MediaQueryListEvent) => {
      setIsInstalled(e.matches);
    };
    mediaQuery.addEventListener('change', handleDisplayModeChange);
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      mediaQuery.removeEventListener('change', handleDisplayModeChange);
    };
  }, []);
  
  // Si la app ya está instalada, no mostrar el botón
  if (isInstalled) {
    return null;
  }
  const handleInstallClick = async () => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const isAndroid = /Android/.test(navigator.userAgent);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    if (isStandalone) {
      toast.success('La aplicación ya está instalada');
      return;
    }
    if (installPrompt) {
      try {
        await installPrompt.prompt();
        const choiceResult = await installPrompt.userChoice;
        if (choiceResult.outcome === 'accepted') {
          console.log('Usuario aceptó la instalación');
          toast.success('Aplicación instalada correctamente');
        } else {
          console.log('Usuario rechaz ó la instalación');
        }
      } catch (error) {
        console.error('Error al intentar instalar la PWA:', error);
        toast.error('Error al intentar instalar la aplicación');
      }
      return;
    }
    if (isIOS) {
      toast('Para instalar en tu iPhone: toca el icono de compartir y selecciona "Añadir a pantalla de inicio"', {
        duration: 5000,
        icon: <SmartphoneIcon size="sm" />
      });
    } else if (isAndroid) {
      toast('Para instalar en Android: abre el menú y selecciona "Instalar aplicación"', {
        duration: 5000,
        icon: <TabletIcon size="sm" />
      });
    } else {
      toast('Para instalar en PC: busca el icono de instalación en la barra de direcciones', {
        duration: 5000,
        icon: <DesktopIcon size="sm" />
      });
    }
  };
  return (
    <motion.div 
      className="fixed bottom-6 right-6 z-40"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1, duration: 0.5 }}
      >
        <button
          onClick={handleInstallClick}
          className="bg-green-800 px-3 py-3 rounded-full text-white font-bold flex justify-center items-center hover:bg-green-700 transition duration-300 ease-in-out text-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Instalar APP
        </button>
      </motion.div>
  );
};

export default InstallPWA;