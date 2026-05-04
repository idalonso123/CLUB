import React from 'react';
import { motion } from 'framer-motion';

interface SecurityEditorProps {
    isEditing: boolean;
    tempUserData: any;
    passwordData: {
        currentPassword: string;
        newPassword: string;
        confirmPassword: string;
    };
    passwordErrors?: {
        currentPassword: string | null;
        newPassword: string | null;
        confirmPassword: string | null;
    };
    handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    startEditing: () => void;
    saveSection: () => void;
    cancelEdit: () => void;
    itemVariants: any;
}

const SecurityEditor: React.FC<SecurityEditorProps> = ({
    isEditing,
    handleChange,
    passwordData,
    passwordErrors = {
        currentPassword: null,
        newPassword: null,
        confirmPassword: null
    },
    startEditing,
    saveSection,
    cancelEdit,
    itemVariants
}) => {
    return (
        <motion.div
            className="bg-white shadow rounded-lg p-6 mb-6"
            variants={itemVariants}
        >
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                    <i className="fas fa-lock text-green-600 mr-2"></i>
                    <h3 className="text-lg font-semibold text-gray-700">Seguridad</h3>
                </div>
                {!isEditing && (
                    <button
                        onClick={startEditing}
                        className="text-green-600 hover:text-green-800 transition-colors duration-200"
                    >
                        <i className="fas fa-edit text-xl"></i>
                    </button>
                )}
            </div>
            
            {!isEditing ? (
                <div className="p-3 bg-gray-50 rounded flex justify-between items-center">
                    <p>Contraseña: ••••••••</p>
                </div>
            ) : (
                <div className="space-y-3">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Contraseña actual
                        </label>
                        <input
                            type="password"
                            name="currentPassword"
                            value={passwordData.currentPassword}
                            onChange={handleChange}
                            className={`w-full p-2 border ${passwordErrors.currentPassword ? 'border-red-500' : 'border-gray-300'} rounded focus:ring-2 focus:ring-green-500 focus:outline-none`}
                            placeholder="Introduce tu contraseña actual"
                        />
                        {passwordErrors.currentPassword && (
                            <p className="text-red-500 text-sm mt-1">{passwordErrors.currentPassword}</p>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nueva contraseña
                        </label>
                        <input
                            type="password"
                            name="newPassword"
                            value={passwordData.newPassword}
                            onChange={handleChange}
                            className={`w-full p-2 border ${passwordErrors.newPassword ? 'border-red-500' : 'border-gray-300'} rounded focus:ring-2 focus:ring-green-500 focus:outline-none`}
                            placeholder="Mínimo 6 caracteres"
                        />
                        {passwordErrors.newPassword && (
                            <p className="text-red-500 text-sm mt-1">{passwordErrors.newPassword}</p>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Confirmar nueva contraseña
                        </label>
                        <input
                            type="password"
                            name="confirmPassword"
                            value={passwordData.confirmPassword}
                            onChange={handleChange}
                            className={`w-full p-2 border ${passwordErrors.confirmPassword ? 'border-red-500' : 'border-gray-300'} rounded focus:ring-2 focus:ring-green-500 focus:outline-none`}
                            placeholder="Confirma tu nueva contraseña"
                        />
                        {passwordErrors.confirmPassword && (
                            <p className="text-red-500 text-sm mt-1">{passwordErrors.confirmPassword}</p>
                        )}
                    </div>
                    <div className="flex justify-end space-x-2 mt-4">
                        <button
                            onClick={cancelEdit}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors duration-200 flex items-center"
                        >
                            <i className="fas fa-times mr-2"></i> Cancelar
                        </button>
                        <button
                            onClick={saveSection}
                            className={`px-4 py-2 bg-green-800 text-white rounded hover:bg-green-600 transition-colors duration-200 flex items-center
                              ${!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword
                                ? 'opacity-50 cursor-not-allowed' : ''}`}
                            disabled={!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                        >
                            <i className="fas fa-save mr-2"></i> Guardar
                        </button>
                    </div>
                </div>
            )}
        </motion.div>
    );
};

export default SecurityEditor;