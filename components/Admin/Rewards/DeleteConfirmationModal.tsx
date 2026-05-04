import React, { useState, useEffect } from 'react';
import Modal from '@/components/Common/Modal/Modal';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (forceDelete: boolean) => void;
  rewardId: number;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  rewardId
}) => {
  const [forceDelete, setForceDelete] = useState(false);
  const [redemptionsCount, setRedemptionsCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  // Obtener el número de canjes asociados a la recompensa
  useEffect(() => {
    if (isOpen && rewardId) {
      setLoading(true);
      fetch(`/api/admin/rewards/redemptions?rewardId=${rewardId}&countOnly=true`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setRedemptionsCount(data.total || 0);
          }
        })
        .catch(err => {
          console.error('Error al obtener canjes:', err);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isOpen, rewardId]);

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      maxWidth="max-w-md"
      title="Confirmar eliminación"
    >
      <p className="text-gray-600 mb-4">
        ¿Estás seguro de que deseas eliminar esta recompensa? Esta acción no se puede deshacer.
      </p>
      
      <div className="mb-4">
        <label className="flex items-center text-sm text-gray-700">
          <input
            type="checkbox"
            checked={forceDelete}
            onChange={(e) => setForceDelete(e.target.checked)}
            className="mr-2 h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
          />
          <span>
            Borrado forzado (eliminar también los canjes asociados)
            {loading && <span className="ml-2 inline-block animate-pulse">...</span>}
            {!loading && redemptionsCount !== null && redemptionsCount > 0 && (
              <span className="ml-2 text-red-600 font-medium">({redemptionsCount} canjes)</span>
            )}
          </span>
        </label>
        {forceDelete && (
          <p className="mt-2 text-xs text-red-600">
            ¡Advertencia! Esta acción eliminará permanentemente 
            {redemptionsCount !== null && redemptionsCount > 0 ? ` los ${redemptionsCount} canjes` : ' todos los canjes'} 
            asociados a esta recompensa.
          </p>
        )}
      </div>
      
      <div className="flex justify-end space-x-2">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
        >
          Cancelar
        </button>
        <button
          onClick={() => onConfirm(forceDelete)}
          className={`px-4 py-2 ${forceDelete ? 'bg-red-700' : 'bg-red-600'} text-white rounded hover:bg-red-700`}
        >
          {forceDelete ? 'Eliminar forzadamente' : 'Eliminar'}
        </button>
      </div>
    </Modal>
  );
};

export default DeleteConfirmationModal;
