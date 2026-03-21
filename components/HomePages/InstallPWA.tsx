import { useState, useEffect } from 'react';
import { motion } from "framer-motion";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

const InstallPWA = () => {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };
    const handleAppInstalled = () => {
      console.log('PWA ya instalada');
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);
  const handleInstallClick = async () => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const isAndroid = /Android/.test(navigator.userAgent);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    if (isStandalone) {
      alert('¡La aplicación ya está instalada!');
      return;
    }
    if (installPrompt) {
      try {
        await installPrompt.prompt();
        const choiceResult = await installPrompt.userChoice;
        if (choiceResult.outcome === 'accepted') {
          console.log('Usuario aceptó la instalación');
        } else {
          console.log('Usuario rechazó la instalación');
        }
      } catch (error) {
        console.error('Error al intentar instalar la PWA:', error);
      }
      return;
    }
    if (isIOS) {
      alert('Para instalar esta aplicación en tu iPhone:\n\n1. Toca el icono de compartir.\n2. Selecciona "Añadir a pantalla de inicio".\n3. Pulsa el botón de "Añadir".');
    } else if (isAndroid) {
      alert('Para instalar esta aplicación en Android:\n\n1. Abre el menú de opciones.\n2. Selecciona "Instalar aplicación" o "Añadir a pantalla de inicio".');
    } else {
      alert('Para instalar esta aplicación en tu PC:\n\n1. Busca el icono de instalación en la barra de direcciones.\n2. O abre el menú de opciones de tu navegador.\n3. Selecciona "Instalar" o "Añadir a escritorio".');
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