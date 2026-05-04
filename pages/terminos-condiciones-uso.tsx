import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppConfig, ClientLevel } from '@/components/hooks/useExpirationConfig';
import { termsUsageTitle, getCompanyName } from '@/lib/utils/pageUtils';

interface TermsPageProps {
  title: string;
}

// Constantes para valores que no vienen de la configuración
const POINTS_FOR_VOUCHER = 50;
const VOUCHER_VALUE = 5;
const MINIMUM_SPEND_FOR_VOUCHER = 19;
const POINTS_WELCOME = 5;
const MONTHS_ADVANCE_NOTICE = 30;

// Interfaz para las preguntas frecuentes
interface FAQItem {
  question: string;
  answer: string;
}

const TermsPage: React.FC<TermsPageProps> = ({ title }) => {
  const { config, loading, error } = useAppConfig();
  const [isClient, setIsClient] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const companyName = getCompanyName();

  // Función para formatear el rango de puntos
  const formatPointsRange = (level: ClientLevel): string => {
    if (level.puntosMaximos === null) {
      return `${level.puntosMinimos} puntos en adelante`;
    }
    return `Desde ${level.puntosMinimos} puntos hasta ${level.puntosMaximos} puntos`;
  };

  // Función para formatear la compra mínima
  const formatPurchaseRequirement = (level: ClientLevel): string => {
    if (level.eurosCompraMinima === 0) {
      return 'Sin compra mínima semestral.';
    }
    return `Compra mínima semestral de ${level.eurosCompraMinima} €`;
  };

  // Función para obtener los beneficios por nivel
  const getLevelBenefits = (level: ClientLevel): string[] => {
    const benefits: string[] = [];

    // Beneficio base para todos los niveles
    benefits.push('Descuentos especiales para miembros del club');

    if (level.nivel >= 2) {
      benefits.push(`Cheque ${VOUCHER_VALUE} € al alcanzar ${POINTS_FOR_VOUCHER} puntos, válido desde el día siguiente`);
      benefits.push('Acceso al catálogo de recompensas con diferentes artículos para canjear por puntos');
    }

    if (level.nivel >= 3) {
      benefits.push('Descuentos exclusivos adicionales para este nivel');
    }

    if (level.nivel >= 4) {
      benefits.push('Asesoramiento personalizado sobre productos Viveverde');
      benefits.push('Acceso prioritario a eventos');
    }

    return benefits;
  };

  // Función para togglear las preguntas frecuentes
  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  // Lista de preguntas frecuentes
  const faqItems: FAQItem[] = [
    {
      question: '¿Qué hago si no me han contabilizado los puntos de mi compra?',
      answer: 'Si detectas que no se han contabilizado correctamente los puntos de una compra, ponte en contacto con nuestro equipo a través de la página de contacto. Necesitarás proporcionar tu número de tarjeta, la fecha de la compra y el ticket o comprobante. Investigaremos el caso y procederemos a corregir la situación en un plazo máximo de 7 días hábiles.'
    },
    {
      question: '¿Puedo transferir mis puntos a un familiar o amigo?',
      answer: 'No, los puntos acumulados en tu cuenta son personales e intransferibles. El programa de fidelidad está vinculado a tu identidad y no está permitido transferir puntos entre diferentes titulares. Esta restricción está diseñada para garantizar la equidad entre todos los miembros del club.'
    },
    {
      question: '¿Qué sucede con mis puntos si devuelvo un producto?',
      answer: 'En caso de devolución de un producto, los puntos correspondientes a esa compra serán descontados de tu saldo. Si los puntos ya habían sido canjeados por recompensas o cheques, estos deberán ser devueltos o su valor será descontado del reembolso. Es importante conservar el ticket de devolución como comprobante.'
    },
    {
      question: '¿Qué ocurre si pierdo mi tarjeta de fidelidad?',
      answer: 'Si pierdes tu tarjeta física, ponte en contacto con nosotros a través de la página de contacto para reportarlo. Podremos desactivar la tarjeta perdida y emitir una nueva con los mismos datos y saldo de puntos. También puedes utilizar la versión digital de tu tarjeta (QR) desde nuestra app o web para seguir acumulando puntos sin necesidad de la tarjeta física.'
    },
    {
      question: '¿Cómo funciona el carnet de mascota y cómo sé cuántos sellos tengo?',
      answer: 'El carnet de mascota funciona de forma independiente al programa de puntos. Cada vez que compras un saco de pienso de la misma marca, sabor y peso, recibirás un sello. Al completar 6 compras (configurable según tu club), el siguiente saco será gratuito. Puedes consultar tus sellos restantes accediendo a tu perfil desde la app, web o preguntando en tienda.'
    },
    {
      question: '¿Puedo usar los cheques de descuento junto con otras promociones?',
      answer: 'Generalmente, los cheques de descuento obtenidos con puntos no pueden combinarse con otras promociones activas salvo indicación expresa en el momento del canje. Los cheques tampoco pueden utilizarse para cubrir gastos de envío ni servicios de mano de obra. Consulta las condiciones específicas en el momento de cada promoción.'
    },
    {
      question: '¿Qué pasa si no reach la compra mínima para mantener mi nivel?',
      answer: 'Si durante el periodo establecido para tu nivel no realizas la compra mínima requerida, perderás el nivel alcanzado y regresarás al Nivel Semilla. Esto significa que perderás acceso a los beneficios exclusivos de tu nivel anterior, aunque mantendrás los puntos acumulados. Podrás volver a escalar niveles realizando nuevas compras.'
    },
    {
      question: '¿Cómo puedo contactar con el servicio de atención al cliente del programa?',
      answer: 'Puedes contactar con nuestro equipo a través de nuestra página de contacto, donde encontrarás un formulario para enviar tus consultas. También puedes visitarnos en tienda física, donde nuestro personal estará encantado de ayudarte con cualquier duda relacionada con el programa de fidelidad.'
    }
  ];

  if (!isClient) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={`Términos y Condiciones de Uso - ${companyName}`} />
      </Head>

      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <motion.div 
          className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4">
            <h1 className="text-2xl md:text-3xl font-bold text-white">
              {title}
            </h1>
          </div>

          {/* Content */}
          <div className="p-6 md:p-8 prose prose-green max-w-none">
            {/* Introducción */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <p className="text-gray-700 leading-relaxed">
                {companyName} es un programa gratuito que premia la confianza de nuestros clientes habituales mediante un sistema de puntos y niveles que ofrecen ventajas exclusivas. Al unirte y utilizar tu tarjeta, aceptas los siguientes términos y condiciones.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Es imprescindible completar correctamente todos los datos personales requeridos para acceder a las ventajas del Club. La falta de cualquiera de estos datos inhabilita automáticamente la participación en el programa, así como el acceso a descuentos, promociones y beneficios asociados.
              </p>
            </motion.div>

            {/* Sección 0: Definiciones */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25 }}
            >
              <h2 className="text-xl font-bold text-green-800 mt-8 mb-4 flex items-center">
                <span className="bg-green-100 text-green-700 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm">0</span>
                Definiciones
              </h2>
              
              <p className="text-gray-700 mb-4">
                Para facilitar la comprensión de este documento, a continuación se definen los términos más utilizados en el programa de fidelidad:
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-800 mb-2">Puntos de Fidelidad</h3>
                  <p className="text-sm text-gray-700">
                    Unidades de valor que se acumulan con cada compra realizada. Cada {config?.eurosPorPunto || '3,50'} € de compra equivale a 1 punto. Los puntos tienen una vigencia de {config?.caducidad_puntos_meses || 12} meses desde su generación.
                  </p>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-800 mb-2">Nivel</h3>
                  <p className="text-sm text-gray-700">
                    Categoría de pertenencia al club que determina los beneficios disponibles. Existen múltiples niveles progresivos (Semilla, Brote, Planta, Árbol) basados en el gasto acumulado en los últimos {config?.caducidad_puntos_meses || 12} meses.
                  </p>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-800 mb-2">Cheque/Recompensa</h3>
                  <p className="text-sm text-gray-700">
                    Beneficio obtenible al acumular {POINTS_FOR_VOUCHER} puntos (disponible desde Nivel Brote). Consiste en un cheque de {VOUCHER_VALUE} € aplicable a cualquier compra con un gasto mínimo de {MINIMUM_SPEND_FOR_VOUCHER} €.
                  </p>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-800 mb-2">Sello</h3>
                  <p className="text-sm text-gray-700">
                    Marcación otorgada por la compra de pienso para mascotas. Al completar {config?.sellos_requeridos_carnet || 6} sellos, el siguiente saco de pienso de la misma marca, sabor y peso será gratuito.
                  </p>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-800 mb-2">Caducidad</h3>
                  <p className="text-sm text-gray-700">
                    Fecha límite de validez. Los puntos caducan a los {config?.caducidad_puntos_meses || 12} meses de su generación. El carnet de mascota caduca por inactividad ({config?.caducidad_carnet_inactividad_meses || 6} meses sin sellar) o por antigüedad máxima ({config?.caducidad_carnet_antiguedad_meses || 24} meses desde creación).
                  </p>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-800 mb-2">Canje</h3>
                  <p className="text-sm text-gray-700">
                    Acción de intercambiar los puntos acumulados por recompensas, cheques de descuento u otros beneficios disponibles en el catálogo de recompensas del club.
                  </p>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-800 mb-2">Referido</h3>
                  <p className="text-sm text-gray-700">
                    Acción de recomendar el programa a un amigo o familiar. Al traer a un nuevo miembro al club, tanto el referido como quien lo recomienda pueden obtener puntos de bonificación.
                  </p>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-800 mb-2">Tarjeta Digital</h3>
                  <p className="text-sm text-gray-700">
                    Versión electrónica de la tarjeta física disponible a través de nuestra app o web. Contiene un código QR que permite identificarte en tienda sin necesidad de llevar la tarjeta física.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Sección 1: Acumulación de Puntos */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <h2 className="text-xl font-bold text-green-800 mt-8 mb-4 flex items-center">
                <span className="bg-green-100 text-green-700 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm">1</span>
                Acumulación de Puntos
              </h2>
              
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>
                  Por cada {config?.eurosPorPunto || '3,50'} € de compra, acumulas 1 punto de fidelidad.
                </li>
                <li>
                  La acumulación de puntos es automática al realizar compras en nuestra tienda física y/o canales autorizados, siempre que proporciones tu información como miembro del club.
                </li>
                <li>
                  Los puntos no tienen valor monetario, no son canjeables por efectivo y no son transferibles entre personas.
                </li>
                <li>
                  También puedes acumular puntos realizando acciones como:
                  <ul className="list-disc pl-6 mt-2">
                    <li>Seguirnos en redes sociales</li>
                    <li>Traer a un amigo (referido)</li>
                    <li>Asistir a talleres {companyName}</li>
                    <li>Participar en encuestas o actividades específicas</li>
                  </ul>
                </li>
                <li>
                  Recibirás puntos de bienvenida ({config?.puntosBienvenida || POINTS_WELCOME} puntos) al darte de alta en el programa.
                </li>
                <li>
                  En la semana de tu cumpleaños, obtendrás puntos extra o promociones exclusivas.
                </li>
              </ul>

              {/* Ejemplo práctico de acumulación */}
              <div className="mt-6 p-5 bg-blue-50 border-l-4 border-blue-500 rounded-lg">
                <h3 className="font-bold text-blue-800 mb-3 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  Ejemplo práctico
                </h3>
                <p className="text-gray-700 mb-2">
                  <strong>Caso de María:</strong> María realiza una compra de 70 € en tienda. Como el programa otorga 1 punto por cada {config?.eurosPorPunto || '3,50'} € de compra:
                </p>
                <p className="text-gray-700 font-medium">
                  70 € ÷ 3,50 € = 20 puntos acumulados
                </p>
                <p className="text-gray-700 mt-2">
                  Si María lleva acumulando {config?.puntosBienvenida || POINTS_WELCOME} puntos de bienvenida desde su registro, ahora tendría {config?.puntosBienvenida || POINTS_WELCOME + 20} puntos en total. ¡Ya casi está lista para canjear su primer cheque!
                </p>
              </div>
            </motion.div>

            {/* Sección 2: Niveles del Programa */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <h2 className="text-xl font-bold text-green-800 mt-8 mb-4 flex items-center">
                <span className="bg-green-100 text-green-700 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm">2</span>
                Niveles del Programa
              </h2>
              
              <p className="text-gray-700 mb-4">
                A medida que vas acumulando puntos (según el gasto total realizado en los últimos {config?.caducidad_puntos_meses || 12} meses), accederás a distintos niveles con beneficios crecientes:
              </p>

              {/* Tabla de Niveles */}
              <div className="overflow-x-auto mb-4">
                <table className="min-w-full border border-gray-300 rounded-lg overflow-hidden">
                  <thead className="bg-green-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-green-800 border-b border-gray-300">Nivel</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-green-800 border-b border-gray-300">Gasto acumulado anual</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-green-800 border-b border-gray-300">Beneficios principales</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-green-800 border-b border-gray-300">Mantenimiento del nivel</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                          <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-700 mr-3"></div>
                            Cargando niveles...
                          </div>
                        </td>
                      </tr>
                    ) : error || !config?.clientLevels ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-red-500">
                          Error al cargar los niveles
                        </td>
                      </tr>
                    ) : (
                      config.clientLevels
                        .sort((a, b) => a.nivel - b.nivel)
                        .map((level, index) => (
                          <tr key={level.nivel} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-4 py-3 text-sm text-gray-800 font-medium border-b border-gray-200">
                              {level.nombre}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600 border-b border-gray-200">
                              {formatPointsRange(level)}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600 border-b border-gray-200">
                              <ul className="list-disc pl-4 space-y-1">
                                {getLevelBenefits(level).map((benefit, i) => (
                                  <li key={i}>{benefit}</li>
                                ))}
                              </ul>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600 border-b border-gray-200">
                              {formatPurchaseRequirement(level)}
                            </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Ejemplo práctico de niveles */}
              <div className="mt-6 p-5 bg-blue-50 border-l-4 border-blue-500 rounded-lg">
                <h3 className="font-bold text-blue-800 mb-3 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  Ejemplo práctico
                </h3>
                <p className="text-gray-700 mb-2">
                  <strong>Caso de Carlos:</strong> Carlos es nuevo en el club (Nivel Semilla) y realiza compras regulares. Después de 6 meses:
                </p>
                <ul className="list-disc pl-6 text-gray-700 space-y-1">
                  <li>Ha gastado un total de 500 € en productos de {companyName}</li>
                  <li>Ha acumulado aproximadamente 142 puntos (500 ÷ 3,50)</li>
                  <li>Con {config?.puntosBienvenida || POINTS_WELCOME} puntos de bienvenida, tiene {config?.puntosBienvenida || POINTS_WELCOME + 142} puntos totales</li>
                  <li>Con 142 puntos, ha obtenido 2 cheques de {VOUCHER_VALUE} € (cada {POINTS_FOR_VOUCHER} puntos = 1 cheque)</li>
                </ul>
                <p className="text-gray-700 mt-2">
                  Carlos está en buen camino para subir al Nivel Brote y acceder a más beneficios exclusivos.
                </p>
              </div>

              <p className="text-sm text-gray-600 italic">
                *Importes y plazos definitivos serán comunicados oficialmente y estarán disponibles en tienda y canales oficiales.
              </p>
            </motion.div>

            {/* Sección 3: Subida y Mantenimiento de Nivel */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <h2 className="text-xl font-bold text-green-800 mt-8 mb-4 flex items-center">
                <span className="bg-green-100 text-green-700 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm">3</span>
                Subida y Mantenimiento de Nivel
              </h2>
              
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>
                  El acceso a cada nivel depende del importe total gastado en los últimos {config?.caducidad_puntos_meses || 12} meses naturales.
                </li>
                <li>
                  Canjear puntos no afecta tu progreso en los niveles.
                </li>
                <li>
                  Solo se perderá nivel si en un periodo determinado (según nivel) no se realiza una compra mínima establecida.
                </li>
              </ul>
              
              <p className="text-gray-700 mt-4 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                <strong>Nota:</strong> En caso de incumplimiento, el cliente regresará al Nivel Semilla, debiendo volver a escalar niveles mediante futuras compras.
              </p>
            </motion.div>

            {/* Sección 4: Canje de Puntos */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <h2 className="text-xl font-bold text-green-800 mt-8 mb-4 flex items-center">
                <span className="bg-green-100 text-green-700 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm">4</span>
                Canje de Puntos
              </h2>
              
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>
                  A partir del Nivel Brote, cada vez que se acumulen {POINTS_FOR_VOUCHER} puntos, tendrá la posibilidad de canjearlos por un cheque de {VOUCHER_VALUE} €, válido desde el día siguiente a la compra, que podrá utilizar con cualquier producto de {companyName} a partir de un gasto mínimo de {MINIMUM_SPEND_FOR_VOUCHER} €
                </li>
                <li>
                  Los puntos además podrán canjearse por:
                  <ul className="list-disc pl-6 mt-2">
                    <li>Descuentos en futuras compras</li>
                    <li>Productos exclusivos o de temporada</li>
                    <li>Talleres o asesorías</li>
                    <li>Donaciones ecológicas (ej. plantación de árboles)</li>
                  </ul>
                </li>
                <li>
                  Los cheques y puntos no podrán usarse para gastos de envío o mano de obra ni combinarse con otras promociones salvo indicación expresa.
                </li>
              </ul>

              {/* Ejemplo práctico de canje */}
              <div className="mt-6 p-5 bg-blue-50 border-l-4 border-blue-500 rounded-lg">
                <h3 className="font-bold text-blue-800 mb-3 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  Ejemplo práctico
                </h3>
                <p className="text-gray-700 mb-2">
                  <strong>Caso de Ana:</strong> Ana tiene 120 puntos acumulados y está en el Nivel Brote (puede canjear puntos):
                </p>
                <ul className="list-disc pl-6 text-gray-700 space-y-1">
                  <li>Ana decide canjear sus puntos por un cheque de {VOUCHER_VALUE} €</li>
                  <li>Después del canje, le quedan 70 puntos (120 - 50 = 70)</li>
                  <li>El cheque se activa el día siguiente a la solicitud</li>
                  <li>Ana va a comprar un pienso de 25 € y presenta su cheque</li>
                  <li>Precio final: 25 € - 5 € = <strong>20 €</strong></li>
                  <li>La compra también le otorga puntos: 20 € ÷ 3,50 € = 5,7 ≈ 5 puntos</li>
                </ul>
                <p className="text-gray-700 mt-2">
                  ¡Ana ha obtenido un ahorro de 5 € en su compra!
                </p>
              </div>
            </motion.div>

            {/* Sección 5: Validez de Puntos */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              <h2 className="text-xl font-bold text-green-800 mt-8 mb-4 flex items-center">
                <span className="bg-green-100 text-green-700 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm">5</span>
                Validez de Puntos
              </h2>
              
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>
                  Los puntos tienen una vigencia de {config?.caducidad_puntos_meses || 12} meses desde su generación.
                </li>
                <li>
                  Una vez vencido este plazo, los puntos caducarán automáticamente sin posibilidad de recuperación.
                </li>
              </ul>

              {/* Ejemplo práctico de caducidad */}
              <div className="mt-6 p-5 bg-blue-50 border-l-4 border-blue-500 rounded-lg">
                <h3 className="font-bold text-blue-800 mb-3 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  Ejemplo práctico
                </h3>
                <p className="text-gray-700 mb-2">
                  <strong>Caso de Pedro:</strong> Pedro acumula puntos en varias fechas a lo largo del año:
                </p>
                <ul className="list-disc pl-6 text-gray-700 space-y-1">
                  <li>1 de enero: 50 puntos</li>
                  <li>15 de marzo: 30 puntos</li>
                  <li>1 de julio: 40 puntos</li>
                  <li>1 de octubre: 25 puntos</li>
                </ul>
                <p className="text-gray-700 mt-2">
                  Los 50 puntos del 1 de enero caducan el 1 de enero del año siguiente. Los 30 puntos del 15 de marzo caducan el 15 de marzo del año siguiente, y así sucesivamente. Por eso es importante usar los puntos antes de que caduquen.
                </p>
              </div>
            </motion.div>

            {/* Sección 6: Comunicación y Acceso a la Información */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              <h2 className="text-xl font-bold text-green-800 mt-8 mb-4 flex items-center">
                <span className="bg-green-100 text-green-700 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm">6</span>
                Comunicación y Acceso a la Información
              </h2>
              
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>
                  Los clientes podrán consultar su saldo de puntos, nivel alcanzado y catálogo de recompensas disponibles a través de nuestros canales (app, web, o en tienda).
                </li>
                <li>
                  Se podrá incorporar una versión digital de la tarjeta (QR o app), para facilitar el uso en tienda.
                </li>
                <li>
                  Se recomienda mantener los datos de contacto actualizados para recibir información relevante del programa.
                </li>
              </ul>
            </motion.div>

            {/* Sección 7: Cambios en el Programa */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
            >
              <h2 className="text-xl font-bold text-green-800 mt-8 mb-4 flex items-center">
                <span className="bg-green-100 text-green-700 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm">7</span>
                Cambios en el Programa
              </h2>
              
              <p className="text-gray-700">
                {companyName} se reserva el derecho de modificar, suspender o cancelar el programa de fidelidad, sus condiciones, beneficios o estructura, notificándolo con al menos {MONTHS_ADVANCE_NOTICE} días de antelación a través de los medios disponibles (email, web, tienda, redes sociales).
              </p>
            </motion.div>

            {/* Sección 8: Uso Personal y Protección de Datos */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.0 }}
            >
              <h2 className="text-xl font-bold text-green-800 mt-8 mb-4 flex items-center">
                <span className="bg-green-100 text-green-700 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm">8</span>
                Uso Personal y Protección de Datos
              </h2>
              
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>
                  El programa es personal e intransferible.
                </li>
                <li>
                  Está prohibido transferir puntos entre titulares o usar una tarjeta de fidelidad para compras de terceros.
                </li>
                <li>
                  Los datos personales recogidos serán tratados conforme a nuestra Política de Privacidad y usados únicamente para la gestión del programa y comunicaciones relacionadas.
                </li>
              </ul>
            </motion.div>

            {/* Sección 9: Recomendaciones Finales */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.1 }}
            >
              <h2 className="text-xl font-bold text-green-800 mt-8 mb-4 flex items-center">
                <span className="bg-green-100 text-green-700 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm">9</span>
                Recomendaciones Finales (Buenas Prácticas)
              </h2>
              
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>
                  Participa activamente: cuanto más interactúas (compras, redes, eventos), más beneficios podrás obtener.
                </li>
                <li>
                  Aprovecha los eventos, actividades o asesorías personalizadas exclusivas de niveles superiores.
                </li>
                <li>
                  Atención a fechas de vencimiento y promociones por tiempo limitado.
                </li>
              </ul>
            </motion.div>

            {/* Sección 10: Carnet de Mascotas */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
            >
              <h2 className="text-xl font-bold text-green-800 mt-8 mb-4 flex items-center">
                <span className="bg-green-100 text-green-700 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm">10</span>
                Carnet de mascotas - Condiciones específicas
              </h2>
              
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>
                  Para disfrutar del carnet de mascota, es imprescindible disponer de la Tarjeta de Fidelidad {companyName} activa.
                </li>
                <li>
                  Cada vez que se compre un saco de pienso de la misma marca, sabor y peso, se sellará el carnet correspondiente.
                </li>
                <li>
                  Al completar el número de compras indicado en el carnet ({config?.sellos_requeridos_carnet || 6} compras), el siguiente saco será gratuito.
                </li>
                <li>
                  Solo se permitirá modificar el tipo de pienso en caso de que no haya disponibilidad en tienda, y únicamente por uno de valor equivalente o inferior de la misma marca.
                </li>
                <li>
                  No es posible acumular puntos y sellar el carnet de mascota por la misma compra de alimento. Son programas excluyentes:
                  <ul className="list-disc pl-6 mt-2">
                    <li>Si se elige sellar el carnet de mascota, no se acumulan puntos por esa parte de la compra.</li>
                    <li>Si se decide acumular puntos, no se sellará el carnet de mascota.</li>
                  </ul>
                </li>
                <li>
                  En compras que incluyan pienso y otros productos, se podrá:
                  <ul className="list-disc pl-6 mt-2">
                    <li>Sellar el carnet de mascota por el importe del pienso, y</li>
                    <li>Acumular puntos por el resto de la compra, excluyendo el pienso.</li>
                  </ul>
                </li>
                <li>
                  Los sellos solo se aplicarán en el momento de la compra presentando la tarjeta correspondiente.
                </li>
                <li className="font-medium mt-4">
                  <strong>Caducidad del carnet de mascota:</strong> El carnet de mascota está sujeto a las siguientes condiciones de caducidad:
                  <ul className="list-disc pl-6 mt-2">
                    <li>
                      <strong>Por inactividad:</strong> Si transcurren {config?.caducidad_carnet_inactividad_meses || 6} meses desde la fecha del último sello añadido sin que se haya sellado la tarjeta, el carnet de mascota caduca y desaparece automáticamente del sistema.
                    </li>
                    <li>
                      <strong>Límite máximo de vigencia:</strong> Con independencia de la actividad o de los sellos restantes, el carnet de mascota tiene una duración máxima de {config?.caducidad_carnet_antiguedad_meses || 24} meses desde la fecha de su creación. Una vez alcanzado este límite, el carnet se eliminará automáticamente sin posibilidad de recuperación ni renovación.
                    </li>
                  </ul>
                </li>
              </ul>

              {/* Ejemplo práctico del carnet de mascota */}
              <div className="mt-6 p-5 bg-blue-50 border-l-4 border-blue-500 rounded-lg">
                <h3 className="font-bold text-blue-800 mb-3 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  Ejemplo práctico
                </h3>
                <p className="text-gray-700 mb-2">
                  <strong>Caso de Luna (mascota de Laura):</strong> Laura tiene un carnet de mascota para su perra Luna:
                </p>
                <ul className="list-disc pl-6 text-gray-700 space-y-1">
                  <li>El carnet requiere {config?.sellos_requeridos_carnet || 6} sellos para obtener un pienso gratis</li>
                  <li>Laura compra pienso marca X sabor pollo 10 kg: recibe su 1.er sello</li>
                  <li>Un mes después, compra otro saco igual: recibe su 2.º sello</li>
                  <li>Después de 6 compras (6 sellos), en la 7.ª compra el pienso es gratis</li>
                  <li>Después de obtener el pienso gratis, el contador de sellos se reinicia</li>
                </ul>
                <p className="text-gray-700 mt-2">
                  Si Laura no compra pienso durante {config?.caducidad_carnet_inactividad_meses || 6} meses, el carnet caduca por inactividad y pierde todos los sellos acumulados.
                </p>
              </div>
            </motion.div>

            {/* Sección 11: Preguntas Frecuentes */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.3 }}
            >
              <h2 className="text-xl font-bold text-green-800 mt-8 mb-4 flex items-center">
                <span className="bg-green-100 text-green-700 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm">11</span>
                Preguntas Frecuentes
              </h2>
              
              <p className="text-gray-700 mb-6">
                A continuación respondemos las dudas más comunes sobre el programa de fidelidad. Haz clic en cada pregunta para ver la respuesta.
              </p>

              <div className="space-y-3">
                {faqItems.map((item, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                    <button
                      onClick={() => toggleFaq(index)}
                      className="w-full px-5 py-4 text-left flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors duration-200"
                      aria-expanded={openFaqIndex === index}
                    >
                      <span className="font-medium text-gray-800 pr-4">{item.question}</span>
                      <motion.svg
                        className="w-5 h-5 text-green-600 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        animate={{ rotate: openFaqIndex === index ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </motion.svg>
                    </button>
                    <AnimatePresence>
                      {openFaqIndex === index && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: 'easeInOut' }}
                          className="overflow-hidden"
                        >
                          <div className="px-5 py-4 bg-white text-gray-700 border-t border-gray-200">
                            {item.answer}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Sección 12: Atención al Cliente */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.4 }}
            >
              <h2 className="text-xl font-bold text-green-800 mt-8 mb-4 flex items-center">
                <span className="bg-green-100 text-green-700 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm">12</span>
                Atención al Cliente
              </h2>
              
              <p className="text-gray-700 mb-4">
                Para cualquier consulta, duda o incidencia relacionada con el programa de fidelidad, nuestro equipo está a tu disposición para ayudarte.
              </p>
              
              <div className="bg-green-50 p-5 rounded-lg">
                <p className="text-gray-700 mb-4">
                  <strong>¿Necesitas ayuda?</strong> Puedes ponerte en contacto con nosotros a través de los siguientes medios:
                </p>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <Link 
                    href="/contact"
                    className="inline-flex items-center justify-center px-5 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors duration-200"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Acceder a la página de contacto
                  </Link>
                  <p className="text-sm text-gray-600">
                    Completa el formulario y nuestro equipo te responderá en un plazo máximo de 48 horas hábiles.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Footer */}
            <motion.div
              className="mt-12 pt-6 border-t border-gray-300 text-center text-sm text-gray-500"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5 }}
            >
              <p>Última actualización: {new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}</p>
              <p className="mt-2">{companyName}</p>
              <p className="mt-4">
                <Link href="/politica-privacidad" className="text-green-600 hover:text-green-800 underline">
                  Consulta nuestra Política de Privacidad
                </Link>
              </p>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </>
  );
};

// Server-side props para el título
export async function getStaticProps() {
  return {
    props: {
      title: termsUsageTitle(),
    },
  };
}

export default TermsPage;
