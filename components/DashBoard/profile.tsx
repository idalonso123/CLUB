'use client';
import { motion } from 'framer-motion';
import ProfilePhotoEditor from '@/components/DashBoard/ProfileComponents/ProfilePhotoEditor';
import PersonalInfoEditor from '@/components/DashBoard/ProfileComponents/PersonalInfoEditor';
import SecurityEditor from '@/components/DashBoard/ProfileComponents/SecurityEditor';
import LocationEditor from '@/components/DashBoard/ProfileComponents/LocationEditor';
import PropertyInfoEditor from '@/components/DashBoard/ProfileComponents/PropertyInfoEditor';
import useUserProfile from '@/components/DashBoard/hooks/useUserProfile';
import NotificationSystem from '@/components/Admin/Common/NotificationSystem';
import { useState } from 'react';

interface Notification {
    id: number;
    type: 'success' | 'error' | 'info';
    message: string;
}

const UserProfile = () => {

    const [notifications, setNotifications] = useState<Notification[]>([]);

    const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
        const id = Date.now();
        setNotifications(prev => [...prev, { id, type, message }]);

        // Auto-eliminar después de 5 segundos
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== id));
        }, 5000);
    };

    const handlePhotoSave = async () => {
        const success = await savePhoto();
        if (success) {
            showNotification('success', 'Foto de perfil guardada exitosamente');
        }
    };

    const handlePhotoDelete = async () => {
        await removePhoto();
        showNotification('success', 'Foto eliminada correctamente');
    };

    const {
        userData,
        tempUserData,
        passwordData,
        isEditing,
        photoPreview,
        isLoading,
        error,
        emailError,
        phoneError,
        passwordErrors,
        fileInputRef,
        handleChange,
        handlePasswordChange,
        handlePhotoChange,
        removePhoto,
        cancelPhotoChange,
        savePhoto,
        isPhotoChanged,
        isDeleteConfirmOpen,
        setIsDeleteConfirmOpen,
        saveSection,
        cancelEdit,
        startEditing,
        containerVariants,
        itemVariants
    } = useUserProfile();

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                <strong className="font-bold">Error: </strong>
                <span className="block sm:inline">{error}</span>
            </div>
        );
    }

    return (
        <motion.div
            className="max-w-2xl mx-auto p-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            <motion.h2
                className="text-2xl font-bold text-green-800 mb-6 text-center"
                variants={itemVariants}
            >
                Perfil de Usuario
            </motion.h2>
            <ProfilePhotoEditor
                photoPreview={photoPreview}
                handlePhotoChange={handlePhotoChange}
                removePhoto={handlePhotoDelete}
                cancelPhotoChange={cancelPhotoChange}
                fileInputRef={fileInputRef}
                saveSection={handlePhotoSave}
                itemVariants={itemVariants}
                userName={{ firstName: userData.firstName, lastName: userData.lastName }}
                isPhotoChanged={isPhotoChanged}
                isDeleteConfirmOpen={isDeleteConfirmOpen}
                setIsDeleteConfirmOpen={setIsDeleteConfirmOpen}
            />
            <PersonalInfoEditor
                userData={userData}
                tempUserData={tempUserData}
                isEditing={isEditing.personalInfo}
                handleChange={handleChange}
                startEditing={() => startEditing('personalInfo')}
                saveSection={() => saveSection('personalInfo')}
                cancelEdit={() => cancelEdit('personalInfo')}
                itemVariants={itemVariants}
                emailError={emailError}
                phoneError={phoneError}
            />
            <SecurityEditor
                isEditing={isEditing.security}
                tempUserData={tempUserData}
                handleChange={handlePasswordChange}
                passwordData={passwordData}
                passwordErrors={passwordErrors}
                startEditing={() => startEditing('security')}
                saveSection={() => saveSection('security')}
                cancelEdit={() => cancelEdit('security')}
                itemVariants={itemVariants}
            />

            <LocationEditor
                userData={userData}
                tempUserData={tempUserData}
                isEditing={isEditing.location}
                handleChange={handleChange}
                startEditing={() => startEditing('location')}
                saveSection={() => saveSection('location')}
                cancelEdit={() => cancelEdit('location')}
                itemVariants={itemVariants}
            />
            <PropertyInfoEditor
                userData={userData}
                tempUserData={tempUserData}
                isEditing={isEditing.property}
                handleChange={handleChange}
                startEditing={() => startEditing('property')}
                saveSection={() => saveSection('property')}
                cancelEdit={() => cancelEdit('property')}
                itemVariants={itemVariants}
            />
            {/* Sistema de notificaciones */}
            <NotificationSystem notifications={notifications} onClose={(id) =>
                setNotifications(prev => prev.filter(n => n.id !== id))
            } />
        </motion.div>
    );
};

export default UserProfile;