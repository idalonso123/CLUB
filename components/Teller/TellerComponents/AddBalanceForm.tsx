import React, { useState, useEffect } from "react";
import { SacoItem, AddBalanceFormProps } from "@/types/teller";

const AddBalanceForm: React.FC<AddBalanceFormProps> = ({
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
}) => {
  const presetValues = [5, 10, 15, 20, 30];
  const [currentSacoPrice, setCurrentSacoPrice] = useState("");
  const [importeParaPuntos, setImporteParaPuntos] = useState(amount);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const handlePresetClick = (value: number): void => {
    setAmount(value.toString());
  };
  
  useEffect(() => {
    if (isCarnetAnimal && sacos.length > 0) {
      const totalSacos = sacos.reduce((total: number, saco: SacoItem) => total + (parseFloat(saco.price) || 0), 0);
      const amountValue = parseFloat(amount) || 0;
      setImporteParaPuntos(Math.max(0, amountValue - totalSacos).toFixed(2));
    } else {
      setImporteParaPuntos(amount);
    }
  }, [amount, sacos, isCarnetAnimal]);

  const handleCarnetAnimalChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    // Limpiar mensaje de error al cambiar el estado
    setErrorMessage(null);
    
    const isChecked = e.target.checked;
    setIsCarnetAnimal(isChecked);
    
    if (!isChecked && sacos.length > 0) {
      setSacos([]);
    }
  };

  const handleAddSaco = (): void => {
    // Limpiar mensaje de error anterior
    setErrorMessage(null);
    
    if (!currentSacoPrice || parseFloat(currentSacoPrice) <= 0) {
      setErrorMessage("El precio del saco debe ser mayor que 0");
      return;
    }

    const amountValue = parseFloat(amount) || 0;
    const totalSacosActual = sacos.reduce((total: number, saco: SacoItem) => total + (parseFloat(saco.price) || 0), 0);
    const nuevoPrecio = parseFloat(currentSacoPrice) || 0;
    
    if (totalSacosActual + nuevoPrecio > amountValue) {
      setErrorMessage(`El precio total de los sacos (${(totalSacosActual + nuevoPrecio).toFixed(2)}€) no puede superar el importe gastado (${amountValue.toFixed(2)}€)`);
      return;
    }

    const newSaco: SacoItem = {
      id: Date.now().toString(),
      price: currentSacoPrice,
    };

    setSacos([...sacos, newSaco]);
    setCurrentSacoPrice("");
  };

  const handleRemoveSaco = (sacoId: string): void => {
    const sacoToRemove = sacos.find((saco: SacoItem) => saco.id === sacoId);
    if (!sacoToRemove) return;
    
    setSacos(sacos.filter((saco: SacoItem) => saco.id !== sacoId));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    // Limpiar mensaje de error al enviar el formulario
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
              ¿El cliente tiene carnet animal?
            </label>
          </div>
          
          {isCarnetAnimal && (
            <div className="mt-4 p-3 bg-green-50 rounded-md border border-green-200">
              <h4 className="font-medium text-green-800 mb-2 flex items-center">
                <i className="fa-solid fa-paw mr-2 text-green-700"></i>
                Sacos de Carnet mascota
              </h4>
              
              {sacos.length > 0 && (
                <div className="mb-3 max-h-48 overflow-y-auto pr-1">
                  <p className="text-xs text-gray-500 mb-2">Sacos añadidos:</p>
                  {sacos.map((saco: SacoItem) => (
                    <div key={saco.id} className="flex items-center justify-between mb-2 bg-white p-2 rounded border border-green-100 hover:shadow-sm transition-shadow">
                      <span className="text-sm font-medium">{parseFloat(saco.price).toFixed(2)}€</span>
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
                    Total: {sacos.reduce((sum: number, saco: SacoItem) => sum + parseFloat(saco.price), 0).toFixed(2)}€
                  </div>
                </div>
              )}
              
              <div className="flex items-end gap-2 mb-2">
                <div className="flex-grow">
                  <label htmlFor="currentSacoPrice" className="block text-sm font-medium text-gray-700 mb-1">
                    Precio del saco (€)
                  </label>
                  <input
                    id="currentSacoPrice"
                    type="number"
                    min="0"
                    step="0.01"
                    value={currentSacoPrice}
                    onChange={(e) => setCurrentSacoPrice(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                    placeholder="Ej: 5.00"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddSaco}
                  className="bg-green-600 text-white px-3 py-2 rounded-md hover:bg-green-700 mb-0 flex items-center transition-colors"
                >
                  <i className="fas fa-plus mr-1 text-xs"></i>
                  Añadir
                </button>
              </div>
            </div>
          )}
          
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-700">Valores predeterminados:</p>
            <div className="flex flex-wrap gap-2">
              {presetValues.map((value: number) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => handlePresetClick(value)}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-all ${amount === value.toString() 
                    ? 'bg-green-700 text-white' 
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}
                >
                  {value}€
                </button>
              ))}
            </div>
          </div>
          
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
