import React from "react";
import { motion } from "framer-motion";
import { COMPANY_CONFIG } from "@/lib/config";

interface TopBarProps {
  isAdminRoute: boolean;
}

const TopBar: React.FC<TopBarProps> = ({ isAdminRoute }) => {
  return (
    <motion.div
      className={`hidden md:block w-full p-2 bg-green-900 text-white bg-[url('/banner/Top-bar-leafs-green.svg')] bg-cover ${!isAdminRoute ? 'fixed top-0 w-full z-40' : ''}`}
    >
      <div className="relative max-w-7xl mx-auto px-4">
        {/* Teléfono */}
        <motion.div
          className="absolute left-4 top-1/2 transform -translate-y-1/2 py-1"
        >
          <motion.span
            className="inline-flex items-center"
          >
            <i className="fa-solid fa-phone mr-2"></i> {COMPANY_CONFIG.phone.prefix} {COMPANY_CONFIG.phone.main}
          </motion.span>
        </motion.div>

        {/* Horario y Email */}
        <div className="flex justify-center items-center w-full px-4 py-1">
          <div className="flex flex-row space-x-4 lg:space-x-16 xl:space-x-72 justify-center">
            <motion.div className="px-2">
              <motion.span
                className="inline-flex items-center text-sm lg:text-base"
              >
                <i className="fa-regular fa-clock mr-2"></i> Lunes - Domingo:
                10:00 - 21:00
              </motion.span>
            </motion.div>
            <motion.div className="px-2">
              <motion.span
                className="inline-flex items-center text-sm lg:text-base"
              >
                <i className="fa-regular fa-envelope mr-2"></i>{" "}
                {COMPANY_CONFIG.email.primary}
              </motion.span>
            </motion.div>
          </div>
        </div>

        {/* Redes Sociales */}
        <motion.div
          className="absolute right-4 top-1/2 transform -translate-y-1/2 space-x-4 py-1"
        >
          <motion.a
            href={COMPANY_CONFIG.socialMedia.facebook}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block"
          >
            <i className="fa-brands fa-facebook"></i>
          </motion.a>
          <motion.a
            href={COMPANY_CONFIG.socialMedia.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block"
          >
            <i className="fa-brands fa-instagram"></i>
          </motion.a>
          <motion.a
            href={COMPANY_CONFIG.socialMedia.tiktok}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block"
          >
            <i className="fa-brands fa-tiktok"></i>
          </motion.a>
          <motion.a
            href={COMPANY_CONFIG.googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block"
          >
            <i className="fa-solid fa-location-dot"></i>
          </motion.a>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default TopBar;