import React from "react";
import { motion } from "framer-motion";
import { UsersTableProps, User} from "@/types/teller";


const UsersTable: React.FC<UsersTableProps> = ({ users, onSelectUser, onViewRedemptions, onOfferRewards, onManagePetCards }) => {
  if (users.length === 0) return null;

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="overflow-x-auto relative w-full">
        <table className="min-w-full divide-y divide-gray-200 table-fixed md:table-auto">
        <thead className="bg-green-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-green-800 uppercase tracking-wider">
              Nombre
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-green-800 uppercase tracking-wider">
              Contacto
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-green-800 uppercase tracking-wider">
              Puntos
            </th>
            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-green-800 uppercase tracking-wider">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {users.map((user, idx) => (
            <motion.tr 
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="hover:bg-gray-50 cursor-pointer"
              onDoubleClick={() => user.id && onViewRedemptions(user)}
              title="Doble clic para ver recompensas"
            >
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10 bg-green-100 rounded-full flex items-center justify-center text-green-700">
                    {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">{user.firstName} {user.lastName}</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-500">{user.email}</div>
                <div className="text-sm text-gray-500">{user.phone}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900 flex items-center">
                  <i className="fas fa-star text-yellow-400 mr-1"></i>
                  {typeof user.points === 'number' ? user.points : 0}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                {user.id && (
                  <>
                    <motion.button
                      onClick={() => onSelectUser(user)}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <i className="fas fa-coins mr-1"></i>
                      Añadir saldo
                    </motion.button>
                    
                    <motion.button
                      onClick={() => onViewRedemptions(user)}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <i className="fas fa-gift mr-1"></i>
                      Recompensas
                    </motion.button>
                    
                    {onManagePetCards && (
                      <motion.button
                        onClick={() => onManagePetCards(user)}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <i className="fas fa-paw mr-1"></i>
                        Carnet de mascota
                      </motion.button>
                    )}
                  </>
                )}
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
    </div>
  );
};

export default UsersTable;
