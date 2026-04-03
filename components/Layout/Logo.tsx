import Link from 'next/link';
import { motion } from 'framer-motion';

interface LogoProps {
  white?: boolean;
}

const Logo: React.FC<LogoProps> = ({ white = false }) => {
    // Variantes para el contenedor principal
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { 
            opacity: 1, 
            transition: { 
                duration: 0.5 
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
              {/* Logo como imagen */}
              <img 
                src="/icons/Logo-ViveVerde-Header.png" 
                alt="ViveVerde Logo" 
                className="h-[60px] w-auto object-contain"
                style={{ 
                    filter: white ? 'brightness(0) invert(1)' : 'none',
                    imageRendering: 'auto'
                }}
              />
            </div>
          </Link>
        </motion.div>
    );
};

export default Logo;
