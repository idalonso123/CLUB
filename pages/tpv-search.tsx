/**
 * Club ViveVerde TPV - Página de Búsqueda Standalone
 * 
 * Esta página está diseñada para ejecutarse como aplicación Electron Standalone.
 * Muestra una ventana flotante con el campo de búsqueda del sistema TPV.
 * 
 * Características:
 * - Ventana pequeña y compacta
 * - Solo título "Club Viveverde" y campo de búsqueda
 * - Sin bordes de ventana (frame: false)
 * - Siempre visible sobre el ERP
 * - Búsqueda automática con Enter para abrir AddBalanceModal
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import Head from "next/head";
import { motion } from "framer-motion";
import { User } from "@/types/teller";
import AddBalanceModal from "@/components/Teller/TellerComponents/AddBalanceModal";

interface TPVSearchStandaloneProps {}

const TPVSearchStandalone: React.FC<TPVSearchStandaloneProps> = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<User[]>([]);
  const [error, setError] = useState("");
  const [searching, setSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [amount, setAmount] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [addPointsResult, setAddPointsResult] = useState<{
    success: boolean;
    message: string;
    puntosAñadidos?: number;
    puntosTotales?: number;
  } | null>(null);
  const [isCarnetAnimal, setIsCarnetAnimal] = useState(false);
  const [sacos, setSacos] = useState<any[]>([]);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const lastEnterPressRef = useRef<number>(0);

  // Enfocar el input al cargar
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

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
      } else {
        setError(data.message || "No se encontraron resultados");
      }
    } catch {
      setError("Error al buscar usuarios");
    } finally {
      setSearching(false);
    }
  }, []);

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

  // Manejar la tecla Enter para abrir el modal automáticamente
  useEffect(() => {
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
  }, [results, isModalOpen]);

  // Manejar búsqueda desde el input
  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement> | React.FormEvent): Promise<void> => {
    return Promise.resolve();
  };

  const handleSelectUser = (user: User) => {
    setSelectedUser(user);
    setAddPointsResult(null);
    setAmount("");
    setIsCarnetAnimal(false);
    setSacos([]);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    // Limpiar la búsqueda para volver a empezar
    setSearchTerm("");
    setResults([]);
  };

  const handleAddBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddPointsResult(null);

    if (!selectedUser || !selectedUser.id || !amount.trim() || isNaN(Number(amount)) || Number(amount) <= 0) {
      setAddPointsResult({ success: false, message: "Introduce un importe válido" });
      return;
    }

    try {
      const importe = Number(amount);
      
      // Consultar la configuración de puntos
      const configResponse = await fetch(`/api/config?monto=${importe}`);
      if (!configResponse.ok) {
        throw new Error("Error al consultar la configuración de puntos");
      }
      const configData = await configResponse.json();
      if (!configData.success) {
        throw new Error(configData.message || "No se pudo obtener la configuración de puntos");
      }
      const puntosAGanar = Math.round(configData.puntos);

      // Enviar los puntos calculados
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
        // Cerrar el modal después de añadir puntos
        setTimeout(() => {
          setIsModalOpen(false);
          setSearchTerm("");
          setResults([]);
        }, 1200);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Error desconocido";
      setAddPointsResult({ success: false, message: errorMessage || "Error al añadir saldo" });
    }
  };

  return (
    <>
      <Head>
        <title>Club ViveVerde - Búsqueda Rápida TPV</title>
        <meta name="description" content="Búsqueda rápida de clientes para el sistema TPV" />
        <style jsx global>{`
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            background: transparent;
            overflow: hidden;
          }
          /* Permitir arrastrar la ventana */
          .drag-region {
            -webkit-app-region: drag;
          }
          .no-drag {
            -webkit-app-region: no-drag;
          }
        `}</style>
      </Head>

      <div className="min-h-screen bg-white p-2">
        {/* Barra de título personalizada */}
        <div className="drag-region flex items-center justify-between mb-2 pb-2 border-b border-gray-200">
          <h1 className="text-lg font-bold text-green-800 no-drag">Club Viveverde</h1>
          <div className="flex items-center gap-1 no-drag">
            <button
              onClick={() => window.electronAPI?.minimizeWindow()}
              className="p-1 hover:bg-gray-200 rounded transition-colors"
              title="Minimizar"
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>
            <button
              onClick={() => window.electronAPI?.closeWindow()}
              className="p-1 hover:bg-red-100 rounded transition-colors"
              title="Cerrar"
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Campo de búsqueda */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {searching ? (
              <div className="animate-spin h-5 w-5 border-2 border-green-500 rounded-full border-t-transparent"></div>
            ) : (
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            )}
          </div>
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar cliente (nombre, apellido, email o teléfono)"
            className="pl-10 w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
            autoFocus
          />
        </div>

        {/* Mensaje de ayuda cuando hay un resultado */}
        {results.length === 1 && !isModalOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg text-center text-sm text-green-700"
          >
            <i className="fas fa-info-circle mr-1"></i>
            Presiona <strong>Enter</strong> para añadir saldo a {results[0].firstName} {results[0].lastName}
          </motion.div>
        )}

        {/* Mensaje de error */}
        {error && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600"
          >
            {error}
          </motion.div>
        )}

        {/* Modal de añadir saldo */}
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
          onCarnetCompletado={() => {}}
          autoFocusAmount={true}
        />
      </div>
    </>
  );
};

export default TPVSearchStandalone;
