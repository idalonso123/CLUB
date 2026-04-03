import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Geist, Geist_Mono } from "next/font/google";
import Head from "next/head";
import Slider from "../components/HomePages/Slider";
import AboutSection from "../components/HomePages/AboutSection";
import ServiceCards from "../components/HomePages/ServiceCards";
import InstallPWA from "../components/HomePages/InstallPWA";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const HomePage = () => {
  const [activeCard, setActiveCard] = useState<number | null>(null);
  const [mainContent, setMainContent] = useState<any>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [prevSlideIndex, setPrevSlideIndex] = useState(0);
  const [direction, setDirection] = useState(0); // -1 para retroceder, 1 para avanzar
  const slideInterval = 5000; // 5 segundos entre slides
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetch("/api/mainpage")
      .then((res) => res.json())
      .then((data) => setMainContent(data))
      .catch(() => setMainContent(null));
  }, []);

  // Función para reiniciar el temporizador
  const resetTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    if (mainContent?.sliders && mainContent.sliders.length > 1) {
      timerRef.current = setInterval(() => {
        setPrevSlideIndex(currentSlide);
        setDirection(1);
        setCurrentSlide((prev) => (prev + 1) % mainContent.sliders.length);
      }, slideInterval);
    }
  };

  // Función para avanzar al siguiente slide
  const nextSlide = () => {
    if (mainContent?.sliders) {
      setPrevSlideIndex(currentSlide);
      setDirection(1); // Indicamos que vamos hacia adelante
      setCurrentSlide((prev) => (prev + 1) % mainContent.sliders.length);
      resetTimer(); // Reinicia el temporizador al avanzar manualmente
    }
  };

  // Función para retroceder al slide anterior
  const prevSlide = () => {
    if (mainContent?.sliders) {
      setPrevSlideIndex(currentSlide);
      setDirection(-1); // Indicamos que vamos hacia atrás
      setCurrentSlide((prev) =>
        prev === 0 ? mainContent.sliders.length - 1 : prev - 1
      );
      resetTimer(); // Reinicia el temporizador al retroceder manualmente
    }
  };

  // Función para ir a un slide específico
  const goToSlide = (index: number) => {
    setPrevSlideIndex(currentSlide);
    setDirection(index > currentSlide ? 1 : -1);
    setCurrentSlide(index);
    resetTimer(); // Reinicia el temporizador al cambiar de slide manualmente
  };

  // Rotación automática
  useEffect(() => {
    resetTimer();

    // Limpieza del intervalo cuando el componente se desmonta
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [mainContent?.sliders]);

  // Define las variantes de animación
  const variants = {
    enter: (direction: number) => {
      return {
        x: direction > 0 ? 1000 : -1000,
        opacity: 0,
        scale: 0.95,
      };
    },
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: "easeInOut" as const,
      },
    },
    exit: (direction: number) => {
      return {
        x: direction < 0 ? 1000 : -1000,
        opacity: 0,
        scale: 0.95,
        transition: {
          duration: 0.5,
          ease: "easeInOut" as const,
        },
      };
    },
    // Animación especial para la transición de última a primera
    exitSpecial: {
      opacity: 0,
      scale: 0.8,
      y: -50,
      transition: {
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1],
      },
    },
    // Animación especial para la transición de primera a última
    enterSpecial: {
      opacity: 0,
      scale: 0.8,
      y: 50,
      transition: {
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  };

  // Detectar transiciones especiales
  const isLastToFirstTransition =
    prevSlideIndex === mainContent?.sliders?.length - 1 && currentSlide === 0;
  const isFirstToLastTransition =
    prevSlideIndex === 0 && currentSlide === mainContent?.sliders?.length - 1;

  const services = [
    {
      title: "Jardinería Residencial",
      description: "Creamos y mantenemos jardines hermosos para tu hogar.",
    },
    {
      title: "Sistemas de Riego",
      description:
        "Instalación de sistemas eficientes para mantener tu jardín hidratado.",
    },
  ];

  return (
    <>
      <Head>
        <title>Club ViveVerde</title>
        <meta
          name="description"
          content="Accede a tu cuenta de Club ViveVerde o regístrate para disfrutar de nuestros productos ecológicos."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <InstallPWA />
      <div className="mx-auto p-6 max-w-7xl">
        <motion.h1
          className="text-5xl font-bold mb-6 text-center text-green-800"
          initial={{ opacity: 0, y: -100 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, type: "spring" as const, stiffness: 100 }}
          whileHover={{ scale: 1.05, color: "#166534" }}
        >
          Bienvenido a Club Vive<span className="text-lime-300">Verde</span>
        </motion.h1>
        {/* SLIDER PRINCIPAL */}
        <div className="mb-12 relative">
          {mainContent?.sliders && mainContent.sliders.length > 0 && (
            <Slider
              sliders={mainContent.sliders}
              currentSlide={currentSlide}
              setCurrentSlide={setCurrentSlide}
              prevSlideIndex={prevSlideIndex}
              setPrevSlideIndex={setPrevSlideIndex}
              direction={direction}
              setDirection={setDirection}
            />
          )}
        </div>
        <AboutSection />
        <motion.h2
          className="text-3xl font-semibold mb-4 text-center text-green-700"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.5, duration: 0.8, type: "spring" as const }}
          whileHover={{
            rotate: [0, -2, 2, -2, 0],
            transition: { duration: 0.5 },
          }}
        >
          Nuestros Servicios
        </motion.h2>
        <ServiceCards
          cards={mainContent?.cards}
          activeCard={activeCard}
          setActiveCard={setActiveCard}
        />
      </div>
    </>
  );
};

export default HomePage;
