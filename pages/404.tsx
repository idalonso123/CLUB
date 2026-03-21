import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export default function Custom404() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(10);

  // Efecto para redirigir automáticamente después de 10 segundos
  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/");
    }, 10000);

    const interval = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [router]);

  // Variantes para las animaciones
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delay: 0.3,
        when: "beforeChildren",
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
      },
    },
  };

  const leafVariants = {
    initial: { rotate: 0, y: -20, x: -10 },
    animate: {
      rotate: [0, 5, -5, 3, 0],
      y: [0, -10, 5, -15, 0],
      x: [0, 5, -3, 8, 0],
      transition: {
        duration: 6,
        ease: "easeInOut",
        repeat: Infinity,
        repeatType: "reverse" as const,
      },
    },
  };

  return (
    <div className="h-full w-full flex items-center justify-center p-4 sm:p-6 md:p-8">
      <motion.div
        className="max-w-xs sm:max-w-md md:max-w-2xl w-full bg-white rounded-lg shadow-xl overflow-hidden flex flex-col md:flex-row"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Columna verde - Lado izquierdo en desktop, arriba en móvil */}
        <div className="w-full md:w-1/3 bg-green-800 p-4 sm:p-6 md:p-8 flex items-center justify-center relative">
          {/* Hoja decorativa superior */}
          <motion.div
            className="absolute top-3 sm:top-4 md:top-5 left-3 sm:left-4 md:left-5 text-green-200 opacity-50"
            variants={leafVariants}
            initial="initial"
            animate="animate"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12"
            >
              <path
                d="M15.75 17.25C12.17 17.25 9.25 14.33 9.25 10.75C9.25 7.17 12.17 4.25 15.75 4.25C19.33 4.25 22.25 7.17 22.25 10.75V12.25C22.25 15.13 19.93 17.45 17.05 17.45H15.75M15.75 17.25V17.45M15.75 17.25C9.45 17.25 4.25 12.05 4.25 5.75V4.25H5.75C12.05 4.25 17.25 9.45 17.25 15.75V17.25H15.75Z"
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </motion.div>

          {/* Contenido central */}
          <motion.div
            variants={itemVariants}
            className="text-center py-4 sm:py-6 md:py-8"
          >
            <motion.h1
              className="text-4xl sm:text-5xl md:text-6xl text-white font-bold"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 100, delay: 0.5 }}
            >
              404
            </motion.h1>
            <motion.div
              className="mt-2 text-green-100 text-sm sm:text-base"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              Página no encontrada
            </motion.div>
          </motion.div>

          {/* Hoja decorativa inferior */}
          <motion.div
            className="absolute bottom-3 sm:bottom-4 md:bottom-5 right-3 sm:right-4 md:right-5 text-green-200 opacity-50"
            variants={leafVariants}
            initial="initial"
            animate="animate"
            custom={1}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16"
            >
              <path
                fillRule="evenodd"
                d="M12.963 2.286a.75.75 0 00-1.071-.136 9.742 9.742 0 00-3.539 6.177A7.547 7.547 0 016.648 6.61a.75.75 0 00-1.152-.082A9 9 0 1015.68 4.534a7.46 7.46 0 01-2.717-2.248zM15.75 14.25a3.75 3.75 0 11-7.313-1.172c.628.465 1.35.81 2.133 1a5.99 5.99 0 011.925-3.545 3.75 3.75 0 013.255 3.717z"
                clipRule="evenodd"
              />
            </svg>
          </motion.div>
        </div>

        {/* Contenido principal - Lado derecho en desktop, abajo en móvil */}
        <div className="w-full md:w-2/3 p-4 sm:p-6 md:p-8">
          <motion.h2
            className="text-xl sm:text-2xl text-green-800 font-bold mb-3 sm:mb-4"
            variants={itemVariants}
          >
            ¡Ups! Parece que te has perdido en nuestro jardín...
          </motion.h2>

          <motion.p
            className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6"
            variants={itemVariants}
          >
            La página que estás buscando no existe o ha sido trasladada. No te
            preocupes, nuestro equipo de jardineros ya está investigando dónde
            se ha ido.
          </motion.p>

          {/* Botones de acción */}
          <motion.div
            className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 md:space-x-4"
            variants={itemVariants}
          >
            <motion.button
              onClick={() => router.back()}
              className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-gray-200 text-gray-800 rounded-full hover:bg-gray-300 transition-colors text-sm sm:text-base"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-4 h-4 sm:w-5 sm:h-5 mr-2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3"
                  />
                </svg>
                Volver atrás
              </span>
            </motion.button>

            <Link href="/" className="w-full sm:w-auto">
              <motion.button
                className="w-full px-4 py-2 bg-green-800 text-white rounded-full hover:bg-green-700 transition-colors text-sm sm:text-base"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-4 h-4 sm:w-5 sm:h-5 mr-2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
                    />
                  </svg>
                  Ir al la Página Principal
                </span>
              </motion.button>
            </Link>
          </motion.div>

          {/* Información de redirección */}
          <motion.div
            className="mt-6 sm:mt-8 text-xs sm:text-sm text-gray-500"
            variants={itemVariants}
          >
            <p>
              Serás redirigido automáticamente a la página principal en{" "}
              <span className="font-bold text-green-800">{countdown}</span>{" "}
              segundos.
            </p>
          </motion.div>

          {/* Barra de progreso */}
          <motion.div
            className="mt-2 sm:mt-4 h-1 sm:h-2 bg-gray-100 rounded-full overflow-hidden"
            variants={itemVariants}
          >
            <motion.div
              className="h-full bg-green-800"
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: 10, ease: "linear" }}
            />
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
