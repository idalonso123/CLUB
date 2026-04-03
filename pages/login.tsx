import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Head from "next/head";
import Login from "@/components/Auth/Login";
import Register from "@/components/Auth/Register";
import { User } from "@/types/user";
import HelpModal from "@/components/Common/HelpModal";
import { TEXTS } from "@/lib/constants/texts";
import { SITE_CONFIG } from "@/lib/config";

const LoginPage = () => {
  const [activeTab, setActiveTab] = useState("login");
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

  // Definición de animaciones
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.5,
        when: "beforeChildren",
        staggerChildren: 0.2,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring" as const,
        stiffness: 100,
        damping: 15,
      },
    },
  };

  const tabVariants = {
    inactive: { scale: 1 },
    active: {
      scale: 1.05,
      transition: {
        type: "spring" as const,
        stiffness: 300,
        damping: 20,
      },
    },
  };

  const formVariants = {
    hidden: { opacity: 0, x: activeTab === "login" ? -40 : 40 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        type: "spring" as const,
        stiffness: 300,
        damping: 20,
      },
    },
    exit: {
      opacity: 0,
      x: activeTab === "login" ? 40 : -40,
      transition: {
        duration: 0.2,
      },
    },
  };

  const handleLogin = (userData: User, rememberMe: boolean) => {
    // Limpiar cualquier dato de usuario existente
    localStorage.removeItem("user");
    sessionStorage.removeItem("user");

    // Luego continuar con el almacenamiento de los nuevos datos
    if (rememberMe) {
      localStorage.setItem("user", JSON.stringify(userData));
    } else {
      sessionStorage.setItem("user", JSON.stringify(userData));
    }
  };

  return (
    <>
      {/* Modal de Ayuda - Completamente fuera del componente Login */}
      <HelpModal 
        isOpen={isHelpModalOpen} 
        onClose={() => setIsHelpModalOpen(false)} 
      />
      
      <Head>
        <title>{`${activeTab === "login" ? TEXTS.auth.login.title : TEXTS.auth.register.title} - ${SITE_CONFIG.seo.titleSuffix}`}</title>
        <meta
          name="description"
          content={activeTab === "login" ? TEXTS.auth.login.subtitle : TEXTS.auth.register.subtitle}
        />
      </Head>

      <motion.div
        className="min-h-[80vh] flex items-center justify-center py-8 px-4 sm:px-6 lg:px-8"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <div className="flex flex-col items-center w-full max-w-md">
          <motion.div
            className="w-full mb-6 text-center"
            variants={cardVariants}
          >
            <h1 className="text-3xl font-bold text-green-800">
              {activeTab === "login"
                ? TEXTS.auth.login.welcomeBack
                : TEXTS.auth.register.title}
            </h1>
            <p className="mt-2 text-gray-600">
              {activeTab === "login"
                ? TEXTS.auth.login.subtitle
                : TEXTS.auth.register.subtitle}
            </p>
          </motion.div>

          <motion.div
            className="bg-white rounded-lg shadow-md overflow-hidden w-full"
            variants={cardVariants}
            whileHover={{
              boxShadow: "0px 8px 20px rgba(0, 0, 0, 0.10)",
              y: -5,
            }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex border-b border-gray-200">
              <motion.button
                className={`w-1/2 py-4 text-center font-medium transition-colors ${
                  activeTab === "login"
                    ? "border-b-2 border-green-800 text-green-800 bg-green-50/50"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }`}
                onClick={() => setActiveTab("login")}
                variants={tabVariants}
                animate={activeTab === "login" ? "active" : "inactive"}
                whileTap={{ scale: 0.95 }}
              >
                <span className="flex items-center justify-center">
                  <i className="fas fa-sign-in-alt mr-2"></i>
                  {TEXTS.common.buttons.login}
                </span>
              </motion.button>
              <motion.button
                className={`w-1/2 py-4 text-center font-medium transition-colors ${
                  activeTab === "register"
                    ? "border-b-2 border-green-800 text-green-800 bg-green-50/50"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }`}
                onClick={() => setActiveTab("register")}
                variants={tabVariants}
                animate={activeTab === "register" ? "active" : "inactive"}
                whileTap={{ scale: 0.95 }}
              >
                <span className="flex items-center justify-center">
                  <i className="fas fa-user-plus mr-2"></i>
                  {TEXTS.common.buttons.register}
                </span>
              </motion.button>
            </div>
            <AnimatePresence mode="wait">
              {activeTab === "login" ? (
                <motion.div
                  className="p-6"
                  key="login"
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  variants={formVariants}
                >
                  <Login onOpenHelpModal={() => setIsHelpModalOpen(true)} />
                </motion.div>
              ) : (
                <motion.div
                  className="p-6"
                  key="register"
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  variants={formVariants}
                >
                  <Register />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          <motion.div
            className="mt-6 text-center text-sm text-gray-600"
            variants={cardVariants}
          >
            {activeTab === "login" ? (
              <p>
                {TEXTS.auth.login.forgotPassword}{" "}
                <a
                  href={SITE_CONFIG.pages.resetPassword}
                  className="text-green-800 hover:underline"
                >
                  {TEXTS.auth.login.forgotPassword}
                </a>
              </p>
            ) : (
              <p>
                Al registrarte, aceptas nuestros{" "}
                <a href={SITE_CONFIG.external.termsAndConditions} target="_blank" rel="noopener noreferrer" className="text-green-800 hover:underline">
                  {TEXTS.auth.register.termsLink}
                </a>{" "}
                y nuestra{" "}
                <a href={SITE_CONFIG.external.privacyPolicy} target="_blank" rel="noopener noreferrer" className="text-green-800 hover:underline">
                  {TEXTS.auth.register.privacyLink}
                </a>
              </p>
            )}
          </motion.div>
        </div>
      </motion.div>
    </>
  );
};

export default LoginPage;
