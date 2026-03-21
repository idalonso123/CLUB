import React from 'react';
import { motion } from 'framer-motion';
import UserTableRow from '@/components/Admin/User/List/UserTableRow';
import { User } from '@/types/user';

interface UserTableProps {
  users: User[];
  onView: (user: User) => void;
  onEdit: (user: User) => void;
  onAdjustPoints: (user: User) => void;
  onDelete: (user: User) => void;
  onUpdateStatus: (user: User) => void; // Añadido onUpdateStatus
  onManagePetCards?: (user: User) => void; // Añadido onManagePetCards
  variants?: any; // Hacerlo opcional con ?
}

const UserTable: React.FC<UserTableProps> = ({
  users,
  onView,
  onEdit,
  onAdjustPoints,
  onDelete,
  onUpdateStatus, // Añadido aquí también
  onManagePetCards, // Añadido onManagePetCards
  variants
}) => {
  return (
    <motion.div 
      className="bg-white rounded-lg shadow-sm overflow-hidden"
      variants={variants}
      initial="hidden"  // Añadir estas propiedades
      animate="visible" // para controlar la animación
    >
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead className="bg-green-50">
            <tr>
              <th className="py-2 sm:py-3 px-2 sm:px-4 text-left text-xs sm:text-sm font-medium text-green-900 uppercase tracking-wider">ID</th>
              <th className="py-2 sm:py-3 px-2 sm:px-4 text-left text-xs sm:text-sm font-medium text-green-900 uppercase tracking-wider">Nombre</th>
              <th className="py-2 sm:py-3 px-2 sm:px-4 text-left text-xs sm:text-sm font-medium text-green-900 uppercase tracking-wider">Email</th>
              <th className="py-2 sm:py-3 px-2 sm:px-4 text-left text-xs sm:text-sm font-medium text-green-900 uppercase tracking-wider">Rol</th>
              <th className="py-2 sm:py-3 px-2 sm:px-4 text-left text-xs sm:text-sm font-medium text-green-900 uppercase tracking-wider">Puntos</th>
              <th className="py-2 sm:py-3 px-2 sm:px-4 text-left text-xs sm:text-sm font-medium text-green-900 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-green-200">
            {users.length > 0 ? (
              users.map((user) => (
                <UserTableRow 
                  key={user.id} 
                  user={user}
                  onView={onView}
                  onEdit={onEdit}
                  onAdjustPoints={onAdjustPoints}
                  onDelete={onDelete}
                  onUpdateStatus={onUpdateStatus} // Pasar onUpdateStatus al componente hijo
                  onManagePetCards={onManagePetCards} // Pasar onManagePetCards al componente hijo
                />
              ))
            ) : (
              <tr>
                <td colSpan={6} className="py-4 px-4 text-center text-gray-500">
                  No se encontraron usuarios que coincidan con tu búsqueda
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};

export default UserTable;