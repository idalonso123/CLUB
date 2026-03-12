import { motion, AnimatePresence } from "framer-motion";
import { SITE_CONFIG } from "@/lib/config";

interface ServiceCardsProps {
  cards?: any[];
  activeCard: number | null;
  setActiveCard: (index: number | null) => void;
}

const fallbackServices = [
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

const ServiceCards: React.FC<ServiceCardsProps> = ({ cards, activeCard, setActiveCard }) => {
  const services = cards && cards.length > 0 ? cards : fallbackServices;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
      {services.map((card: any, index: number) => (
        <div key={card.id || index} className="relative">
          <motion.div
            className="bg-white p-6 rounded-lg shadow-md h-full cursor-pointer"
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: 0.2 + index * 0.3,
              duration: 0.8,
              type: "spring",
            }}
            whileHover={{
              scale: 1.05,
              backgroundColor: "#f0fdf4",
              y: -10,
            }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveCard(activeCard === index ? null : index)}
          >
            <div className="flex items-center mb-3 select-none">
              {card.iconClass && (
                <i className={`${card.iconClass} text-green-700 text-2xl mr-3`}></i>
              )}
              <motion.h3
                className="text-xl font-bold text-green-800"
                whileHover={{ scale: 1.05, originX: 0 }}
              >
                {card.title}
              </motion.h3>
            </div>
            <p>{card.content || card.description}</p>
          </motion.div>
        </div>
      ))}
      
      <AnimatePresence>
        {activeCard !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            onClick={() => setActiveCard(null)}
          >
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm backdrop-filter"></div>
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="bg-white p-6 rounded-lg shadow-xl border border-green-200 max-w-md mx-auto z-10 relative"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center">
                  {services[activeCard]?.iconClass && (
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mr-3">
                      <i className={`${services[activeCard].iconClass} text-green-700 text-xl`}></i>
                    </div>
                  )}
                  <h3 className="text-xl font-bold text-green-800">
                    {services[activeCard]?.title}
                  </h3>
                </div>
                <motion.button
                  className="text-gray-500 hover:text-gray-700 focus:outline-none"
                  onClick={() => setActiveCard(null)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </motion.button>
              </div>
              <p className="mb-4">
                {services[activeCard]?.content || services[activeCard]?.description}
              </p>
              <p className="text-sm mb-4">
                Haga clic para solicitar más información sobre este servicio.
              </p>
              <motion.a
                href={services[activeCard]?.contactUrl || SITE_CONFIG.external.contactPage}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-2 bg-green-800 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {services[activeCard]?.buttonText || (services[activeCard]?.title ? `Contactar` : "Contactar")}
              </motion.a>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ServiceCards;
