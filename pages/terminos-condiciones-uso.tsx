import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { motion } from 'framer-motion';
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

const TermsPage: React.FC<TermsPageProps> = ({ title }) => {
  const { config, loading, error } = useAppConfig();
  const [isClient, setIsClient] = useState(false);

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
                La Tarjeta de Fidelidad {companyName} es un programa gratuito que premia la confianza de nuestros clientes habituales mediante un sistema de puntos y niveles que ofrecen ventajas exclusivas. Al unirte y utilizar tu tarjeta, aceptas los siguientes términos y condiciones:
              </p>
              <p className="text-gray-700 leading-relaxed">
                Es imprescindible completar correctamente todos los datos personales requeridos para acceder a las ventajas del Club. La falta de cualquiera de estos datos inhabilita automáticamente la participación en el programa, así como el acceso a descuentos, promociones y beneficios asociados.
              </p>
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

            {/* Sección 10: Tarjeta de Pienso */}
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
            </motion.div>

            {/* Footer */}
            <motion.div
              className="mt-12 pt-6 border-t border-gray-300 text-center text-sm text-gray-500"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.3 }}
            >
              <p>Última actualización: {new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}</p>
              <p className="mt-2">{companyName}</p>
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
