import React, { useState, useEffect, useCallback, useRef } from "react";
import { SacoBarrasItem, AddBalanceFormProps, ProductoCarnet } from "@/types/teller";

interface SacoValidado {
  id: string;
  codigoBarras: string;
  pvp: number;
  petCardId: number;
  petName: string;
  productName: string;
}

interface PetCardCompletado {
  id: number;
  petName: string;
  productName: string;
}

interface AddBalanceFormPropsMod extends AddBalanceFormProps {
  onCarnetCompletado?: (producto: ProductoCarnet) => void;
}

const AddBalanceForm: React.FC<AddBalanceFormPropsMod> = ({
  user,
  amount,
  setAmount,
  handleAddBalance,
  addPointsResult,
  isCarnetAnimal,
  setIsCarnetAnimal,
  sacos,
  setSacos,
  onSubmit,
  loading,
  onCarnetCompletado,
  autoFocus = false,
}) => {
  // Ref para el input de cantidad
  const amountInputRef = useRef<HTMLInputElement>(null);
  
  // Efecto para hacer focus en el campo amount cuando autoFocus es true
  useEffect(() => {
    if (autoFocus && amountInputRef.current) {
      // Pequeño delay para asegurar que el modal está completamente renderizado
      const timer = setTimeout(() => {
        if (amountInputRef.current) {
          amountInputRef.current.focus();
          amountInputRef.current.select();
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [autoFocus]);
  // Valores predeterminados eliminados por decisión del usuario
  const [codigoBarrasInput, setCodigoBarrasInput] = useState("");
  const [importeParaPuntos, setImporteParaPuntos] = useState(amount);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [validatingBarcode, setValidatingBarcode] = useState(false);
  const [barcodeError, setBarcodeError] = useState<string | null>(null);
  const [barcodeSuccess, setBarcodeSuccess] = useState<string | null>(null);
  

  useEffect(() => {
    if (isCarnetAnimal && sacos.length > 0) {
      const totalSacos = sacos.reduce((total: number, saco: SacoBarrasItem) => total + (Number(saco.pvp) || 0), 0);
      const amountValue = parseFloat(amount) || 0;
      setImporteParaPuntos(Math.max(0, amountValue - totalSacos).toFixed(2));
    } else {
      setImporteParaPuntos(amount);
    }
  }, [amount, sacos, isCarnetAnimal]);

  const handleCarnetAnimalChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setErrorMessage(null);
    setBarcodeError(null);
    setBarcodeSuccess(null);
    
    const isChecked = e.target.checked;
    setIsCarnetAnimal(isChecked);
    
    if (!isChecked && sacos.length > 0) {
      setSacos([]);
    }
  };

  // Función para validar código de barras
  // Estados para manejar carnet completado
  const [carnetCompletado, setCarnetCompletado] = useState<{
    show: boolean;
    producto?: ProductoCarnet;
    petName?: string;
  }>({ show: false });

  const validarCodigoBarras = useCallback(async (codigo: string, userId: number): Promise<{
    success: boolean;
    producto?: ProductoCarnet;
    petCardId?: number;
    petName?: string;
    productName?: string;
    isCompleted?: boolean;
    message?: string;
  }> => {
    try {
      // 1. Buscar producto por código de barras
      const productoRes = await fetch(`/api/cajero/productos-carnet/barcode?codigoBarras=${encodeURIComponent(codigo)}`);
      const productoData = await productoRes.json();
      
      if (!productoData.success || !productoData.producto) {
        return {
          success: false,
          message: 'Producto no encontrado en la base de datos'
        };
      }

      // 2. Buscar si el usuario tiene un carnet con ese código de barras (incluye completados)
      const petCardRes = await fetch(`/api/cajero/pet-cards/barcode?userId=${userId}&codigoBarras=${encodeURIComponent(codigo)}&includeCompleted=true`);
      const petCardData = await petCardRes.json();
      
      if (!petCardData.found || !petCardData.petCards || petCardData.petCards.length === 0) {
        return {
          success: false,
          producto: productoData.producto,
          message: 'El cliente no tiene ningún carnet de mascota con ese alimento'
        };
      }

      // Obtener el primer carnet activo (no caducado, no completado)
      const petCard = petCardData.petCards.find((pc: any) => !pc.completed && !pc.isExpired);
      
      if (!petCard) {
        // Verificar si hay algún carnet completado
        const completedCard = petCardData.petCards.find((pc: any) => pc.completed);
        if (completedCard) {
          return {
            success: false,
            producto: productoData.producto,
            isCompleted: true,
            petName: completedCard.petName,
            message: `El carnet de ${completedCard.petName} ya está completado`
          };
        }
        return {
          success: false,
          producto: productoData.producto,
          message: 'El carnet encontrado está caducado'
        };
      }
      
      return {
        success: true,
        producto: productoData.producto,
        petCardId: petCard.id,
        petName: petCard.petName,
        productName: petCard.productName,
        message: 'Código de barras validado correctamente'
      };
    } catch (error) {
      console.error('Error al validar código de barras:', error);
      return {
        success: false,
        message: 'Error al validar el código de barras'
      };
    }
  }, []);

  const handleAddSaco = async (): Promise<void> => {
    setErrorMessage(null);
    setBarcodeError(null);
    setBarcodeSuccess(null);
    setCarnetCompletado({ show: false });
    
    if (!codigoBarrasInput.trim()) {
      setBarcodeError("Introduce el código de barras del saco");
      return;
    }

    if (!user || !user.id) {
      setBarcodeError("No se ha seleccionado ningún usuario");
      return;
    }

    const amountValue = parseFloat(amount) || 0;
    if (amountValue <= 0) {
      setBarcodeError("Introduce primero el importe gastado");
      return;
    }

    setValidatingBarcode(true);

    try {
      const resultado = await validarCodigoBarras(codigoBarrasInput.trim(), user.id);

      if (!resultado.success) {
        // Verificar si el carnet está completado
        if (resultado.isCompleted) {
          setBarcodeError(`El carnet de ${resultado.petName} ya está completado.`);
          setCarnetCompletado({
            show: true,
            producto: resultado.producto,
            petName: resultado.petName
          });
        } else {
          setBarcodeError(resultado.message || 'Error al validar el código de barras');
        }
        return;
      }

      const producto = resultado.producto!;
      const totalSacosActual = sacos.reduce((total: number, saco: SacoBarrasItem) => total + (Number(saco.pvp) || 0), 0);
      // Convertir PVP a número (puede venir como string desde MySQL)
      const nuevoPvp = Number(producto.PVP);

      // Verificar que el total de sacos no supere el importe
      if (totalSacosActual + nuevoPvp > amountValue) {
        setBarcodeError(`El precio total de los sacos (${(totalSacosActual + nuevoPvp).toFixed(2)}€) no puede superar el importe gastado (${amountValue.toFixed(2)}€)`);
        return;
      }

      // Crear el saco validado con pvp como número
      const newSaco: SacoBarrasItem = {
        id: Date.now().toString(),
        codigoBarras: codigoBarrasInput.trim(),
        pvp: nuevoPvp,
        petCardId: resultado.petCardId!,
        petName: resultado.petName!,
      };

      setSacos([...sacos, newSaco]);
      setBarcodeSuccess(`${producto.Nombre} - ${nuevoPvp.toFixed(2)}€ (Carnet: ${resultado.petName})`);
      setCodigoBarrasInput("");

    } catch (error) {
      console.error('Error al añadir saco:', error);
      setBarcodeError("Error al procesar el código de barras");
    } finally {
      setValidatingBarcode(false);
    }
  };

  const handleRemoveSaco = (sacoId: string): void => {
    setSacos(sacos.filter((saco: SacoBarrasItem) => saco.id !== sacoId));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    setErrorMessage(null);
    
    if (onSubmit) {
      onSubmit(e);
    } else if (handleAddBalance) {
      handleAddBalance(e);
    }
  };

  return (
    <div>
      <h2 className="text-lg font-semibold mb-3 text-green-700 border-b border-gray-400 pb-2">
        Añadir saldo a: {user.firstName} {user.lastName}
      </h2>
      <form onSubmit={handleSubmit}>
        <div className="space-y-4 pb-2">
          <div className="mb-4">
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
              Importe gastado (€)
            </label>
            <input
              ref={amountInputRef}
              type="text"
              id="amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={isCarnetAnimal && sacos.length > 0}
              className={`w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${isCarnetAnimal && sacos.length > 0 ? 'bg-gray-100 text-gray-700 border-gray-200 cursor-not-allowed' : 'border-gray-300'}`}
              placeholder="Ej: 10.00"
            />
            
            {isCarnetAnimal && sacos.length > 0 && (
              <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm text-green-800">
                  <span className="font-medium">Importe para puntos:</span> {importeParaPuntos}€
                  <span className="text-xs ml-1 text-green-600">
                    (Importe gastado - Precio sacos)
                  </span>
                </p>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              id="carnetAnimal"
              type="checkbox"
              checked={isCarnetAnimal}
              onChange={handleCarnetAnimalChange}
              className="h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
            />
            <label htmlFor="carnetAnimal" className="text-sm font-medium text-gray-700">
              ¿El cliente tiene carnet de mascota?
            </label>
          </div>
          
          {isCarnetAnimal && (
            <div className="mt-4 p-3 bg-green-50 rounded-md border border-green-200">
              <h4 className="font-medium text-green-800 mb-2 flex items-center">
                <i className="fa-solid fa-paw mr-2 text-green-700"></i>
                Sacos de carnet de mascota
              </h4>
              <p className="text-xs text-gray-600 mb-3">
                Escanea o escribe el código de barras del saco para añadirlo automáticamente
              </p>
              
              {sacos.length > 0 && (
                <div className="mb-3 max-h-48 overflow-y-auto pr-1">
                  <p className="text-xs text-gray-500 mb-2">Sacos añadidos:</p>
                  {sacos.map((saco: SacoBarrasItem) => (
                    <div key={saco.id} className="flex items-center justify-between mb-2 bg-white p-2 rounded border border-green-100 hover:shadow-sm transition-shadow">
                      <div className="flex-1">
                        <span className="text-sm font-medium">{Number(saco.pvp).toFixed(2)}€</span>
                        <span className="text-xs text-gray-500 ml-2 font-mono">{saco.codigoBarras}</span>
                        <span className="text-xs text-purple-600 ml-2">({saco.petName})</span>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => handleRemoveSaco(saco.id)}
                        className="text-red-500 hover:text-red-700 text-sm p-1 rounded-full hover:bg-red-50 transition-colors"
                        aria-label="Eliminar saco"
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    </div>
                  ))}
                  <div className="text-right text-sm font-medium mt-2 bg-green-100 p-1.5 rounded">
                    Total: {sacos.reduce((sum: number, saco: SacoBarrasItem) => sum + Number(saco.pvp), 0).toFixed(2)}€
                  </div>
                </div>
              )}
              
              <div className="flex items-end gap-2 mb-2">
                <div className="flex-grow">
                  <label htmlFor="codigoBarras" className="block text-sm font-medium text-gray-700 mb-1">
                    Código de barras del saco
                  </label>
                  <input
                    id="codigoBarras"
                    type="text"
                    value={codigoBarrasInput}
                    onChange={(e) => {
                      setCodigoBarrasInput(e.target.value);
                      setBarcodeError(null);
                      setBarcodeSuccess(null);
                    }}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSaco();
                      }
                    }}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 font-mono"
                    placeholder="Ej: 8437002885144"
                    disabled={validatingBarcode}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddSaco}
                  disabled={validatingBarcode}
                  className={`bg-green-600 text-white px-3 py-2 rounded-md hover:bg-green-700 mb-0 flex items-center transition-colors ${validatingBarcode ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {validatingBarcode ? (
                    <i className="fas fa-spinner fa-spin mr-1 text-xs"></i>
                  ) : (
                    <i className="fas fa-plus mr-1 text-xs"></i>
                  )}
                  Añadir
                </button>
              </div>

              {/* Mensajes de feedback */}
              {barcodeError && (
                <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600 flex items-center">
                    <i className="fas fa-exclamation-circle mr-2"></i>
                    {barcodeError}
                  </p>
                </div>
              )}
              
              {barcodeSuccess && (
                <div className="mb-2 p-2 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-sm text-green-600 flex items-center">
                    <i className="fas fa-check-circle mr-2"></i>
                    {barcodeSuccess}
                  </p>
                </div>
              )}

              {/* Mensaje de carnet completado con opción de crear nuevo */}
              {carnetCompletado.show && (
                <div className="mb-2 p-3 bg-orange-50 border border-orange-200 rounded-md">
                  <p className="text-sm text-orange-700 mb-2">
                    <i className="fas fa-paw mr-2"></i>
                    Este carnet ya está completado. No se pueden añadir más sellos.
                  </p>
                  <p className="text-xs text-orange-600 mb-3">
                    ¿Desea crear un nuevo carnet de mascotas para este saco?
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      if (onCarnetCompletado && carnetCompletado.producto) {
                        onCarnetCompletado(carnetCompletado.producto);
                      }
                    }}
                    className="w-full py-2 bg-purple-600 text-white text-sm rounded-md hover:bg-purple-700 flex items-center justify-center transition-colors"
                  >
                    <i className="fas fa-plus-circle mr-2"></i>
                    Crear nuevo carnet
                  </button>
                </div>
              )}
            </div>
          )}
          

          {errorMessage && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600 flex items-center">
                <i className="fas fa-exclamation-circle mr-2"></i>
                {errorMessage}
              </p>
            </div>
          )}
          
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2.5 rounded-md transition-colors flex items-center justify-center font-medium ${loading ? 'bg-green-500 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'} text-white`}
          >
            {loading ? (
              <>
                <i className="fas fa-circle-notch fa-spin mr-2"></i>
                Procesando...
              </>
            ) : (
              <>
                <i className="fas fa-coins mr-2"></i>
                Añadir saldo
              </>
            )}
          </button>
        </div>
      </form>
      
      {addPointsResult && (
        <div className={`mt-3 p-3 rounded ${addPointsResult.success ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"} text-sm`}>
          <p className="font-medium">{addPointsResult.message}</p>
          {addPointsResult.success && (
            <div className="mt-2 grid grid-cols-2 gap-2">
              <div className="bg-white p-2 rounded shadow-sm">
                <span className="text-xs text-gray-600">Puntos añadidos:</span>
                <p className="font-bold">{addPointsResult.puntosAñadidos}</p>
              </div>
              <div className="bg-white p-2 rounded shadow-sm">
                <span className="text-xs text-gray-600">Total de puntos:</span>
                <p className="font-bold">{addPointsResult.puntosTotales}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AddBalanceForm;
