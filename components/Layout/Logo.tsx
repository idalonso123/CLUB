import Link from 'next/link';
import { motion } from 'framer-motion';

interface LogoProps {
  white?: boolean;
}

const Logo: React.FC<LogoProps> = ({ white = false }) => {
    const viveText = "Vive";
    const verdeText = "Verde";
    
    // Variantes para el contenedor principal
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { 
            opacity: 1, 
            transition: { 
                staggerChildren: 0.1,
                delayChildren: 0.2
            }
        },
        hover: {
            scale: 1.05,
            transition: { duration: 0.3 }
        },
        tap: {
            scale: 0.95
        }
    };

    // Variantes para cada letra
    const letterVariants = {
        hidden: { opacity: 0, y: -20 },
        visible: { 
            opacity: 1, 
            y: 0,
            transition: { 
                type: "spring", 
                damping: 10,
                stiffness: 100 
            }
        }
    };

    // Variantes para cada letra verde
    const greenLetterVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { 
            opacity: 1, 
            y: 0,
            transition: { 
                type: "spring", 
                damping: 10,
                stiffness: 100 
            }
        }
    };

    // Variantes para la línea inferior
    const lineVariants = {
        hidden: { width: "0%", opacity: 0 },
        visible: { width: "0%", opacity: 1, transition: { duration: 0.3 } },
        hover: { width: "100%", transition: { duration: 0.5 } }
    };

    // Clases de color según la prop white
    const viveClass = white ? "text-white text-2xl font-bold" : "text-green-900 text-2xl font-bold";
    const verdeClass = white ? "text-green-300 text-2xl font-bold" : "text-lime-300 text-2xl font-bold";
    const lineClass = white ? "absolute -bottom-1 left-0 h-0.5 bg-white" : "absolute -bottom-1 left-0 h-0.5 bg-green-700";

    return (
        <motion.div 
            className="logo-container relative cursor-pointer"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            whileHover="hover"
            whileTap="tap"
        >
          <Link href="/">
            <div className="flex items-center relative">
              {/* Animación letra por letra para "Vive" */}
              <div className="flex">
                {viveText.split('').map((char, index) => (
                    <motion.span
                        key={`vive-${index}`}
                        className={viveClass}
                        variants={letterVariants}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ 
                            y: -5, 
                            transition: { 
                                duration: 0.2, 
                                delay: 0
                            }
                        }}
                    >
                        {char}
                    </motion.span>
                ))}
              </div>
              
              {/* Animación letra por letra para "Verde" */}
              <div className="flex">
                {verdeText.split('').map((char, index) => (
                    <motion.span
                        key={`verde-${index}`}
                        className={verdeClass}
                        variants={greenLetterVariants}
                        transition={{ delay: viveText.length * 0.1 + index * 0.1 }}
                        whileHover={{ 
                            y: -5, 
                            transition: { 
                                duration: 0.2, 
                                delay: 0
                            }
                        }}
                    >
                        {char}
                    </motion.span>
                ))}
              </div>
              
              {/* Línea animada debajo del texto */}
              <motion.div
                className={lineClass}
                variants={lineVariants}
              />
            </div>
          </Link>
        </motion.div>
    );
};

export default Logo;