import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PetCardModalProps, PetCard, ProductoCarnet } from "@/types/teller";
import useExpirationConfig from "@/components/hooks/useExpirationConfig";

const PetCardModal: React.FC<PetCardModalProps> = ({
  isOpen,
  onClose,
  user,
  petCards,
  onAddPetCard,
  onAddStamp,
  onRemoveStamp,
  onCompletePetCard,
  onDeletePetCard,
  loading,
  result,
  userRole,
  preselectedProduct
}) => {
  const [newPetName, setNewPetName] = useState("");
  const [newPetType, setNewPetType] = useState("");
  const [newProductName, setNewProductName] = useState("");
  const [activeTab, setActiveTab] = useState<"existing" | "new">("existing");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "completed" | "expired">("active");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [cardToDelete, setCardToDelete] = useState<PetCard | null>(null);
  // Controla qué carnet está expandido
  const [openCardId, setOpenCardId] = useState<number | null>(null);

  // Estados para el buscador de productos
  const [productSearchQuery, setProductSearchQuery] = useState("");
  const [productSearchResults, setProductSearchResults] = useState<ProductoCarnet[]>([]);
  const [isSearchingProducts, setIsSearchingProducts] = useState(false);
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductoCarnet | null>(null);
  const productSearchTimeout = useRef<NodeJS.Timeout | null>(null);
  const productInputRef = useRef<HTMLDivElement>(null);

  // Efecto para manejar producto pre-seleccionado
  useEffect(() => {
    if (preselectedProduct && isOpen) {
      // Cambiar a la pestaña de nuevo carnet
      setActiveTab("new");
      // Seleccionar el producto automáticamente
      setSelectedProduct(preselectedProduct);
      // Crear el nombre del producto
      let fullName = preselectedProduct.Nombre;
      if (preselectedProduct.Talla) fullName += ` - ${preselectedProduct.Talla}`;
      if (preselectedProduct.Color && preselectedProduct.Color !== 'UNICO') fullName += ` (${preselectedProduct.Color})`;
      setNewProductName(fullName);
      setProductSearchQuery("");
      setShowProductDropdown(false);
    }
  }, [preselectedProduct, isOpen]);

  // Efecto para limpiar selección cuando se cierra el modal
  useEffect(() => {
    if (!isOpen) {
      setSelectedProduct(null);
      setNewProductName("");
      setProductSearchQuery("");
      setShowProductDropdown(false);
      setNewPetName("");
      setNewPetType("");
    }
  }, [isOpen]);

  // Obtener configuración de caducidades dinámicamente
  const { config: expirationConfig } = useExpirationConfig();

  // Valores por defecto si no se ha cargado la configuración
  const mesesInactividad = expirationConfig?.caducidad_carnet_inactividad_meses || 6;
  const mesesAntiguedad = expirationConfig?.caducidad_carnet_antiguedad_meses || 24;
  const sellosRequeridos = expirationConfig?.sellos_requeridos_carnet || 6;

  // Función para buscar productos
  const searchProducts = useCallback(async (query: string) => {
    if (query.length < 1) {
      // Si no hay query, cargar productos recientes
      try {
        setIsSearchingProducts(true);
        const res = await fetch(`/api/cajero/productos-carnet/search?limit=15`);
        const data = await res.json();
        if (data.success) {
          setProductSearchResults(data.productos || []);
        }
      } catch (error) {
        console.error("Error al buscar productos:", error);
        setProductSearchResults([]);
      } finally {
        setIsSearchingProducts(false);
      }
      return;
    }

    try {
      setIsSearchingProducts(true);
      const res = await fetch(`/api/cajero/productos-carnet/search?query=${encodeURIComponent(query)}&limit=20`);
      const data = await res.json();
      if (data.success) {
        setProductSearchResults(data.productos || []);
      }
    } catch (error) {
      console.error("Error al buscar productos:", error);
      setProductSearchResults([]);
    } finally {
      setIsSearchingProducts(false);
    }
  }, []);

  // Efecto para debounce en la búsqueda de productos
  useEffect(() => {
    if (productSearchTimeout.current) {
      clearTimeout(productSearchTimeout.current);
    }

    productSearchTimeout.current = setTimeout(() => {
      searchProducts(productSearchQuery);
    }, 300);

    return () => {
      if (productSearchTimeout.current) {
        clearTimeout(productSearchTimeout.current);
      }
    };
  }, [productSearchQuery, searchProducts]);

  // Cerrar dropdown cuando se hace click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (productInputRef.current && !productInputRef.current.contains(event.target as Node)) {
        setShowProductDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Función para formatear PVP de forma segura (convierte string a número)
  const formatPVP = (pvp: any): string => {
    const num = typeof pvp === 'number' ? pvp : parseFloat(String(pvp));
    return isNaN(num) ? '0.00' : num.toFixed(2);
  };

  // Función para seleccionar un producto
  const handleSelectProduct = (product: ProductoCarnet) => {
    setSelectedProduct(product);
    // Crear nombre completo del producto (sin precio)
    let fullName = product.Nombre;
    if (product.Talla) fullName += ` - ${product.Talla}`;
    if (product.Color && product.Color !== 'UNICO') fullName += ` (${product.Color})`;
    setNewProductName(fullName);
    setProductSearchQuery("");
    setShowProductDropdown(false);
  };

  // Función para limpiar la selección del producto
  const handleClearProduct = () => {
    setSelectedProduct(null);
    setNewProductName("");
    setProductSearchQuery("");
    setProductSearchResults([]);
    setShowProductDropdown(false);
  };

  // Función para formatear el nombre del producto para mostrar
  const formatProductDisplay = (product: ProductoCarnet): string => {
    let display = `${product.Nombre}`;
    if (product.Talla) display += ` - ${product.Talla}`;
    if (product.Color && product.Color !== 'UNICO') display += ` (${product.Color})`;
    return display;
  };

  // Función para verificar si un carnet ha expirado (por inactividad o por antigüedad máxima)
  const isCardExpired = (card: PetCard): boolean => {
    if (card.completed) return false;
    // Verificar tanto el campo isExpired de la BD como las fechas
    if (card.isExpired === 1 || card.isExpired === true) return true;

    // REGLA 1: Meses de inactividad desde el último sello
    if (card.expirationDate && new Date(card.expirationDate) < new Date()) {
      return true;
    }

    // REGLA 2: Meses de antigüedad desde creación (máximo absoluto)
    if (card.maxExpirationDate) {
      if (new Date(card.maxExpirationDate) < new Date()) {
        return true;
      }
    } else if (card.createdAt) {
      // Si no hay maxExpirationDate calculado, calcularlo manualmente
      const maxExpDate = new Date(card.createdAt);
      maxExpDate.setMonth(maxExpDate.getMonth() + mesesAntiguedad);
      if (maxExpDate < new Date()) {
        return true;
      }
    }

    return false;
  };

  // Función para calcular días hasta expiración
  const getDaysUntilExpiration = (expirationDate: string): number => {
    const now = new Date();
    const expDate = new Date(expirationDate);
    const diffTime = expDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Función para calcular días hasta la expiración máxima (meses de antigüedad)
  const getDaysUntilMaxExpiration = (maxExpirationDate: string): number => {
    const now = new Date();
    const maxExpDate = new Date(maxExpirationDate);
    const diffTime = maxExpDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Función para calcular cuál es la fecha de expiración más próxima
  const getNextExpirationDate = (card: PetCard): { date: string; daysLeft: number; isMaxExpiration: boolean } | null => {
    if (card.completed) return null;

    const now = new Date();
    let nextDate: Date | null = null;
    let isMaxExpiration = false;

    // Calcular meses de inactividad desde último sello
    if (card.expirationDate) {
      const stampExpDate = new Date(card.expirationDate);
      if (stampExpDate > now) {
        nextDate = stampExpDate;
      }
    }

    // Calcular meses de antigüedad desde creación (máximo absoluto)
    if (card.maxExpirationDate) {
      const maxExpDate = new Date(card.maxExpirationDate);
      if (maxExpDate > now) {
        if (!nextDate || maxExpDate < nextDate) {
          nextDate = maxExpDate;
          isMaxExpiration = true;
        }
      }
    } else if (card.createdAt) {
      // Si no hay maxExpirationDate, calcularlo manualmente
      const maxExpDate = new Date(card.createdAt);
      maxExpDate.setMonth(maxExpDate.getMonth() + mesesAntiguedad);
      if (maxExpDate > now) {
        if (!nextDate || maxExpDate < nextDate) {
          nextDate = maxExpDate;
          isMaxExpiration = true;
        }
      }
    }

    if (!nextDate) return null;

    return {
      date: nextDate.toISOString(),
      daysLeft: getDaysUntilExpiration(nextDate.toISOString()),
      isMaxExpiration: isMaxExpiration
    };
  };

  // Función para formatear fecha de expiración
  const formatExpirationDate = (expirationDate: string): string => {
    const date = new Date(expirationDate);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Filtrar carnets según el estado seleccionado
  const filteredPetCards = useMemo(() => {
    if (filterStatus === "all") return petCards;
    if (filterStatus === "active") return petCards.filter(card => !card.completed && !isCardExpired(card));
    if (filterStatus === "completed") return petCards.filter(card => card.completed);
    if (filterStatus === "expired") return petCards.filter(card => !card.completed && isCardExpired(card));
    return petCards;
  }, [petCards, filterStatus]);

  // Contadores para los filtros
  const activeCount = petCards.filter(card => !card.completed && !isCardExpired(card)).length;
  const expiredCount = petCards.filter(card => !card.completed && isCardExpired(card)).length;

  const handleSubmitNewPet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPetName.trim() || !newPetType.trim() || !newProductName.trim()) return;

    // Obtener el código de barras del producto seleccionado si existe
    const codigoBarras = selectedProduct ? selectedProduct.C_Barras : undefined;
    
    await onAddPetCard(newPetName.trim(), newPetType.trim(), newProductName.trim(), codigoBarras);
    setNewPetName("");
    setNewPetType("");
    setNewProductName("");
    setSelectedProduct(null);
    setActiveTab("existing");
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.9, y: 20 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: "spring" as const,
        stiffness: 400,
        damping: 25,
        duration: 0.4,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      y: 10,
      transition: {
        type: "tween" as const,
        ease: "easeInOut" as const,
        duration: 0.3
      },
    },
  };

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.3 } },
    exit: { opacity: 0, transition: { duration: 0.3 } },
  };

  const petTypes = ["Perro", "Gato", "Ave", "Conejo", "Reptil", "Pez", "Otro"];

  return (
    <AnimatePresence mode="wait">
      {isOpen && user && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={overlayVariants}
          key="pet-card-modal"
        >
          <motion.div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={onClose}
          ></motion.div>

          <motion.div
            className="bg-white rounded-lg shadow-lg w-full max-w-2xl relative z-10 flex flex-col max-h-[90vh]"
            variants={modalVariants}
          >
            <div className="bg-gradient-to-r from-purple-700 to-purple-800 p-6 rounded-t-lg text-white sticky top-0 z-10">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold flex items-center">
                  <i className="fas fa-paw mr-2"></i>
                  Carnets mascotas
                </h3>
                <motion.button
                  onClick={onClose}
                  className="text-white/80 hover:text-white p-1 rounded-full"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <i className="fas fa-times"></i>
                </motion.button>
              </div>
              <div className="mt-2">
                <p className="text-white/90 text-sm">
                  Usuario: <span className="font-medium">{user.firstName} {user.lastName}</span>
                </p>
              </div>
            </div>

            <div className="flex border-b border-gray-200">
              <button
                className={`flex-1 py-3 font-medium text-sm ${activeTab === "existing"
                  ? "text-purple-600 border-b-2 border-purple-600"
                  : "text-gray-500 hover:text-gray-700"}`}
                onClick={() => setActiveTab("existing")}
              >
                <i className="fas fa-list-ul mr-2"></i>
                Carnets Existentes
              </button>
              <button
                className={`flex-1 py-3 font-medium text-sm ${activeTab === "new"
                  ? "text-purple-600 border-b-2 border-purple-600"
                  : "text-gray-500 hover:text-gray-700"}`}
                onClick={() => setActiveTab("new")}
              >
                <i className="fas fa-plus-circle mr-2"></i>
                Nuevo Carnet
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-grow max-h-128">
              {activeTab === "existing" ? (
                <div>
                  {/* Filtros */}
                  {petCards.length > 0 && (
                    <div className="flex mb-4 border border-gray-200 rounded-md overflow-hidden">
                      <button
                        className={`flex-1 py-2 text-xs font-medium ${filterStatus === "all" ? "bg-purple-100 text-purple-700" : "bg-gray-50 text-gray-600 hover:bg-gray-100"}`}
                        onClick={() => setFilterStatus("all")}
                      >
                        Todos ({petCards.length})
                      </button>
                      <button
                        className={`flex-1 py-2 text-xs font-medium ${filterStatus === "active" ? "bg-purple-100 text-purple-700" : "bg-gray-50 text-gray-600 hover:bg-gray-100"}`}
                        onClick={() => setFilterStatus("active")}
                      >
                        Activos ({activeCount})
                      </button>
                      <button
                        className={`flex-1 py-2 text-xs font-medium ${filterStatus === "completed" ? "bg-purple-100 text-purple-700" : "bg-gray-50 text-gray-600 hover:bg-gray-100"}`}
                        onClick={() => setFilterStatus("completed")}
                      >
                        Completados ({petCards.filter(card => card.completed).length})
                      </button>
                      {expiredCount > 0 && (
                        <button
                          className={`flex-1 py-2 text-xs font-medium ${filterStatus === "expired" ? "bg-red-100 text-red-700" : "bg-gray-50 text-gray-600 hover:bg-gray-100"}`}
                          onClick={() => setFilterStatus("expired")}
                        >
                          Expirados ({expiredCount})
                        </button>
                      )}
                    </div>
                  )}

                  {filteredPetCards.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                        <i className="fas fa-paw text-gray-400 text-2xl"></i>
                      </div>
                      <h3 className="text-lg font-medium text-gray-700 mb-2">No hay carnets</h3>
                      <p className="text-gray-500 mb-4">Este cliente aún no tiene carnets de mascotas.</p>
                      <button
                        onClick={() => setActiveTab("new")}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700"
                      >
                        <i className="fas fa-plus mr-2"></i>
                        Crear nuevo carnet
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {filteredPetCards.map((card) => {
                        const expired = isCardExpired(card);
                        const daysLeft = card.expirationDate && !expired ? getDaysUntilExpiration(card.expirationDate) : null;
                        return (
                          <div
                            key={card.id}
                            className={`border rounded-lg overflow-hidden shadow-sm ${card.completed ? 'border-green-500' : expired ? 'border-red-500' : 'border-gray-200'}`}
                          >
                            <div className={`p-3 ${card.completed ? 'bg-green-50' : expired ? 'bg-red-50' : 'bg-white'}`}>
                              <div className="flex justify-between items-start mb-3">
                                <div>
                                  <h4 className="font-medium text-gray-800">{card.petName}</h4>
                                  <p className="text-sm text-gray-500">{card.petType}</p>
                                  <p className="text-xs text-purple-600 mt-1">
                                    <i className="fas fa-shopping-bag mr-1"></i>
                                    {card.productName}
                                  </p>
                                  {/* Información de caducidad dual */}
                                  {!card.completed && (
                                    <>
                                      {/* Fecha de caducidad por inactividad ({mesesInactividad} meses desde último sello) */}
                                      {card.expirationDate && (
                                        <p className={`text-xs mt-1 ${expired ? 'text-red-600 font-medium' : daysLeft && daysLeft <= 30 ? 'text-orange-600' : 'text-gray-500'}`}>
                                          <i className={`fas fa-clock mr-1 ${expired ? 'text-red-600' : ''}`}></i>
                                          {expired ? (
                                            <>Caducado por inactividad el {formatExpirationDate(card.expirationDate)}</>
                                          ) : (
                                            <>Caduca en {daysLeft} {daysLeft === 1 ? 'día' : 'días'} (inactividad)</>
                                          )}
                                        </p>
                                      )}
                                      {/* Fecha de caducidad máxima ({mesesAntiguedad} meses desde creación) */}
                                      {card.maxExpirationDate && (
                                        <p className={`text-xs mt-1 ${new Date(card.maxExpirationDate) < new Date() ? 'text-red-600 font-medium' :
                                          (() => {
                                            const daysUntilMax = getDaysUntilMaxExpiration(card.maxExpirationDate!);
                                            return daysUntilMax <= 30 ? 'text-orange-600' : 'text-gray-500';
                                          })()}`}>
                                          <i className={`fas fa-hourglass-half mr-1 ${new Date(card.maxExpirationDate) < new Date() ? 'text-red-600' : ''}`}></i>
                                          {new Date(card.maxExpirationDate) < new Date() ? (
                                            <>Caducado el {formatExpirationDate(card.maxExpirationDate)} (límite máximo)</>
                                          ) : (
                                            <>Límite máximo: {getDaysUntilMaxExpiration(card.maxExpirationDate)} {getDaysUntilMaxExpiration(card.maxExpirationDate) === 1 ? 'día' : 'días'}</>
                                          )}
                                        </p>
                                      )}
                                    </>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className={`px-2 py-1 rounded text-xs font-medium ${card.completed ? 'bg-green-100 text-green-800' : expired ? 'bg-red-100 text-red-800' : 'bg-purple-100 text-purple-800'}`}>
                                    {card.completed ? 'Completado' : expired ? 'Caducado' : 'Activo'}
                                  </div>
                                  <button
                                    onClick={() => setOpenCardId(openCardId === card.id ? null : card.id)}
                                    className="px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800 hover:bg-purple-200"
                                  >
                                    {openCardId === card.id ? 'Ocultar Carnet' : 'Ver Carnet'}
                                  </button>
                                </div>
                              </div>

                              {openCardId === card.id && (
                                <>
                                  <div className="mb-4">
                                    <div className="text-sm text-gray-600 mb-2">
                                      Sellos: {card.stamps}/{sellosRequeridos}
                                    </div>
                                    <div className="grid grid-cols-5 gap-2">
                                      {Array.from({ length: sellosRequeridos }).map((_, index) => {
                                        // Obtener la fecha del sello si existe
                                        let stampDate = null;
                                        try {
                                          // Asegurarse de que stampDates sea un array de strings
                                          let stampDates = [];
                                          if (card.stampDates) {
                                            // Si es un string (formato JSON), parsearlo
                                            if (typeof card.stampDates === 'string') {
                                              stampDates = JSON.parse(card.stampDates);
                                            }
                                            // Si ya es un array, usarlo directamente
                                            else if (Array.isArray(card.stampDates)) {
                                              stampDates = card.stampDates;
                                            }
                                          }

                                          if (index < stampDates.length) {
                                            stampDate = stampDates[index];
                                          }
                                        } catch (e) {
                                          console.error('Error al procesar stampDates:', e);
                                          // Ignorar errores si stampDates no es un array válido
                                        }

                                        // Formatear la fecha de manera compacta
                                        const formatDateCompact = (dateStr: string): string => {
                                          const date = new Date(dateStr);
                                          const day = date.getDate().toString().padStart(2, '0');
                                          const month = (date.getMonth() + 1).toString().padStart(2, '0');
                                          const year = date.getFullYear().toString().slice(-2);
                                          return `${day}/${month}/${year}`;
                                        };

                                        return (
                                          <div key={index} className="flex flex-col items-center">
                                            <div
                                              className={`aspect-square rounded-md flex items-center justify-center border w-20 ${
                                                index < card.stamps
                                                  ? 'bg-purple-100 border-purple-300'
                                                  : 'bg-gray-50 border-gray-200'
                                              }`}
                                            >
                                              {stampDate && (
                                                index === 5 ? (
                                                  <img
                                                    src="/icons/icon-saco.png"
                                                    alt="Saco - Club ViveVerde"
                                                    style={{ width: '72px', height: '72px' }}
                                                  />
                                                ) : (
                                                  <img
                                                    src="/icons/icon-128x128.png"
                                                    alt="Sello - Club ViveVerde"
                                                    style={{ width: '72px', height: '72px' }}
                                                  />
                                                )
                                              )}
                                            </div>
                                            {stampDate && (
                                              <div
                                                className="text-[10px] text-gray-500 mt-0.5 text-center w-20 overflow-hidden leading-tight"
                                                style={{ maxWidth: '80px' }}
                                                title={new Date(stampDate).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                              >
                                                {formatDateCompact(stampDate)}
                                              </div>
                                            )}
                                            {/* Texto debajo del sello cuando es regalo */}
                                            {index === 5 && index < card.stamps && (
                                              <div className="text-[10px] text-gray-500 mt-0.5 text-center w-20 leading-tight">
                                                Saco Regalo
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>

                                  <div className="flex justify-between">
                                    <span className="text-xs text-gray-500">
                                      Creado: {new Date(card.createdAt).toLocaleDateString()}
                                    </span>

                                    {!card.completed ? (
                                      <div className="flex space-x-2">
                                        {card.stamps < sellosRequeridos && (
                                          <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => onAddStamp(card.id)}
                                            disabled={loading}
                                            className="px-3 py-1 bg-purple-600 text-white text-sm rounded-md hover:bg-purple-700 transition-colors flex items-center"
                                          >
                                            <i className="fas fa-plus-circle mr-1"></i>
                                            Añadir sello
                                          </motion.button>
                                        )}

                                        {card.stamps > 0 && (
                                          <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => onRemoveStamp(card.id)}
                                            disabled={loading}
                                            className="px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors flex items-center"
                                          >
                                            <i className="fas fa-minus-circle mr-1"></i>
                                            Eliminar sello
                                          </motion.button>
                                        )}

                                        {card.stamps === sellosRequeridos && (
                                          <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => onCompletePetCard(card.id)}
                                            disabled={loading}
                                            className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors flex items-center"
                                          >
                                            <i className="fas fa-check-circle mr-1"></i>
                                            Completar carnet
                                          </motion.button>
                                        )}
                                      </div>
                                    ) : (
                                      <span className="text-xs text-green-600 font-medium">
                                        <i className="fas fa-check-circle mr-1"></i>
                                        Completado
                                      </span>
                                    )}
                                  </div>

                                  {(userRole === "administrador" || userRole === "admin") && (
                                    <div className="mt-3 flex justify-end">
                                      <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => {
                                          setCardToDelete(card);
                                          setDeleteModalOpen(true);
                                        }}
                                        disabled={loading}
                                        className="px-3 py-1 bg-gray-600 text-white text-xs rounded-md hover:bg-gray-700 transition-colors flex items-center"
                                      >
                                        <i className="fas fa-trash-alt mr-1"></i>
                                        Eliminar carnet
                                      </motion.button>
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <form onSubmit={handleSubmitNewPet} className="space-y-4">
                  <div>
                    <label htmlFor="petName" className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre de la mascota
                    </label>
                    <input
                      type="text"
                      id="petName"
                      value={newPetName}
                      onChange={(e) => setNewPetName(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                      placeholder="Ej: Luna"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="petType" className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo de mascota
                    </label>
                    <select
                      id="petType"
                      value={newPetType}
                      onChange={(e) => setNewPetType(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                      required
                    >
                      <option value="">Selecciona un tipo</option>
                      {petTypes.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="productName" className="block text-sm font-medium text-gray-700 mb-1">
                      Producto comprado
                    </label>

                    {/* Buscador de productos con dropdown */}
                    <div ref={productInputRef} className="relative">
                      {/* Input de búsqueda */}
                      <div className="relative">
                        <input
                          type="text"
                          id="productSearch"
                          value={selectedProduct ? formatProductDisplay(selectedProduct) : productSearchQuery}
                          onChange={(e) => {
                            if (selectedProduct) {
                              // Si había un producto seleccionado, limpiar
                              handleClearProduct();
                            }
                            setProductSearchQuery(e.target.value);
                            setShowProductDropdown(true);
                          }}
                          onFocus={() => {
                            setShowProductDropdown(true);
                            // Cargar productos recientes si no hay resultados
                            if (productSearchResults.length === 0) {
                              searchProducts("");
                            }
                          }}
                          className={`w-full p-2 pr-10 border rounded-md focus:ring-purple-500 focus:border-purple-500 ${
                            selectedProduct ? 'border-green-400 bg-green-50' : 'border-gray-300'
                          }`}
                          placeholder="Busca por nombre, código o código de barras..."
                          autoComplete="off"
                        />
                        {/* Indicador de estado de búsqueda */}
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                          {isSearchingProducts ? (
                            <i className="fas fa-spinner fa-spin text-gray-400"></i>
                          ) : selectedProduct ? (
                            <button
                              type="button"
                              onClick={handleClearProduct}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              <i className="fas fa-times-circle"></i>
                            </button>
                          ) : (
                            <i className="fas fa-search text-gray-400"></i>
                          )}
                        </div>
                      </div>

                      {/* Información del producto seleccionado */}
                      {selectedProduct && (
                        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-green-800">
                                <i className="fas fa-check-circle mr-1"></i>
                                Producto seleccionado
                              </p>
                              <p className="text-xs text-green-600 mt-1">
                                <span className="font-mono mr-2">Ref: {selectedProduct.Articulo}</span>
                                <span className="font-mono">EAN: {selectedProduct.C_Barras}</span>
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={handleClearProduct}
                              className="text-green-600 hover:text-green-800 text-xs"
                            >
                              <i className="fas fa-times mr-1"></i>Cambiar
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Dropdown con resultados */}
                      {showProductDropdown && !selectedProduct && (
                        <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-64 overflow-auto">
                          {productSearchResults.length === 0 && !isSearchingProducts ? (
                            <div className="p-3 text-center text-gray-500">
                              <i className="fas fa-search mr-2"></i>
                              {productSearchQuery
                                ? "No se encontraron productos"
                                : "Escribe para buscar productos"}
                            </div>
                          ) : (
                            <>
                              <div className="px-3 py-2 bg-gray-50 border-b border-gray-100 text-xs text-gray-500">
                                <i className="fas fa-info-circle mr-1"></i>
                                {productSearchQuery
                                  ? `Resultados para "${productSearchQuery}" (${productSearchResults.length})`
                                  : `Productos recientes (${productSearchResults.length})`}
                              </div>
                              {productSearchResults.map((product) => (
                                <button
                                  key={product.id}
                                  type="button"
                                  onClick={() => handleSelectProduct(product)}
                                  className="w-full px-3 py-2 text-left hover:bg-purple-50 border-b border-gray-50 last:border-b-0 transition-colors"
                                >
                                  <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                      <p className="text-sm font-medium text-gray-800 line-clamp-1">
                                        {product.Nombre}
                                      </p>
                                      <div className="flex flex-wrap gap-x-3 mt-1">
                                        {product.Talla && (
                                          <span className="text-xs text-gray-500">
                                            <i className="fas fa-ruler mr-1"></i>{product.Talla}
                                          </span>
                                        )}
                                        {product.Color && product.Color !== 'UNICO' && (
                                          <span className="text-xs text-gray-500">
                                            <i className="fas fa-palette mr-1"></i>{product.Color}
                                          </span>
                                        )}
                                        <span className="text-xs text-gray-500 font-mono">
                                          <i className="fas fa-barcode mr-1"></i>{product.C_Barras}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </button>
                              ))}
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Campo oculto para el formulario */}
                    <input
                      type="hidden"
                      id="productName"
                      value={newProductName}
                      required={!selectedProduct}
                    />

                    {/* Hint text */}
                    <p className="mt-1 text-xs text-gray-500">
                      <i className="fas fa-lightbulb mr-1"></i>
                      Busca por nombre del producto, código de artículo o código de barras
                    </p>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={loading || !newPetName.trim() || !newPetType.trim() || !newProductName.trim()}
                      className={`w-full py-2 rounded-md transition-colors flex items-center justify-center font-medium ${
                        loading || !newPetName.trim() || !newPetType.trim() || !newProductName.trim()
                          ? 'bg-purple-400 cursor-not-allowed'
                          : 'bg-purple-600 hover:bg-purple-700'
                      } text-white`}
                    >
                      {loading ? (
                        <>
                          <i className="fas fa-circle-notch fa-spin mr-2"></i>
                          Procesando...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-plus-circle mr-2"></i>
                          Crear carnet de mascota
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}

              {result && (
                <div className={`mt-4 p-3 rounded ${result.success ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"} text-sm`}>
                  <p className="font-medium flex items-center">
                    <i className={`mr-2 ${result.success ? "fas fa-check-circle" : "fas fa-exclamation-circle"}`}></i>
                    {result.message}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 p-6 pt-3 border-t border-gray-200 sticky bottom-0 bg-white rounded-b-lg">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cerrar
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Modal de confirmación para eliminar carnet */}
      <AnimatePresence>
        {deleteModalOpen && cardToDelete && (
          <motion.div
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setDeleteModalOpen(false)}
            ></motion.div>

            <motion.div
              className="bg-white rounded-lg shadow-xl w-full max-w-md relative z-10"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: "spring" as const, stiffness: 500, damping: 30 }}
            >
              <div className="p-6">
                <div className="flex items-center justify-center mb-4">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                    <i className="fas fa-exclamation-triangle text-red-500 text-2xl"></i>
                  </div>
                </div>

                <h3 className="text-xl font-semibold text-center mb-2">
                  Confirmar eliminación
                </h3>

                <p className="text-gray-600 text-center mb-6">
                  ¿Estás seguro que deseas eliminar el carnet de <span className="font-semibold">{cardToDelete.petName}</span>? Esta acción no se puede deshacer.
                </p>

                <div className="flex justify-center space-x-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setDeleteModalOpen(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                  >
                    Cancelar
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      onDeletePetCard(cardToDelete.id);
                      setDeleteModalOpen(false);
                      setCardToDelete(null);
                    }}
                    disabled={loading}
                    className={`px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                  >
                    {loading ? (
                      <>
                        <i className="fas fa-circle-notch fa-spin mr-2"></i>
                        Eliminando...
                      </>
                    ) : (
                      <>Eliminar</>
                    )}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AnimatePresence>
  );
};

export default PetCardModal;
