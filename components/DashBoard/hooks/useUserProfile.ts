import { useState, useRef, ChangeEvent, useEffect } from 'react';
import { useRouter } from 'next/router';
import { UserData, EditingState, PasswordData } from '@/types/user';
import toast from 'react-hot-toast';
import phonePrefixesData from '@/data/phonePrefixes.json';

const useUserProfile = () => {
    const router = useRouter();
    const [userData, setUserData] = useState<UserData>({
        firstName: '',
        lastName: '',
        email: '',
        password: '********',
        phonePrefix: '',
        phone: '',
        city: '',
        postalCode: '',
        country: '',
        points: 0,
        property: {
            characteristics: [],
            animals: [],
            description: '',
            surfaceArea: 0
        }
    });
    const [emailError, setEmailError] = useState<string | null>(null);
    const [phoneError, setPhoneError] = useState<string | null>(null);
    const [passwordErrors, setPasswordErrors] = useState({
        currentPassword: null as string | null,
        newPassword: null as string | null,
        confirmPassword: null as string | null
    });
    const [photoPreview, setPhotoPreview] = useState<string>('/default-avatar.jpg');
    const [tempPhotoPreview, setTempPhotoPreview] = useState<string>('/default-avatar.jpg');
    const [isPhotoChanged, setIsPhotoChanged] = useState<boolean>(false);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState<boolean>(false);
    const [currentPhotoFile, setCurrentPhotoFile] = useState<File | null>(null);
    const [isEditing, setIsEditing] = useState<EditingState>({
        personalInfo: false,
        security: false,
        location: false,
        property: false
    });
    const [tempUserData, setTempUserData] = useState<UserData>({ ...userData });
    const [passwordData, setPasswordData] = useState<PasswordData>({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    // Using null! assertion to tell TypeScript this ref will be assigned a non-null value
    const fileInputRef = useRef<HTMLInputElement>(null) as React.RefObject<HTMLInputElement>;

    useEffect(() => {
        fetchUserProfile();
    }, []);

    const fetchUserProfile = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/user/profile');
            if (!response.ok) {
                if (response.status === 401) {
                    router.push('/login');
                    return;
                }
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }
            const data = await response.json();

            if (data.success && data.user) {
                const user = {
                    ...data.user,
                    property: data.user.property || {
                        characteristics: [],
                        animals: [],
                        description: '',
                        surfaceArea: 0
                    }
                };
                
                setUserData(user);
                setTempUserData(user);
                // Manejar la foto de perfil
                if (data.user.photoUrl) {
                    console.log('Foto de perfil encontrada:', data.user.photoUrl);
                    setPhotoPreview(data.user.photoUrl);
                    setTempPhotoPreview(data.user.photoUrl);
                } else {
                    console.log('No se encontró foto de perfil, usando default');
                    setPhotoPreview('/default-avatar.jpg');
                    setTempPhotoPreview('/default-avatar.jpg');
                }
            } else {
                throw new Error(data.message || 'Error al cargar el perfil');
            }
        } catch (err) {
            setError(`No se pudo cargar el perfil: ${(err as Error).message}`);
            toast.error('Error al cargar el perfil');
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        
        if (name === 'property' && typeof value === 'object') {
            setTempUserData(prev => {
                const newData = {
                    ...prev,
                    property: value
                };
                return newData;
            });
        } else if (name === 'characteristics' || name === 'animals' || name === 'description' || name === 'surfaceArea') {
            setTempUserData(prev => ({
                ...prev,
                property: {
                    ...prev.property || {
                        characteristics: [],
                        animals: [],
                        description: '',
                        surfaceArea: 0
                    },
                    [name]: value
                }
            }));
        } else {
            setTempUserData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handlePhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files[0]) {
            const file = files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                setTempPhotoPreview(reader.result as string);
                setIsPhotoChanged(true);
            };
            reader.readAsDataURL(file);
            setCurrentPhotoFile(file);
        }
    };

    const uploadPhoto = async (file: File) => {
        const formData = new FormData();
        formData.append('photo', file);
        try {
            const response = await fetch('/api/user/photo', {
                method: 'PUT',
                body: formData
            });
            const data = await response.json();
            if (response.ok && data.success) {
                toast.success('Foto de perfil actualizada');
                setUserData(prev => ({
                    ...prev,
                    photoUrl: data.photoUrl
                }));
            } else {
                throw new Error(data.message || 'Error al subir la foto');
            }
        } catch (error) {
            toast.error('Error al subir la foto');
        }
    };

    const removePhoto = async () => {
        try {
            const response = await fetch('/api/user/photo', {
                method: 'DELETE',
            });
            
            const data = await response.json();
            
            if (response.ok && data.success) {
                setPhotoPreview('/default-avatar.jpg');
                setTempPhotoPreview('/default-avatar.jpg');
                setUserData(prev => ({
                    ...prev,
                    photoUrl: null
                }));
                
                if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                }
                
                setIsDeleteConfirmOpen(false);
                toast.success('Foto eliminada correctamente');
            } else {
                throw new Error(data.message || 'Error al eliminar la foto');
            }
        } catch (error) {
            console.error('Error al eliminar la foto:', error);
            toast.error('Error al eliminar la foto');
            setIsDeleteConfirmOpen(false);
        }
    };

    const cancelPhotoChange = () => {
        setTempPhotoPreview(photoPreview);
        setIsPhotoChanged(false);
        setCurrentPhotoFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const savePhoto = async () => {
        if (currentPhotoFile) {
            try {
                await uploadPhoto(currentPhotoFile);
                setPhotoPreview(tempPhotoPreview);
                setIsPhotoChanged(false);
                setCurrentPhotoFile(null);
                toast.success('Foto de perfil guardada correctamente');
                return true;
            } catch (error) {
                toast.error('Error al guardar la foto');
                return false;
            }
        }
        return false;
    };

    const updateProfile = async (data: any) => {
        try {
            // Limpiar errores antes de intentar actualizar
            setEmailError(null);
            setPhoneError(null);
            setPasswordErrors({
                currentPassword: null,
                newPassword: null,
                confirmPassword: null
            });
            
            const response = await fetch('/api/user/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            const result = await response.json();
            
            if (response.ok && result.success) {
                toast.success('Perfil actualizado correctamente');
                if (result.user) {
                    // Actualizar userData con los datos del servidor
                    setUserData(prevData => ({
                        ...prevData,
                        ...result.user
                    }));
                    
                    // Si estamos actualizando el teléfono, actualizar también tempUserData
                    if (data.phone) {
                        setTempUserData(prevTemp => ({
                            ...prevTemp,
                            phone: result.user.phone || data.phone
                        }));
                    }
                }
                return true;
            } else {
                // Verificar si es un error de correo electrónico duplicado
                if (response.status === 409 && result.message.includes('correo electrónico')) {
                    setEmailError('Este correo electrónico ya está en uso por otro usuario');
                    toast.error(result.message);
                    return false;
                }
                
                // Verificar si es un error de teléfono duplicado
                if (response.status === 409 && result.message.includes('teléfono')) {
                    setPhoneError('Este número de teléfono ya está en uso por otro usuario');
                    toast.error(result.message);
                    return false;
                }
                
                // Verificar si es un error de contraseña
                if ((response.status === 401 || response.status === 400) && result.message.includes('contraseña actual')) {
                    setPasswordErrors(prev => ({
                        ...prev,
                        currentPassword: 'La contraseña actual es incorrecta'
                    }));
                    toast.error(result.message);
                    return false;
                }
                
                throw new Error(result.message || 'Error al actualizar el perfil');
            }
        } catch (error) {
            toast.error(`Error: ${(error as Error).message}`);
            return false;
        }
    };

    // --- LÓGICA PARA GUARDAR CONTACTO: unir prefijo y número ---
    const saveSection = async (section: keyof EditingState | 'photo') => {
        switch (section) {
            case 'personalInfo':
                if (!tempUserData.firstName || !tempUserData.lastName || !tempUserData.email) {
                    toast.error('Completa todos los campos personales');
                    return;
                }
                if (!/\S+@\S+\.\S+/.test(tempUserData.email)) {
                    toast.error('Email inválido');
                    return;
                }
                
                // Validar teléfono si se proporciona
                const phonePrefix = tempUserData.phonePrefix || '+34';
                const phone = tempUserData.phone || '';
                if (phone && !/^\d+$/.test(phone)) {
                    setPhoneError('El teléfono solo debe contener números');
                    return;
                }
                
                // Preparar datos para actualizar
                const personalData: any = {
                    firstName: tempUserData.firstName,
                    lastName: tempUserData.lastName,
                    email: tempUserData.email,
                    birthDate: tempUserData.birthDate
                };
                
                // Incluir teléfono si se proporcionó
                if (phone) {
                    personalData.phone = `${phonePrefix} ${phone}`;
                }
                
                if (await updateProfile(personalData)) {
                    setIsEditing(prev => ({ ...prev, personalInfo: false }));
                }
                break;
            case 'security':
                // Limpiar errores previos
                setPasswordErrors({
                    currentPassword: null,
                    newPassword: null,
                    confirmPassword: null
                });
                
                // Validar que la contraseña actual no esté vacía
                if (!passwordData.currentPassword) {
                    setPasswordErrors(prev => ({
                        ...prev,
                        currentPassword: 'Debes ingresar tu contraseña actual'
                    }));
                    return;
                }
                
                // Validar longitud mínima de la nueva contraseña
                if (passwordData.newPassword.length < 6) {
                    setPasswordErrors(prev => ({
                        ...prev,
                        newPassword: 'La contraseña debe tener al menos 6 caracteres'
                    }));
                    return;
                }
                
                // Validar que las contraseñas coincidan
                if (passwordData.newPassword !== passwordData.confirmPassword) {
                    setPasswordErrors(prev => ({
                        ...prev,
                        confirmPassword: 'Las contraseñas no coinciden'
                    }));
                    return;
                }
                
                if (await updateProfile({
                    currentPassword: passwordData.currentPassword,
                    newPassword: passwordData.newPassword
                })) {
                    setPasswordData({
                        currentPassword: '',
                        newPassword: '',
                        confirmPassword: ''
                    });
                    setIsEditing(prev => ({ ...prev, security: false }));
                }
                break;

            case 'location':
                if (!tempUserData.city || !tempUserData.postalCode || !tempUserData.country) {
                    toast.error('Completa todos los campos de ubicación');
                    return;
                }
                if (await updateProfile({
                    city: tempUserData.city,
                    postalCode: tempUserData.postalCode,
                    country: tempUserData.country,
                    address: tempUserData.address === undefined ? '' : tempUserData.address
                })) {
                    setIsEditing(prev => ({ ...prev, location: false }));
                }
                break;
            case 'property':
                const uniqueCharacteristics = [...new Set(tempUserData.property?.characteristics || [])];
                const uniqueAnimals = [...new Set(tempUserData.property?.animals || [])];
                
                const propertyData = {
                    property: {
                        characteristics: uniqueCharacteristics,
                        animals: uniqueAnimals,
                        description: tempUserData.property?.description || '',
                        surfaceArea: tempUserData.property?.surfaceArea || 0
                    }
                };
                
                if (await updateProfile(propertyData)) {
                    setIsEditing(prev => ({ ...prev, property: false }));
                }
                break;
        }
    };

    const cancelEdit = (section: keyof EditingState) => {
        setTempUserData({ ...userData });
        if (section === 'security') {
            setPasswordData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            });
            // Limpiar errores de contraseña
            setPasswordErrors({
                currentPassword: null,
                newPassword: null,
                confirmPassword: null
            });
        }
        // Limpiar el error de email al cancelar la edición
        if (section === 'personalInfo') {
            setEmailError(null);
            setPhoneError(null);
        }
        setIsEditing(prev => ({
            ...prev,
            [section]: false
        }));
    };

    const startEditing = (section: keyof EditingState) => {
        const userDataCopy = JSON.parse(JSON.stringify(userData));
        if (section === 'personalInfo') {
            // Separar prefijo y número usando la lista de prefijos válidos
            let phonePrefix = '+34';
            let phone = '';
            if (userData.phone) {
                const allPrefixes = phonePrefixesData.flatMap(r => r.prefixes.map(p => p.value)).sort((a, b) => b.length - a.length);
                const foundPrefix = allPrefixes.find(prefix => userData.phone.startsWith(prefix));
                if (foundPrefix) {
                    phonePrefix = foundPrefix;
                    phone = userData.phone.slice(foundPrefix.length).trim();
                } else {
                    phone = userData.phone;
                }
            }
            setTempUserData({ ...userDataCopy, phonePrefix, phone });
        } else {
            setTempUserData(userDataCopy);
        }
        setIsEditing(prev => ({ ...prev, [section]: true }));
    };

    // Formatear el teléfono para mostrar el prefijo y el número separados visualmente
    function getFormattedPhone() {
        if (!userData.phone) return '';
        
        // Si el teléfono ya tiene un espacio, probablemente ya está formateado correctamente
        if (userData.phone.includes(' ')) {
            return userData.phone;
        }
        
        // Obtener todos los prefijos posibles ordenados de mayor a menor longitud
        const allPrefixes = phonePrefixesData.flatMap(r => r.prefixes.map(p => p.value)).sort((a, b) => b.length - a.length);
        const foundPrefix = allPrefixes.find(prefix => userData.phone.startsWith(prefix));
        if (foundPrefix) {
            return `${foundPrefix} ${userData.phone.slice(foundPrefix.length)}`;
        }
        
        // Fallback: intentar con regex antiguo
        const match = userData.phone.match(/^(\+\d{1,4})(\d{6,})$/);
        if (match) {
            return `${match[1]} ${match[2]}`;
        }
        
        return userData.phone;
    }

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                duration: 0.5,
                when: "beforeChildren",
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { type: "spring" as const, stiffness: 300, damping: 20 }
        }
    };

    return {
        userData,
        tempUserData,
        passwordData,
        isEditing,
        photoPreview: isPhotoChanged ? tempPhotoPreview : photoPreview,
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
        itemVariants,
        getFormattedPhone, // <-- exportar función para mostrar el teléfono formateado
        fetchUserProfile // <-- exportar función para recargar los datos del usuario
    };
};

export default useUserProfile;
