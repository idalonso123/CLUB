import { useState, ChangeEvent, FormEvent, useEffect } from "react";
import { useRouter } from "next/router";

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  birthDate: string;
  phonePrefix: string;
  phone: string;
  city: string;
  postalCode: string;
  country: string;
  terms: boolean;
  isOldCustomer: boolean | null;
  tarjeta_cliente?: string;
  photo: File | null;
  caracteristicas_vivienda: string[];
  animales: string[];
}

interface FormErrors {
  [key: string]: string;
}

const useRegister = () => {
  const router = useRouter();
  const [registeredUserId, setRegisteredUserId] = useState<number | null>(null);
  const [welcomePoints, setWelcomePoints] = useState<number>(5);
  
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch('/api/config');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.config && data.config.puntosBienvenida) {
            setWelcomePoints(data.config.puntosBienvenida);
          }
        }
      } catch (error) {
        console.error('Error al cargar la configuración de puntos de bienvenida:', error);
      }
    };
    
    fetchConfig();
  }, []);
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    birthDate: "",
    phonePrefix: "+34",
    phone: "",
    city: "",
    postalCode: "",
    country: "",
    terms: false,
    isOldCustomer: null,
    tarjeta_cliente: "",
    photo: null,
    caracteristicas_vivienda: [],
    animales: [],
  });
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [serverErrors, setServerErrors] = useState<{
    email?: string;
    phone?: string;
    general?: string;
  }>({});
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const autoLogin = async (
    email: string,
    password: string
  ): Promise<boolean> => {
    try {
      setSuccessMessage("¡Registro exitoso! Iniciando sesión...");
      const loginResponse = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (loginResponse.ok) {
        const loginResult = await loginResponse.json();
        if (loginResult.success && loginResult.user) {
          localStorage.setItem("user", JSON.stringify(loginResult.user));
          return true;
        }
      }
      return false;
    } catch {
      return false;
    }
  };

  const handleChange = (
    e:
      | ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
      | { target: { name: string; value: any } }
  ) => {
    const { name, value } = e.target as any;
    // Si value es un array, lo asignamos directamente (para checkboxes múltiples)
    if (Array.isArray(value)) {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    } else {
      const type = (e.target as any).type;
      const checked = (e.target as any).checked;
      if (name === "phone") {
        const onlyNums = value.replace(/[^0-9]/g, "");
        setFormData((prev) => ({ ...prev, [name]: onlyNums }));
      } else if (name === "postalCode") {
        const onlyNums = value.replace(/[^0-9]/g, "").slice(0, 5);
        setFormData((prev) => ({ ...prev, [name]: onlyNums }));
      } else {
        setFormData((prev) => ({
          ...prev,
          [name]: type === "checkbox" ? checked : value,
        }));
      }
    }
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
    if (successMessage) setSuccessMessage("");
    if (errorMessage) setErrorMessage("");
  };

  const handlePhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      setFormData((prev) => ({ ...prev, photo: file }));
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
      if (errors.photo) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.photo;
          return newErrors;
        });
      }
    }
  };

  const removePhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPhotoPreview(null);
    setFormData((prev) => ({ ...prev, photo: null }));
    const fileInput = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    console.log("Validando form", formData);
    
    if (!formData.firstName) newErrors.firstName = "El nombre es requerido";
    if (!formData.lastName) newErrors.lastName = "El apellido es requerido";
    if (!formData.email) {
      newErrors.email = "El email es requerido";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email inválido";
    }
    if (!formData.password) {
      newErrors.password = "La contraseña es requerida";
    } else if (formData.password.length < 6) {
      newErrors.password = "La contraseña debe tener al menos 6 caracteres";
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Las contraseñas no coinciden";
    }
    if (!formData.birthDate) {
      newErrors.birthDate = "La fecha de nacimiento es obligatoria";
    } else {
      const today = new Date();
      const birthDate = new Date(formData.birthDate);
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      if (age < 18) {
        newErrors.birthDate = "Debe ser mayor de edad para registrarse";
      }
    }
    if (!formData.phone) {
      newErrors.phone = "El teléfono es requerido";
    } else if (formData.phone.length < 9) {
      newErrors.phone = "El teléfono debe tener al menos 9 dígitos";
    }
    if (!formData.city) newErrors.city = "La provincia es requerida";
    if (!formData.postalCode) {
      newErrors.postalCode = "El código postal es requerido";
    }
    if (!formData.country) newErrors.country = "El país es requerido";
    if (!formData.terms) {
      newErrors.terms = "Debes aceptar los términos y condiciones";
    }
    
    if (formData.isOldCustomer === null) {
      newErrors.isOldCustomer = "Debes indicar si has sido cliente anteriormente";
    }
    
    // Las siguientes líneas podrían estar causando un problema ya que estamos intentando
    // validar campos de la segunda página y podrían no estar establecidos correctamente en el estado
    if (!formData.caracteristicas_vivienda || formData.caracteristicas_vivienda.length === 0) {
      newErrors.caracteristicas_vivienda = "Selecciona al menos una característica de la vivienda";
    }
    if (!formData.animales || formData.animales.length === 0) {
      newErrors.animales = "Selecciona al menos una opción de animales";
    }
    
    console.log("Errores encontrados:", newErrors);
    setErrors(newErrors);
    
    const isValid = Object.keys(newErrors).length === 0;
    console.log("Formulario válido:", isValid);
    return isValid;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    console.log("Inicio handleSubmit");
    setSuccessMessage("");
    setErrorMessage("");
    setServerErrors({});

    const isValid = validate();
    console.log("Validación pasada:", isValid, "Errores:", errors);

    if (isValid) {
      setIsSubmitting(true);
      try {
        console.log("Preparando datos para enviar");
        
        let response;
        
        // Si hay una foto, usar FormData para enviar los datos
        if (formData.photo) {
          console.log("Enviando con foto usando FormData");
          const formDataToSend = new FormData();
          
          // Añadir todos los campos del formulario
          formDataToSend.append('firstName', formData.firstName || "");
          formDataToSend.append('lastName', formData.lastName || "");
          formDataToSend.append('email', formData.email || "");
          formDataToSend.append('password', formData.password || "");
          formDataToSend.append('birthDate', formData.birthDate || "");
          formDataToSend.append('phonePrefix', formData.phonePrefix || "+34");
          formDataToSend.append('phone', formData.phone || "");
          formDataToSend.append('city', formData.city || "");
          formDataToSend.append('postalCode', formData.postalCode || "");
          formDataToSend.append('country', formData.country || "");
          
          // Añadir arrays como múltiples entradas con el mismo nombre
          formData.caracteristicas_vivienda.forEach(item => {
            formDataToSend.append('caracteristicas_vivienda', item);
          });
          
          formData.animales.forEach(item => {
            formDataToSend.append('animales', item);
          });
          
          // Añadir la foto
          formDataToSend.append('photo', formData.photo);
          
          console.log("FormData preparado, enviando petición");
          response = await fetch("/api/auth/register", {
            method: "POST",
            body: formDataToSend,
          });
        } else {
          // Si no hay foto, usar JSON como antes
          console.log("Enviando sin foto usando JSON");
          const jsonData = {
            firstName: formData.firstName || "",
            lastName: formData.lastName || "",
            email: formData.email || "",
            password: formData.password || "",
            birthDate: formData.birthDate || "",
            phonePrefix: formData.phonePrefix || "+34",
            phone: formData.phone || "",
            city: formData.city || "",
            postalCode: formData.postalCode || "",
            country: formData.country || "",
            caracteristicas_vivienda: formData.caracteristicas_vivienda,
            animales: formData.animales,
          };
          
          console.log("Datos JSON preparados, enviando petición");
          response = await fetch("/api/auth/register", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(jsonData),
          });
        }
        
        console.log("Respuesta recibida:", response.status);

        const result = await response.json();
        console.log("Resultado:", result);

        if (response.ok) {
          setSuccessMessage("¡Registro exitoso! Iniciando sesión...");
          if (result.user) {
            // Comprobar si es id o codigo según la estructura de la BD
            const userId = result.user.codigo || result.user.id || null;
            console.log("ID de usuario detectado:", userId);
            if (userId) {
              setRegisteredUserId(userId);
              
              console.log("Valor de isOldCustomer en el formulario:", formData.isOldCustomer, typeof formData.isOldCustomer);
              
              const currentUserId = userId;
              
              try {
                if (formData.isOldCustomer === true) {
                  console.log("Usuario seleccionó que SÍ es cliente antiguo");
                  
                  const checkResponse = await fetch("/api/auth/check-old-customer", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      email: formData.email,
                      phone: formData.phone,
                      tarjeta_cliente: formData.tarjeta_cliente
                    }),
                  });
                  
                  const checkResult = await checkResponse.json();
                  console.log("Respuesta de verificación de cliente antiguo:", checkResult);
                  
                  if (checkResponse.ok && checkResult.success) {

                    console.log("Cliente antiguo encontrado, restaurando puntos:", {
                      userId: currentUserId,
                      puntos: checkResult.customer.puntos
                    });
                    
                    const restoreResponse = await fetch("/api/auth/restore-points", {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({
                        userId: currentUserId,
                        points: checkResult.customer.puntos,
                        email: formData.email,
                        phone: formData.phone,
                        tarjeta_cliente: formData.tarjeta_cliente
                      }),
                    });
                    
                    const restoreResult = await restoreResponse.json();

                    console.log("Respuesta de restauración de puntos:", restoreResult);
                    
                    if (restoreResponse.ok) {
                      setSuccessMessage(`¡Bienvenido de nuevo! Hemos restaurado ${checkResult.customer.puntos} puntos a tu cuenta.`);
                    } else {
                      console.error("Error al restaurar puntos:", restoreResult);
                      setErrorMessage(`Hubo un problema al restaurar tus puntos antiguos: ${restoreResult.message || 'Error desconocido'}`);
                    }
                  } else {
                    setSuccessMessage("No encontramos registros de cliente antiguo con tus datos. ¡Bienvenido a ViveVerde!");
                  }
                } else {
                  const userIdNum = parseInt(userId as string, 10);
                  try {
                    const requestBody = {
                      userId: userIdNum, 
                      points: welcomePoints
                    };
                    
                    const addWelcomePointsResponse = await fetch(`/api/auth/welcome-points`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(requestBody),
                    });
                    
                    const responseData = await addWelcomePointsResponse.json();
                    
                    if (addWelcomePointsResponse.ok) {
                      setSuccessMessage(`¡Registro completado con éxito! Te hemos otorgado ${welcomePoints} puntos de bienvenida.`);
                    } else {
                      setSuccessMessage("¡Registro completado con éxito!");
                    }
                  } catch (error) {
                    console.error("Error al añadir puntos de bienvenida:", error);
                    setSuccessMessage("¡Registro completado con éxito!");
                  }
                }
              } catch (error) {
                console.error("Error al procesar la opción de cliente antiguo:", error);
                setErrorMessage("Ocurrió un error al procesar tu registro. Por favor, inténtalo de nuevo.");
              }
              
              const loginSuccess = await autoLogin(formData.email, formData.password);
              if (loginSuccess) {
                setTimeout(() => {
                  router.push("/dashboard");
                }, 1500);
              } else {
                setErrorMessage("Registro exitoso pero hubo un problema al iniciar sesión automáticamente.");
                setTimeout(() => {
                  router.push("/login?registered=true");
                }, 2000);
              }
            } else {
              console.error("No se pudo determinar el ID del usuario en la respuesta", result.user);
            }
          }
        } else {
          if (response.status === 409) {
            if (result.field === "email") {
              setServerErrors({
                email: "Este correo electrónico no puede ser utilizado",
              });
            } else if (result.field === "phone") {
              setServerErrors({
                phone: "Este número de teléfono no puede ser utilizado",
              });
            } else {
              setServerErrors({
                general: result.message || "Este usuario no puede crearse",
              });
            }
          } else {
            setErrorMessage(result.message || "Error al registrar el usuario");
          }
        }
      } catch (error) {
        console.error("Error en handleSubmit:", error);
        setErrorMessage(
          "Ha ocurrido un error al procesar tu registro. Por favor, inténtalo de nuevo."
        );
      } finally {
        setIsSubmitting(false);
      }
    } else {
      console.log("Errores de validación:", errors);
    }
  };

  const inputVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 20,
      },
    },
  };

  const buttonVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        delay: 0.4,
        type: "spring",
        stiffness: 200,
        damping: 15,
      },
    },
    hover: {
      scale: 1.05,
      backgroundColor: "#15803d",
    },
    tap: { scale: 0.95 },
  };

  return {
    formData,
    setFormData,
    photoPreview,
    errors,
    isSubmitting,
    serverErrors,
    successMessage,
    errorMessage,
    handleChange,
    handlePhotoChange,
    removePhoto,
    handleSubmit,
    inputVariants,
    buttonVariants,
  };
};

export default useRegister;
