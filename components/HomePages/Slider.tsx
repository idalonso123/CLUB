import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { useRef, useEffect } from "react";

interface SliderProps {
  sliders: any[];
  currentSlide: number;
  setCurrentSlide: (index: number) => void;
  prevSlideIndex: number;
  setPrevSlideIndex: (index: number) => void;
  direction: number;
  setDirection: (dir: number) => void;
  slideInterval?: number;
}

const variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 1000 : -1000,
    opacity: 0,
    scale: 0.95,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: "easeInOut" },
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 1000 : -1000,
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.5, ease: "easeInOut" },
  }),
  exitSpecial: {
    opacity: 0,
    scale: 0.8,
    y: -50,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
  enterSpecial: {
    opacity: 0,
    scale: 0.8,
    y: 50,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};

const Slider = ({
  sliders,
  currentSlide,
  setCurrentSlide,
  prevSlideIndex,
  setPrevSlideIndex,
  direction,
  setDirection,
  slideInterval = 10000,
}: SliderProps) => {
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Rotación automática
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (sliders && sliders.length > 1) {
      timerRef.current = setInterval(() => {
        setPrevSlideIndex(currentSlide);
        setDirection(1);
        const next = (currentSlide + 1) % sliders.length;
        setCurrentSlide(next);
      }, slideInterval);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line
  }, [sliders, currentSlide]);

  const nextSlide = () => {
    setPrevSlideIndex(currentSlide);
    setDirection(1);
    const next = (currentSlide + 1) % sliders.length;
    setCurrentSlide(next);
  };
  const prevSlide = () => {
    setPrevSlideIndex(currentSlide);
    setDirection(-1);
    const prev = currentSlide === 0 ? sliders.length - 1 : currentSlide - 1;
    setCurrentSlide(prev);
  };
  const goToSlide = (index: number) => {
    setPrevSlideIndex(currentSlide);
    setDirection(index > currentSlide ? 1 : -1);
    setCurrentSlide(index);
  };

  const isLastToFirstTransition =
    prevSlideIndex === sliders.length - 1 && currentSlide === 0;
  const isFirstToLastTransition =
    prevSlideIndex === 0 && currentSlide === sliders.length - 1;

  // Función para manejar el gesto de deslizamiento
  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    // Si el deslizamiento es hacia la izquierda (offset.x negativo), avanzamos al siguiente slide
    if (info.offset.x < -50) {
      nextSlide();
    }
    // Si el deslizamiento es hacia la derecha (offset.x positivo), retrocedemos al slide anterior
    else if (info.offset.x > 50) {
      prevSlide();
    }
  };

  return (
    <div className="w-full overflow-hidden rounded-xl shadow-lg relative h-[500px] sm:h-[400px] md:h-96">
      <AnimatePresence initial={false} custom={direction} mode="wait">
        <motion.div
          key={currentSlide}
          custom={direction}
          variants={variants}
          initial={isLastToFirstTransition ? "enterSpecial" : "enter"}
          animate="center"
          exit={isFirstToLastTransition ? "exitSpecial" : "exit"}
          className="absolute w-full h-full inset-0"
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={handleDragEnd}
        >
          <div className="min-w-full bg-white flex flex-col md:flex-row overflow-hidden h-full w-full">
            {/* Imagen del slider - altura reducida en móvil para dejar espacio al contenido */}
            <div className="w-full md:w-3/5 h-1/2 sm:h-3/5 md:h-full relative">
              <img
                src={sliders[currentSlide].imageUrl}
                alt={sliders[currentSlide].title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/placeholder.jpg";
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-b md:bg-gradient-to-r from-transparent to-black/20"></div>
              {/* Botón en pantallas medianas y grandes (abajo) */}
              {sliders[currentSlide].buttonText && (
                <div className="hidden md:block absolute bottom-6 left-6 z-10">
                  <a
                    href={sliders[currentSlide].buttonUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block px-5 py-2.5 bg-green-700/90 text-white rounded-lg hover:bg-green-800 transition-all hover:scale-105 text-sm font-medium shadow-md backdrop-blur-sm cursor-pointer"
                  >
                    {sliders[currentSlide].buttonText}
                  </a>
                </div>
              )}
            </div>
            {/* Contenido del slider - más espacio en móvil */}
            <div className="w-full md:w-2/5 p-4 sm:p-5 md:p-6 flex flex-col justify-center bg-gradient-to-r from-white to-green-50 h-1/2 sm:h-2/5 md:h-full">
              <motion.h2
                className="text-xl sm:text-2xl font-bold text-green-800 mb-2 sm:mb-3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.4 }}
              >
                {sliders[currentSlide].title}
              </motion.h2>
              <motion.p
                className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4 line-clamp-3 sm:line-clamp-4 md:line-clamp-none"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.4 }}
              >
                {sliders[currentSlide].description}
              </motion.p>
              {/* Botón visible solo en móvil y tablets pequeñas */}
              {sliders[currentSlide].buttonText && (
                <motion.div 
                  className="md:hidden mt-1 text-left"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.4 }}
                >
                  <a
                    href={sliders[currentSlide].buttonUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block px-4 py-2 bg-green-700/90 text-white rounded-lg hover:bg-green-800 transition-all text-sm font-medium shadow-md cursor-pointer"
                  >
                    {sliders[currentSlide].buttonText}
                  </a>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full z-10 transition-all hover:bg-green-600/20 hover:backdrop-blur-sm"
        aria-label="Slide anterior"
      >
        <i className="fa-solid fa-chevron-left text-green-800 text-xl drop-shadow-lg hover:text-white"></i>
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full z-10 transition-all hover:bg-green-600/20 hover:backdrop-blur-sm"
        aria-label="Siguiente slide"
      >
        <i className="fa-solid fa-chevron-right text-green-800 text-xl drop-shadow-lg hover:text-white"></i>
      </button>
      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 rounded-full p-2">
        {sliders.map((_: any, index: number) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-3 h-3 rounded-full transition-all ${
              index === currentSlide ? "bg-green-600 w-6" : "bg-white/70 hover:bg-white"
            }`}
            aria-label={`Ir al slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default Slider;
