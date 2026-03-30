import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Head from "next/head";
import { NextPage } from "next";
import { useRouter } from "next/router";
import { Reward, Redemption } from "@/types/rewards";
import { UserData } from "@/types/user";
import LoadingSpinner from "@/components/Common/LoadingSpinner";
import Button from "@/components/Common/Button";
import UserPointsCard from "@/components/Rewards/UserPointsCard";
import SearchFilterBar from "@/components/Rewards/SearchFilterBar";
import RewardsList from "@/components/Rewards/RewardsList";
import RedemptionHistory from "@/components/Rewards/RedemptionHistory";
import RedemptionModal from "@/components/Rewards/RedemptionModal";
import { generatePageTitle, getCompanyName, getTermsUsageUrl } from "@/lib/utils/pageUtils";
import { SITE_CONFIG } from "@/lib/config";

const RewardsPage: NextPage = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
  const [userData, setUserData] = useState<UserData>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phonePrefix: "",
    phone: "",
    city: "",
    postalCode: "",
    country: "",
    points: 0,
  });

  const [rewards, setRewards] = useState<Reward[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [showHistory, setShowHistory] = useState<boolean>(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [isRedemptionSuccessful, setIsRedemptionSuccessful] = useState(false);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const checkUserPermission = async () => {
      try {
        // Primero verificamos autenticación
        const authResponse = await fetch("/api/auth/refresh", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (authResponse.ok) {
          setIsAuthorized(true);

          // Luego obtenemos el perfil completo del usuario
          const profileResponse = await fetch("/api/user/profile");

          if (profileResponse.ok) {
            const profileData = await profileResponse.json();

            if (profileData.success && profileData.user) {
              setUserData(profileData.user);

              // Una vez autenticado, cargar las recompensas y el historial
              fetchRewards();
              fetchRedemptionHistory();
            } else {
              throw new Error(
                profileData.message || "Error al cargar el perfil"
              );
            }
          } else {
            throw new Error(
              `Error ${profileResponse.status}: ${profileResponse.statusText}`
            );
          }
        } else {
          router.replace("/login?redirect=/rewards");
        }
      } catch (error) {
        console.error("Error al verificar permisos:", error);
        router.replace("/login?redirect=/rewards");
      } finally {
        setIsLoading(false);
      }
    };

    checkUserPermission();
  }, [router]);

  // Cargar recompensas desde la API
  const fetchRewards = async () => {
    try {
      const response = await fetch("/api/rewards");
      if (!response.ok) {
        throw new Error("Error al cargar recompensas");
      }

      const data = await response.json();

      if (data.success) {
        setRewards(data.rewards);
        setCategories(data.categories || []);
      } else {
        console.error("Error en la respuesta:", data.message);
      }
    } catch (error) {
      console.error("Error al obtener recompensas:", error);
    }
  };

  // Cargar historial de canjes
  const fetchRedemptionHistory = async () => {
    try {
      const response = await fetch("/api/rewards/history");
      if (!response.ok) {
        throw new Error("Error al cargar historial de canjes");
      }

      const data = await response.json();

      if (data.success) {
        setRedemptions(data.redemptions);
      } else {
        console.error("Error en la respuesta:", data.message);
      }
    } catch (error) {
      console.error("Error al obtener historial de canjes:", error);
    }
  };

  // Variantes de animación para el contenedor
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring" as const, stiffness: 100 },
    },
  };

  // Manejar selección de recompensa para canjear
  const handleRedeemClick = (reward: Reward) => {
    setSelectedReward(reward);
    setIsModalOpen(true);
    setErrorMessage("");
  };

  // Confirmar el canje de la recompensa
  const confirmRedemption = async (notes: string) => {
    if (!selectedReward) return;

    setIsRedeeming(true);
    setErrorMessage("");

    try {
      // Llamada real a la API para canjear recompensa
      const response = await fetch("/api/rewards/redeem", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rewardId: selectedReward.id,
          shippingAddress: "", // Usando string vacío ya que no se recolecta dirección
          notes,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Actualizar los puntos del usuario en el objeto userData
        setUserData((prev) => ({
          ...prev,
          points: data.redemption.remainingPoints,
        }));

        // Actualizar las recompensas (marcar como canjeada, excepto cuando permite canjeo múltiple)
        setRewards((prevRewards) =>
          prevRewards.map((reward) =>
            reward.id === selectedReward.id
              ? {
                  ...reward,
                  // Solo marcar como canjeada si NO permite canjeo múltiple
                  redeemed: reward.canjeoMultiple ? false : true,
                  // Si el stock es -1 (ilimitado), mantenerlo así, de lo contrario decrementar
                  stock: reward.stock === -1 ? -1 : reward.stock - 1,
                  // Si el stock es -1 (ilimitado) o mayor que 1 después de decrementar, mantener disponible
                  available: reward.stock === -1 || reward.stock > 1,
                }
              : reward
          )
        );

        // Actualizar el historial de canjes
        fetchRedemptionHistory();

        // Mostrar mensaje de éxito
        setIsRedemptionSuccessful(true);

        // Cerrar modal después de un tiempo
        setTimeout(() => {
          setIsModalOpen(false);
          setIsRedemptionSuccessful(false);
        }, 2000);
      } else {
        setErrorMessage(data.message || "Error al canjear recompensa");
      }
    } catch (error) {
      console.error("Error al canjear recompensa:", error);
      setErrorMessage("Error al comunicarse con el servidor");
    } finally {
      setIsRedeeming(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner size="lg" message="Cargando..." />
      </div>
    );
  }

  // Si no está logueado, mostrar mensaje para iniciar sesión
  if (!isAuthorized) {
    const companyName = getCompanyName();
    return (
      <>
        <Head>
          <title>{generatePageTitle("Recompensas")}</title>
          <meta
          name="description"
          content={`Accede a tu cuenta de ${companyName} o regístrate para disfrutar de recompensas exclusivas.`}
          />
        </Head>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <h1 className="text-3xl font-bold text-green-800 mb-8">
            Recompensas {companyName}
          </h1>
          <div className="bg-white p-8 rounded-lg shadow-md text-center">
            <h2 className="text-xl font-semibold mb-4">
              Inicia sesión para ver y canjear recompensas
            </h2>
            <p className="mb-6">
              Las recompensas son exclusivas para miembros de nuestro Club
              {companyName}.
            </p>
            <Link href={SITE_CONFIG.pages.login}>
              <Button variant="success" icon="fas fa-sign-in-alt">
                Iniciar Sesión
              </Button>
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>{generatePageTitle("Recompensas")}</title>
        <meta
          name="description"
          content={`Accede a tu cuenta de ${getCompanyName()} o regístrate para disfrutar de recompensas exclusivas.`}
        />
      </Head>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Cabecera */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="mb-8"
        >
          <motion.h1
            variants={itemVariants}
            className="text-3xl font-bold text-green-800 mb-2"
          >
            Recompensas Club ViveVerde
          </motion.h1>
          <motion.p variants={itemVariants} className="text-gray-600">
            Canjea tus puntos por recompensas exclusivas
          </motion.p>
        </motion.div>

        {/* Panel de puntos - Pasar userData.points en lugar de userPoints */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="mb-4"
        >
          <UserPointsCard userPoints={userData.points} />
        </motion.div>

        {/* Términos y condiciones */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="mb-8"
        >
          <TermsAndConditionsDropdown />
        </motion.div>

        {/* Botones para alternar entre recompensas e historial */}
        <div className="mb-6 flex justify-center md:justify-start">
          <div className="bg-white rounded-lg shadow-sm inline-flex p-1">
            <button
              onClick={() => setShowHistory(false)}
              className={`px-4 py-2 rounded-md ${
                !showHistory
                  ? "bg-green-700 text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <i className="fas fa-gift mr-2"></i>
              Recompensas
            </button>
            <button
              onClick={() => setShowHistory(true)}
              className={`px-4 py-2 rounded-md ${
                showHistory
                  ? "bg-green-700 text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <i className="fas fa-history mr-2"></i>
              Historial
            </button>
          </div>
        </div>

        {showHistory ? (
          /* Mostrar el componente de historial */
          <RedemptionHistory redemptions={redemptions} />
        ) : (
          /* Recompensas */
          <>
            {/* Barra de búsqueda y filtros */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={containerVariants}
              className="mb-8"
            >
              <SearchFilterBar
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                categories={categories}
              />
            </motion.div>

            {/* Lista de recompensas - Pasar userData.points */}
            <RewardsList
              rewards={rewards}
              userPoints={userData.points}
              onRedeemClick={handleRedeemClick}
              searchTerm={searchTerm}
              selectedCategory={selectedCategory}
            />
          </>
        )}

        {/* Modal de confirmación de canje - Pasar userData.points */}
        {selectedReward && (
          <RedemptionModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            reward={selectedReward}
            userPoints={userData.points}
            onConfirmRedemption={confirmRedemption}
            isRedeeming={isRedeeming}
            isSuccess={isRedemptionSuccessful}
            errorMessage={errorMessage}
          />
        )}
      </div>


    </>
  );
};

// Componente para el desplegable de términos y condiciones
const TermsAndConditionsDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <button
        onClick={toggleDropdown}
        className="w-full flex items-center justify-between p-4 text-left font-medium text-green-800 hover:bg-green-50 transition-colors duration-150"
      >
        <span className="flex items-center">
          <i className="fas fa-info-circle mr-2"></i>
          Términos y Condiciones de Uso - Club ViveVerde
        </span>
        <i className={`fas fa-chevron-${isOpen ? 'up' : 'down'} transition-transform duration-200`}></i>
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="p-4 bg-gray-50 text-gray-700 text-sm">
              <ul className="space-y-3">
                <li className="flex">
                  <i className="fas fa-circle text-[0.5rem] text-green-700 mt-2 mr-2"></i>
                  <span className="text-base">Club Viveverde es un programa gratuito que premia la confianza de nuestros clientes habituales mediante un sistema de puntos y niveles que ofrecen ventajas exclusivas. Al unirte aceptas los siguientes términos y condiciones</span>
                </li>
                <li className="flex">
                  <i className="fas fa-circle text-[0.5rem] text-green-700 mt-2 mr-2"></i>
                  <span className="text-base">Es imprescindible completar correctamente todos los datos personales requeridos para acceder a las ventajas de Club ViveVerde. La falta de cualquiera de estos datos inhabilita automáticamente la participación en el programa, así como el acceso a descuentos, promociones y beneficios asociados.</span>
                </li>
                <li className="flex">
                  <i className="fas fa-circle text-[0.5rem] text-green-700 mt-2 mr-2"></i>
                  <a
                    href={getTermsUsageUrl()} 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-base text-green-800 hover:underline"
                  >
                    Leer más sobre los Términos y Condiciones de Uso - Club ViveVerde
                  </a>
                </li>
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RewardsPage;
