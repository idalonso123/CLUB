import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { User } from "@/types/user";
import { SearchFormProps, SacoBarrasItem, AddBalanceResult, PetCard, ProductoCarnet } from "@/types/teller";
import SearchForm from "@/components/Teller/TellerComponents/SearchForm";
import UsersTable from "@/components/Teller/TellerComponents/UsersTable";
import AddBalanceModal from "@/components/Teller/TellerComponents/AddBalanceModal";
import RedemptionsModal from "@/components/Teller/TellerComponents/RedemptionsModal";
import OfferRewardsModal from "@/components/Teller/TellerComponents/OfferRewardsModal";
import PetCardModal from "@/components/Teller/TellerComponents/PetCardModal";

interface TellerDashboardProps {
  userRole?: string | null;
  isTPV?: boolean;
}

const TellerDashboard: React.FC<TellerDashboardProps> = ({ userRole, isTPV = false }) => {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [searching, setSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [amount, setAmount] = useState("");
  const [isCarnetAnimal, setIsCarnetAnimal] = useState(false);
  const [sacos, setSacos] = useState<SacoBarrasItem[]>([]);
  const [addPointsResult, setAddPointsResult] = useState<{
    success: boolean;
    message: string;
    puntosAñadidos?: number;
    puntosTotales?: number;
  } | null>(null);
  const [userRedemptions, setUserRedemptions] = useState<any[]>([]);
  const [redemptionMsg, setRedemptionMsg] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRedemptionsModalOpen, setIsRedemptionsModalOpen] = useState(false);
  const [isOfferRewardsModalOpen, setIsOfferRewardsModalOpen] = useState(false);
  const [isPetCardModalOpen, setIsPetCardModalOpen] = useState(false);
  const [preselectedProduct, setPreselectedProduct] = useState<any>(null);
  const [redeemResult, setRedeemResult] = useState<{success: boolean; message: string} | null>(null);
  const [petCards, setPetCards] = useState<PetCard[]>([]);
  const [petCardResult, setPetCardResult] = useState<{success: boolean; message: string} | null>(null);
  const [petCardLoading, setPetCardLoading] = useState(false);
  
  // Ref para manejar la tecla Enter en TPV
  const lastEnterPressRef = useRef<number>(0);

  // Función de búsqueda con debounce
  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      setError("");
      return;
    }
    
    setSearching(true);
    try {
      const res = await fetch(`/api/cajero/search-user?query=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (data.success) {
        const users = (data.users || []).map((u: any) => ({
          ...u,
          id: u.id ?? u.codigo,
        }));
        setResults(users);
        setSelectedUser(null);
        setAddPointsResult(null);
        setError("");
        
        // En modo TPV, si hay exactamente 1 resultado, abrir automáticamente el modal
        if (isTPV && users.length === 1) {
          // Damos un pequeño delay para que el usuario vea el resultado
          setTimeout(() => {
            handleSelectUser(users[0]);
          }, 100);
        }
      } else {
        setError(data.message || "No se encontraron resultados");
      }
    } catch {
      setError("Error al buscar usuarios");
    } finally {
      setSearching(false);
    }
  }, [isTPV]);

  // Efecto para debounce en la búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm.trim()) {
        performSearch(searchTerm);
      } else {
        setResults([]);
        setError("");
      }
    }, 300); // 300ms de delay

    return () => clearTimeout(timer);
  }, [searchTerm, performSearch]);

  // Efecto para manejar la tecla Enter en modo TPV
  useEffect(() => {
    if (!isTPV) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && results.length === 1 && !isModalOpen) {
        // Prevenir múltiples ejecuciones seguidas
        const now = Date.now();
        if (now - lastEnterPressRef.current < 1000) {
          return;
        }
        lastEnterPressRef.current = now;
        
        // Abrir el modal con el único resultado
        handleSelectUser(results[0]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTPV, results, isModalOpen]);

  // Handler para la búsqueda (disparado desde el input)
  // La búsqueda real se maneja con el useEffect de arriba
  // Este handler está aquí para compatibilidad con el componente SearchForm
  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement> | React.FormEvent): Promise<void> => {
    // La búsqueda se maneja con el useEffect de arriba
    // Simplemente esperamos sin hacer nada
    return Promise.resolve();
  };

  const handleSelectUser = (user: any) => {
    setSelectedUser(user);
    setAddPointsResult(null);
    setAmount("");
    setIsCarnetAnimal(false);
    setSacos([]); 
    setIsModalOpen(true);
  };

  const handleViewRedemptions = (user: any) => {
    setSelectedUser(user);
    fetchUserRedemptions(user.id);
    setIsRedemptionsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    // En TPV, limpiar la búsqueda para volver a empezar
    if (isTPV) {
      setSearchTerm("");
      setResults([]);
    }
  };

  const closeRedemptionsModal = () => {
    setIsRedemptionsModalOpen(false);
  };

  const handleOfferRewards = (user: any) => {
    setSelectedUser(user);
    setRedeemResult(null);
    setIsOfferRewardsModalOpen(true);
  };

  const closeOfferRewardsModal = () => {
    setIsOfferRewardsModalOpen(false);
  };

  const handleManagePetCards = async (user: any) => {
    setSelectedUser(user);
    setPetCardResult(null);
    await fetchUserPetCards(user.id);
    setIsPetCardModalOpen(true);
  };

  const closePetCardModal = () => {
    setIsPetCardModalOpen(false);
    setPreselectedProduct(null);
  };

  const handleCarnetCompletado = (producto: ProductoCarnet) => {
    // Guardar el producto pre-seleccionado
    setPreselectedProduct(producto);
    // Cerrar el modal de añadir saldo si está abierto
    setIsModalOpen(false);
    // Abrir el modal de carnets de mascota
    setIsPetCardModalOpen(true);
  };

  const fetchUserPetCards = async (userId: number) => {
    try {
      const res = await fetch(`/api/cajero/pet-cards?userId=${userId}`);
      const data = await res.json();
      if (data.success) {
        setPetCards(data.petCards || []);
      } else {
        setPetCards([]);
      }
    } catch (error) {
      console.error("Error al obtener carnets animales:", error);
      setPetCards([]);
    }
  };

  const handleAddPetCard = async (petName: string, petType: string, productName: string, codigoBarras?: string) => {
    if (!selectedUser || !selectedUser.id) return;
    
    setPetCardLoading(true);
    setPetCardResult(null);
    
    try {
      const res = await fetch('/api/cajero/pet-cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser.id,
          petName,
          petType,
          productName,
          codigoBarras: codigoBarras || null
        }),
      });
      
      const data = await res.json();
      setPetCardResult({
        success: data.success,
        message: data.message || (data.success ? 'Carnet animal creado correctamente' : 'Error al crear el carnet animal')
      });
      
      if (data.success) {
        fetchUserPetCards(selectedUser.id);
      }
    } catch (error) {
      setPetCardResult({
        success: false,
        message: 'Error al crear el carnet animal'
      });
    } finally {
      setPetCardLoading(false);
    }
  };

  const handleAddStamp = async (petCardId: number) => {
    if (!selectedUser || !selectedUser.id) return;
    
    setPetCardLoading(true);
    setPetCardResult(null);
    
    try {
      const res = await fetch(`/api/cajero/pet-cards/${petCardId}/stamp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      const data = await res.json();
      setPetCardResult({
        success: data.success,
        message: data.message || (data.success ? 'Sello añadido correctamente' : 'Error al añadir el sello')
      });
      
      if (data.success) {
        fetchUserPetCards(selectedUser.id);
      }
    } catch (error) {
      setPetCardResult({
        success: false,
        message: 'Error al añadir el sello'
      });
    } finally {
      setPetCardLoading(false);
    }
  };

  const handleCompletePetCard = async (petCardId: number) => {
    if (!selectedUser) return;
    
    setPetCardLoading(true);
    setPetCardResult(null);
    
    try {
      const res = await fetch(`/api/cajero/pet-cards/${petCardId}/complete`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
      });
      
      const data = await res.json();
      setPetCardResult({
        success: data.success,
        message: data.message || (data.success ? 'Carnet completado correctamente' : 'Error al completar el carnet')
      });
      
      if (data.success) {
        fetchUserPetCards(selectedUser.id);
      }
    } catch (error) {
      setPetCardResult({
        success: false,
        message: 'Error al completar el carnet'
      });
    } finally {
      setPetCardLoading(false);
    }
  };

  const handleRemoveStamp = async (petCardId: number) => {
    if (!selectedUser || !selectedUser.id) return;
    
    setPetCardLoading(true);
    setPetCardResult(null);
    
    try {
      const res = await fetch(`/api/cajero/pet-cards/${petCardId}/remove-stamp`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
      });
      
      const data = await res.json();
      setPetCardResult({
        success: data.success,
        message: data.message || (data.success ? 'Sello eliminado correctamente' : 'Error al eliminar el sello')
      });
      
      if (data.success) {
        fetchUserPetCards(selectedUser.id);
      }
    } catch (error) {
      setPetCardResult({
        success: false,
        message: 'Error al eliminar el sello'
      });
    } finally {
      setPetCardLoading(false);
    }
  };

  const handleDeletePetCard = async (petCardId: number) => {
    if (!selectedUser || !selectedUser.id) return;
    
    setPetCardLoading(true);
    setPetCardResult(null);
    
    try {
      const res = await fetch(`/api/cajero/pet-cards/${petCardId}/delete`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      
      const data = await res.json();
      setPetCardResult({
        success: data.success,
        message: data.message || (data.success ? 'Carnet eliminado correctamente' : 'Error al eliminar el carnet')
      });
      
      if (data.success) {
        fetchUserPetCards(selectedUser.id);
      }
    } catch (error) {
      setPetCardResult({
        success: false,
        message: 'Error al eliminar el carnet'
      });
    } finally {
      setPetCardLoading(false);
    }
  };

  const handleRedeemReward = async (rewardId: number) => {
    if (!selectedUser || !selectedUser.id) return;
    
    setRedeemResult(null);
    
    try {
      // Llamada a la API para canjear la recompensa en nombre del usuario
      const response = await fetch('/api/rewards/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rewardId,
          userId: selectedUser.id, // Pasar el ID del usuario seleccionado
          byAdmin: true, // Indicar que el canjeo lo hace un admin/cajero
          notes: 'Canjeado por cajero en tienda'
        })
      });

      const data = await response.json();
      
      if (data.success) {
        // Actualizar los puntos del usuario en la lista de resultados
        setResults(prevResults =>
          prevResults.map(u =>
            u.id === selectedUser.id ? { ...u, points: data.redemption.remainingPoints } : u
          )
        );

        // Actualizar los puntos del usuario seleccionado
        setSelectedUser({
          ...selectedUser,
          points: data.redemption.remainingPoints
        });

        setRedeemResult({
          success: true,
          message: `Recompensa canjeada correctamente. Puntos restantes: ${data.redemption.remainingPoints}`
        });
      } else {
        setRedeemResult({
          success: false,
          message: data.message || 'Error al canjear la recompensa'
        });
      }
    } catch (error) {
      console.error('Error al canjear recompensa:', error);
      setRedeemResult({
        success: false,
        message: error instanceof Error ? error.message : 'Error al canjear la recompensa'
      });
    }
  };

  const handleAddBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddPointsResult(null);

    if (!selectedUser || !selectedUser.id || !amount.trim() || isNaN(Number(amount)) || Number(amount) <= 0) {
      setAddPointsResult({ success: false, message: "Introduce un importe válido" });
      return;
    }

    if (isCarnetAnimal && sacos.length === 0) {
      setAddPointsResult({ success: false, message: "Escanea el código de barras de al menos un saco" });
      return;
    }
    
    if (isCarnetAnimal && sacos.some(saco => !saco.pvp || isNaN(Number(saco.pvp)) || Number(saco.pvp) <= 0)) {
      setAddPointsResult({ success: false, message: "Error en los datos de los sacos" });
      return;
    }

    try {
      const totalSacos = isCarnetAnimal ? 
        sacos.reduce((total, saco) => total + (Number(saco.pvp) || 0), 0) : 0;
      
      const importeParaPuntos = isCarnetAnimal ? 
        Math.max(0, Number(amount) - totalSacos) : 
        Number(amount);

      let puntosAGanar = 0;
      
      if (importeParaPuntos > 0) {
        const configResponse = await fetch(`/api/config?monto=${importeParaPuntos}`);
        if (!configResponse.ok) {
          throw new Error("Error al consultar la configuración de puntos");
        }
        const configData = await configResponse.json();
        if (!configData.success) {
          throw new Error(configData.message || "No se pudo obtener la configuración de puntos");
        }
        puntosAGanar = Math.round(configData.puntos);
      }

      // Enviar los puntos calculados y los datos de sacos al endpoint del cajero
      // Incluir la información de los carnets para sellar automáticamente
      const res = await fetch(`/api/cajero/${selectedUser.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          amount, 
          puntos: puntosAGanar,
          isCarnetAnimal,
          sacos: isCarnetAnimal ? sacos.map(s => ({
            codigoBarras: s.codigoBarras,
            pvp: s.pvp,
            petCardId: s.petCardId,
            petName: s.petName
          })) : []
        }),
      });

      const data = await res.json();
      setAddPointsResult(data);

      if (data.success) {
        // Refrescar los carnets de mascota del usuario para ver los sellos añadidos
        await fetchUserPetCards(selectedUser.id);
        
        // Actualizar los puntos del usuario en la lista de resultados y en el usuario seleccionado
        const updatedPoints = data.puntosTotales;
        
        setResults(prevResults =>
          prevResults.map(u =>
            u.id === selectedUser.id ? { ...u, points: updatedPoints } : u
          )
        );

        const updatedUser = {
          ...selectedUser,
          points: updatedPoints,
        };
        setSelectedUser(updatedUser);
        
        // Cerrar el modal de saldo después de añadir puntos
        setTimeout(() => {
          setIsModalOpen(false);
          // En TPV, limpiar la búsqueda después de cerrar
          if (isTPV) {
            setSearchTerm("");
            setResults([]);
          }
        }, 1200);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Error desconocido";
      setAddPointsResult({ success: false, message: errorMessage || "Error al añadir saldo" });
    }
  };

  useEffect(() => {
    if (selectedUser && selectedUser.id) {
      fetchUserRedemptions(selectedUser.id);
    } else {
      setUserRedemptions([]);
    }
    setRedemptionMsg("");
  }, [selectedUser]);

  const fetchUserRedemptions = async (userId: number) => {
    try {
      const res = await fetch(`/api/rewards/history?userId=${userId}`);
      const data = await res.json();
      if (data.success) {
        setUserRedemptions(data.redemptions || []);
      } else {
        setUserRedemptions([]);
      }
    } catch {
      setUserRedemptions([]);
    }
  };

  const handleChangeRedemptionStatus = async (redemptionId: number, newStatus: string, notes?: string) => {
    setRedemptionMsg("");
    try {
      const res = await fetch(`/api/cajero/redemption-status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ redemptionId, status: newStatus, notes }),
      });
      const data = await res.json();
      if (data.success) {
        setRedemptionMsg(data.message || "Estado actualizado correctamente");
        fetchUserRedemptions(selectedUser.id);
      } else {
        setRedemptionMsg(data.message || "No se pudo actualizar el estado");
      }
    } catch (error) {
      console.error("Error al actualizar el estado:", error);
      setRedemptionMsg(typeof error === 'object' && error !== null && 'message' in error 
        ? (error as Error).message 
        : "Error al actualizar el estado");
    }
  };

  // Estilos específicos para TPV
  const containerClass = isTPV 
    ? "min-h-screen bg-gray-100 p-2" 
    : "max-w-7xl mx-auto py-5 px-4";

  return (
    <div className={containerClass}>
      {/* Título - oculto en TPV para ahorrar espacio */}
      {!isTPV && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4"
        >
          <h1 className="text-2xl font-bold text-green-800 mb-2">Panel de Cajero</h1>
          <p className="text-gray-600">Busca usuarios para añadir saldo o gestionar sus recompensas canjeadas.</p>
        </motion.div>
      )}
      
      {/* Título específico para TPV */}
      {isTPV && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-3 text-center"
        >
          <h1 className="text-xl font-bold text-green-800">Club ViveVerde - TPV</h1>
        </motion.div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-3">
          <SearchForm 
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            handleSearch={handleSearch}
            searching={searching}
            error={error}
          />
        </div>
        
        <div className="md:col-span-3">
          {results.length > 0 ? (
            <UsersTable 
              users={results}
              onSelectUser={handleSelectUser}
              onViewRedemptions={handleViewRedemptions}
              onOfferRewards={handleOfferRewards}
              onManagePetCards={handleManagePetCards}
            />
          ) : (!searching && !error && (
            <motion.div 
              className={`bg-white p-6 rounded-lg shadow-md text-center w-full ${isTPV ? 'py-4' : 'py-8'}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <i className={`fas fa-search text-green-200 ${isTPV ? 'text-3xl mb-2' : 'text-5xl mb-4'}`}></i>
              <h3 className={`font-medium text-gray-700 ${isTPV ? 'text-sm mb-1' : 'text-xl mb-2'}`}>
                {isTPV ? 'Buscando cliente...' : 'No hay resultados'}
              </h3>
              <p className={`text-gray-500 ${isTPV ? 'text-xs' : ''}`}>
                {isTPV 
                  ? 'Escribe el nombre o apellido del cliente' 
                  : 'Utiliza el buscador para encontrar usuarios por nombre, apellidos, correo o teléfono.'
                }
              </p>
            </motion.div>
          ))}
        </div>
      </div>
      
      <AddBalanceModal
        isOpen={isModalOpen}
        onClose={closeModal}
        user={selectedUser}
        amount={amount}
        setAmount={setAmount}
        handleAddBalance={handleAddBalance}
        addPointsResult={addPointsResult}
        isCarnetAnimal={isCarnetAnimal}
        setIsCarnetAnimal={setIsCarnetAnimal}
        sacos={sacos}
        setSacos={setSacos}
        onCarnetCompletado={handleCarnetCompletado}
        autoFocusAmount={isTPV}
      />

      <RedemptionsModal
        isOpen={isRedemptionsModalOpen}
        onClose={closeRedemptionsModal}
        user={selectedUser}
        redemptions={userRedemptions}
        handleChangeRedemptionStatus={handleChangeRedemptionStatus}
        redemptionMsg={redemptionMsg}
        userRole={userRole}
      />

      <OfferRewardsModal
        isOpen={isOfferRewardsModalOpen}
        onClose={closeOfferRewardsModal}
        user={selectedUser}
        onRedeemReward={handleRedeemReward}
        redeemResult={redeemResult}
      />

      <PetCardModal
        isOpen={isPetCardModalOpen}
        onClose={() => setIsPetCardModalOpen(false)}
        user={selectedUser}
        petCards={petCards}
        onAddPetCard={handleAddPetCard}
        onAddStamp={handleAddStamp}
        onRemoveStamp={handleRemoveStamp}
        onCompletePetCard={handleCompletePetCard}
        onDeletePetCard={handleDeletePetCard}
        loading={petCardLoading}
        result={petCardResult}
        userRole={userRole}
        preselectedProduct={preselectedProduct}
      />
    </div>
  );
};

export default TellerDashboard;
