import React, { useState, useContext } from "react";
import { motion } from "framer-motion";
import StatsGroup from "@/components/Admin/Dashboard/StatsGroup";
import useStats from "@/components/Admin/Dashboard/hooks/useStats";
import RecentActivity from "@/components/Admin/Dashboard/RecentActivity";
import UserGrowthChart from "@/components/Admin/Dashboard/UserGrowthChart";
import ConfigModal from "@/components/Admin/Config/ConfigModal";
import { RewardsContext } from "@/components/Admin/Sections/RewardsSection";
import { MainPageContext } from "@/components/Admin/MainPageContext"; // Actualizada la ruta de importación

const DashboardSection: React.FC = () => {
  // Obtener estadísticas reales desde el hook
  const { stats, loading, error } = useStats();

  // Obtenemos la función openAddModal del contexto de recompensas
  const { openAddModal } = useContext(RewardsContext);
  
  // Obtenemos las funciones del contexto de página principal
  const { openAddSliderModal, openAddCardModal } = useContext(MainPageContext);

  // Estado para el período del gráfico de crecimiento
  const [growthPeriod, setGrowthPeriod] = useState<"week" | "month" | "year">(
    "month"
  );

  // Estado para el modal de configuración
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring" as const, stiffness: 100 },
    },
  };

  // Datos de ejemplo como fallback (por si fallan las estadísticas reales)
  const fallbackStats = [
    {
      label: "Usuarios Totales",
      value: 0,
      change: 0,
      changeType: "increase" as const,
      icon: "users",
    },
    {
      label: "Puntos Emitidos",
      value: 0,
      change: 0,
      changeType: "increase" as const,
      icon: "coins",
    },
    {
      label: "Recompensas Canjeadas",
      value: 0,
      change: 0,
      changeType: "increase" as const,
      icon: "gift",
    },
    {
      label: "Donaciones",
      value: 0,
      change: 0,
      changeType: "increase" as const,
      icon: "hand-holding-heart",
    },
  ];

  // Usar las estadísticas reales si están disponibles, o las de ejemplo si no
  const displayStats = stats.length > 0 ? stats : fallbackStats;

  return (
    <div className="space-y-6">
      <motion.h1
        className="text-2xl font-bold text-green-800"
        variants={itemVariants}
        initial="hidden"
        animate="visible"
      >
        Panel de Control
      </motion.h1>

      {/* Sección de estadísticas */}
      {error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <p>Error al cargar estadísticas: {error}</p>
        </div>
      ) : (
        <StatsGroup stats={displayStats} loading={loading} />
      )}

      {/* Sección de gráficas y actividad reciente */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico principal */}
        <motion.div
          className="bg-white p-6 rounded-lg shadow-sm lg:col-span-2"
          variants={itemVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Cabecera con título y selector de período en la misma línea */}
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-lg text-gray-800">
              Estadísticas de usuario
            </h2>
            <div>
              <label className="text-sm font-medium text-gray-700 mr-2">
                Período:
              </label>
              <select
                value={growthPeriod}
                onChange={(e) =>
                  setGrowthPeriod(e.target.value as "week" | "month" | "year")
                }
                className="border border-gray-300 rounded-md p-2 text-sm"
              >
                <option value="week">Semana</option>
                <option value="month">Mes</option>
                <option value="year">Año</option>
              </select>
            </div>
          </div>
          {/* Aquí irá el gráfico - Componente real */}
          <UserGrowthChart period={growthPeriod} />
        </motion.div>

        {/* Actividad reciente - Ahora usa el componente real */}
        <motion.div
          className="bg-white p-6 rounded-lg shadow-sm"
          variants={itemVariants}
          initial="hidden"
          animate="visible"
        >
          <RecentActivity limit={4} />
        </motion.div>
      </div>

      {/* Sección de accesos rápidos */}
      <motion.div
        className="bg-white p-6 rounded-lg shadow-sm"
        variants={itemVariants}
        initial="hidden"
        animate="visible"
      >
        <h2 className="font-bold text-lg text-gray-800 mb-4">
          Accesos rápidos
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
            {
              title: "Nueva recompensa",
              icon: "fa-gift",
              color: "bg-purple-100 text-purple-600",
              onClick: openAddModal,
            },
            {
              title: "Añadir Slider",
              icon: "fa-images",
              color: "bg-blue-100 text-blue-600",
              onClick: openAddSliderModal, // Función del contexto MainPage
            },
            {
              title: "Añadir Tarjetas",
              icon: "fa-info-circle",
              color: "bg-green-100 text-green-600",
              onClick: openAddCardModal, // Función del contexto MainPage
            },
            {
              title: "Configuración del Sistema",
              icon: "fa-cog",
              color: "bg-gray-100 text-gray-600",
              onClick: () => setIsConfigModalOpen(true),
            },
            ].map((item, index) => (
            <div
              key={index}
              className="bg-white border border-gray-200 rounded-lg p-4 text-center cursor-pointer hover:shadow-md transition-shadow"
              onClick={item.onClick}
            >
              <div
              className={`w-12 h-12 mx-auto rounded-full ${item.color} flex items-center justify-center mb-3`}
              >
              <i className={`fas ${item.icon}`}></i>
              </div>
              <p className="text-sm font-medium text-gray-700">{item.title}</p>
            </div>
            ))}
        </div>
      </motion.div>

      {/* Modal de configuración */}
      <ConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
      />
    </div>
  );
};

export default DashboardSection;