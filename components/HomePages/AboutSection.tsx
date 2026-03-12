import { motion } from "framer-motion";

const AboutSection = () => (
  <motion.div
    className="bg-green-50 p-6 rounded-lg shadow-md mb-12 mt-12 overflow-hidden"
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay: 0.5, duration: 0.8, type: "spring" }}
    whileHover={{ boxShadow: "0px 8px 13px rgba(0, 0, 0, 0.2)", y: -5 }}
  >
    <motion.p
      className="mb-4 text-lg"
      initial={{ opacity: 0, x: -200 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.8, duration: 0.8, type: "spring" }}
    >
      Somos expertos en transformar espacios verdes con más de 10 años de
      experiencia. Nuestro equipo de profesionales está listo para hacer
      realidad el jardín de tus sueños.
    </motion.p>
    <motion.p
      className="text-lg"
      initial={{ opacity: 0, x: 200 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 1.2, duration: 0.8, type: "spring" }}
    >
      Desde el diseño inicial hasta el mantenimiento continuo, ofrecemos
      servicios completos de jardinería para hogares y negocios en toda la
      región.
    </motion.p>
  </motion.div>
);

export default AboutSection;
