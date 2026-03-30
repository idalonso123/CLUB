import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { getCompanyName } from '@/lib/utils/pageUtils';

const PrivacyPolicyPage: React.FC = () => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const companyName = getCompanyName();
  const currentYear = new Date().getFullYear();

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
        <title>Política de Privacidad - {companyName}</title>
        <meta name="description" content={`Política de Privacidad del programa de fidelidad ${companyName}`} />
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
              Política de Privacidad
            </h1>
            <p className="text-green-100 mt-1">
              Programa de Fidelidad {companyName}
            </p>
          </div>

          {/* Content */}
          <div className="p-6 md:p-8 prose prose-green max-w-none">
            {/* Introducción */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <p className="text-gray-700 leading-relaxed mb-6">
                En {companyName}, nos comprometemos a proteger la privacidad y seguridad de los datos personales de nuestros clientes y usuarios del programa de fidelidad. Esta Política de Privacidad describe cómo recopilamos, usamos, almacenamos y protegemos su información personal, en cumplimiento con el Reglamento General de Protección de Datos (RGPD) y la legislación española de protección de datos vigente.
              </p>
              <p className="text-gray-700 leading-relaxed mb-6">
                Al hacerte miembro del programa de fidelidad y utilizar nuestros servicios, aceptas las prácticas descritas en esta política. Te recomendamos leer este documento attentamente para comprender cómo manejaremos tus datos personales.
              </p>
            </motion.div>

            {/* Sección 1: Responsable del Tratamiento */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <h2 className="text-xl font-bold text-green-800 mt-8 mb-4 flex items-center">
                <span className="bg-green-100 text-green-700 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm">1</span>
                Responsable del Tratamiento de Datos
              </h2>
              
              <div className="bg-gray-50 p-5 rounded-lg mb-4">
                <p className="text-gray-700 mb-2">
                  <strong>Identidad del responsable:</strong> Viveverde
                </p>
                <p className="text-gray-700 mb-2">
                  <strong>Actividad:</strong> Jardinería
                </p>
                <p className="text-gray-700">
                  <strong>Programa:</strong> Club de Fidelidad Viveverde
                </p>
              </div>
              <p className="text-gray-700 leading-relaxed">
                El responsable del tratamiento de sus datos personales es la entidad titular del programa de fidelidad {companyName}. Si tienes alguna pregunta sobre cómo tratamos tus datos, puedes contactar con nosotros a través de la página de contacto o directamente en nuestras tiendas físicas.
              </p>
            </motion.div>

            {/* Sección 2: Datos Personales Recopilados */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <h2 className="text-xl font-bold text-green-800 mt-8 mb-4 flex items-center">
                <span className="bg-green-100 text-green-700 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm">2</span>
                Datos Personales Recopilados
              </h2>
              
              <p className="text-gray-700 mb-4">
                Recopilamos los siguientes tipos de datos personales cuando te registras en el programa de fidelidad y realizas compras:
              </p>

              <div className="space-y-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-800 mb-2">Datos de identificación</h3>
                  <ul className="list-disc pl-6 text-gray-700 space-y-1">
                    <li>Nombre completo</li>
                    <li>Dirección de correo electrónico</li>
                    <li>Número de teléfono</li>
                    <li>Dirección postal (en caso de envíos)</li>
                    <li>Fecha de nacimiento (para cumpleaños y verificación de edad)</li>
                  </ul>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-800 mb-2">Datos del programa de fidelidad</h3>
                  <ul className="list-disc pl-6 text-gray-700 space-y-1">
                    <li>Número de tarjeta de fidelidad</li>
                    <li>Nivel actual en el programa</li>
                    <li>Puntos acumulados y su historial</li>
                    <li>Fecha de registro y primera compra</li>
                    <li>Historial de compras y productos adquiridos</li>
                    <li>Preferencias de comunicación</li>
                  </ul>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-800 mb-2">Datos del carnet de mascota</h3>
                  <ul className="list-disc pl-6 text-gray-700 space-y-1">
                    <li>Nombre de la mascota</li>
                    <li>Tipo de animal y raza</li>
                    <li>Sellos acumulados en el carnet</li>
                    <li>Fecha de creación del carnet</li>
                  </ul>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-800 mb-2">Datos de navegación</h3>
                  <ul className="list-disc pl-6 text-gray-700 space-y-1">
                    <li>Dirección IP</li>
                    <li>Tipo de navegador y dispositivo</li>
                    <li>Cookies y tecnologías similares</li>
                    <li>Historial de navegación en nuestra web/app</li>
                  </ul>
                </div>
              </div>
            </motion.div>

            {/* Sección 3: Finalidad del Tratamiento */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <h2 className="text-xl font-bold text-green-800 mt-8 mb-4 flex items-center">
                <span className="bg-green-100 text-green-700 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm">3</span>
                Finalidad del Tratamiento de Datos
              </h2>
              
              <p className="text-gray-700 mb-4">
                Tratamos tus datos personales con las siguientes finalidades:
              </p>

              <div className="space-y-4">
                <div className="border border-gray-200 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-800 mb-2">Gestión del programa de fidelidad</h3>
                  <p className="text-gray-700 text-sm">
                    Registrarte como miembro, gestionar tu cuenta, acumular y rastrear tus puntos, administrar tus niveles, y procesar los beneficios y recompensas del programa.
                  </p>
                </div>

                <div className="border border-gray-200 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-800 mb-2">Procesamiento de compras</h3>
                  <p className="text-gray-700 text-sm">
                    Registrar tus compras para acumular puntos, gestionar el carnet de mascota, emitir tickets y facturas, y procesar devoluciones o cambios.
                  </p>
                </div>

                <div className="border border-gray-200 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-800 mb-2">Comunicación comercial</h3>
                  <p className="text-gray-700 text-sm">
                    Enviarte información sobre promociones, ofertas especiales, novedades del programa, eventos exclusivos y contenido relevante para miembros del club.
                  </p>
                </div>

                <div className="border border-gray-200 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-800 mb-2">Atención al cliente</h3>
                  <p className="text-gray-700 text-sm">
                    Resolver consultas, gestionar incidencias, procesar reclamaciones y proporcionarte soporte relacionado con tu membresía o compras.
                  </p>
                </div>

                <div className="border border-gray-200 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-800 mb-2">Personalización de la experiencia</h3>
                  <p className="text-gray-700 text-sm">
                    Analizar tus preferencias y comportamiento de compra para ofrecerte ofertas y recomendaciones personalizadas adaptadas a tus intereses.
                  </p>
                </div>

                <div className="border border-gray-200 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-800 mb-2">Cumplimiento legal</h3>
                  <p className="text-gray-700 text-sm">
                    Cumplir con nuestras obligaciones legales en materia fiscal, contable y de prevención de fraude, así como responder a solicitudes de autoridades competentes.
                  </p>
                </div>
              </div>

              <p className="text-gray-700 mt-4 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                <strong>Base legal del tratamiento:</strong> El tratamiento de tus datos se realiza bajo las bases legales de ejecución de un contrato (registro en el programa), consentimiento del usuario (comunicaciones comerciales), y nuestro interés legítimo (mejora del servicio y prevención de fraude).
              </p>
            </motion.div>

            {/* Sección 4: Cookies y Tecnologías de Seguimiento */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <h2 className="text-xl font-bold text-green-800 mt-8 mb-4 flex items-center">
                <span className="bg-green-100 text-green-700 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm">4</span>
                Cookies y Tecnologías de Seguimiento
              </h2>
              
              <p className="text-gray-700 mb-4">
                Utilizamos cookies y tecnologías similares para mejorar tu experiencia de navegación, analizar el uso de nuestra plataforma y personalizar contenido. A continuación te detallamos los tipos de cookies que utilizamos:
              </p>

              <div className="space-y-3">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-800 mb-2">Cookies esenciales</h3>
                  <p className="text-gray-700 text-sm">
                    Necesarias para el funcionamiento básico del sitio web, como mantener tu sesión activa, recordar tus preferencias y garantizar la seguridad. Estas cookies no requieren tu consentimiento.
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-800 mb-2">Cookies de análisis</h3>
                  <p className="text-gray-700 text-sm">
                    Nos ayudan a comprender cómo los visitantes interactúan con nuestro sitio web, qué secciones son más visitadas y cómo mejorar la experiencia del usuario. Usamos Google Analytics de forma anonimizada.
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-800 mb-2">Cookies de personalización</h3>
                  <p className="text-gray-700 text-sm">
                    Permiten recordar tus preferencias y configuraciones para ofrecerte una experiencia más personalizada en futuras visitas.
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-800 mb-2">Cookies de marketing</h3>
                  <p className="text-gray-700 text-sm">
                    Utilizadas para mostrarte publicidad relevante basada en tus intereses y medir la efectividad de nuestras campañas. Puedes gestionar tus preferencias de cookies a través de la configuración de tu navegador.
                  </p>
                </div>
              </div>

              <p className="text-gray-700 mt-4">
                <strong>Gestión de cookies:</strong> Puedes configurar tu navegador para bloquear o eliminar cookies. Ten en cuenta que algunas funcionalidades del sitio web podrían verse afectadas si desactivas las cookies esenciales.
              </p>
            </motion.div>

            {/* Sección 5: Compartición de Datos */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              <h2 className="text-xl font-bold text-green-800 mt-8 mb-4 flex items-center">
                <span className="bg-green-100 text-green-700 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm">5</span>
                Compartición de Datos con Terceros
              </h2>
              
              <p className="text-gray-700 mb-4">
                No vendemos, alquilamos ni compartimos tus datos personales con terceros para sus propios fines de marketing sin tu consentimiento. Sin embargo, podemos compartir información en los siguientes casos:
              </p>

              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>
                  <strong>Proveedores de servicios:</strong> Compartimos datos con empresas que nos prestan servicios tecnológicos, procesamiento de pagos, envío de comunicaciones, y análisis de datos. Estos proveedores están obligados a proteger tus datos y usarlos únicamente para los fines que les indicamos.
                </li>
                <li>
                  <strong>Cumplimiento legal:</strong> Podemos disclose datos personales cuando sea requerido por ley, orden judicial, o solicitud de autoridades gubernamentales.
                </li>
                <li>
                  <strong>Protección de derechos:</strong> Podemos compartir información cuando sea necesario para proteger nuestros derechos legales, prevenir fraudes, o garantizar la seguridad de nuestros usuarios.
                </li>
                <li>
                  <strong>Transferencias empresariales:</strong> En caso de fusión, adquisición o venta de activos, tus datos podrían ser transferidos como parte de la transacción empresarial.
                </li>
              </ul>
            </motion.div>

            {/* Sección 6: Conservación de Datos */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              <h2 className="text-xl font-bold text-green-800 mt-8 mb-4 flex items-center">
                <span className="bg-green-100 text-green-700 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm">6</span>
                Conservación de Datos
              </h2>
              
              <p className="text-gray-700 mb-4">
                Conservaremos tus datos personales durante el tiempo necesario para cumplir con los fines para los que fueron recopilados. Los plazos de conservación son los siguientes:
              </p>

              <div className="overflow-x-auto mb-4">
                <table className="min-w-full border border-gray-300 rounded-lg overflow-hidden">
                  <thead className="bg-green-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-green-800 border-b border-gray-300">Tipo de dato</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-green-800 border-b border-gray-300">Plazo de conservación</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="bg-white">
                      <td className="px-4 py-3 text-sm text-gray-700 border-b border-gray-200">Datos de la cuenta de fidelidad</td>
                      <td className="px-4 py-3 text-sm text-gray-700 border-b border-gray-200">Mientras seas miembro activo + 5 años</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-700 border-b border-gray-200">Historial de compras</td>
                      <td className="px-4 py-3 text-sm text-gray-700 border-b border-gray-200">10 años (obligación legal fiscal)</td>
                    </tr>
                    <tr className="bg-white">
                      <td className="px-4 py-3 text-sm text-gray-700 border-b border-gray-200">Datos de contacto (marketing)</td>
                      <td className="px-4 py-3 text-sm text-gray-700 border-b border-gray-200">Hasta que retires el consentimiento</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-700 border-b border-gray-200">Registros de navegación</td>
                      <td className="px-4 py-3 text-sm text-gray-700 border-b border-gray-200">2 años máximo</td>
                    </tr>
                    <tr className="bg-white">
                      <td className="px-4 py-3 text-sm text-gray-700">Datos de mascotas</td>
                      <td className="px-4 py-3 text-sm text-gray-700">Mientras esté activo el carnet + 2 años</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <p className="text-gray-700">
                Una vez transcurridos estos plazos, tus datos serán eliminados de forma segura o anonimizados para fines estadísticos, excepto cuando debamos conservarlos para cumplir con obligaciones legales.
              </p>
            </motion.div>

            {/* Sección 7: Tus Derechos */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
            >
              <h2 className="text-xl font-bold text-green-800 mt-8 mb-4 flex items-center">
                <span className="bg-green-100 text-green-700 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm">7</span>
                Tus Derechos como Usuario
              </h2>
              
              <p className="text-gray-700 mb-4">
                Tienes los siguientes derechos sobre tus datos personales, que puedes ejercer en cualquier momento:
              </p>

              <div className="space-y-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-800 mb-2 flex items-center">
                    <span className="bg-green-200 text-green-800 w-6 h-6 rounded-full flex items-center justify-center mr-2 text-xs">1</span>
                    Derecho de Acceso
                  </h3>
                  <p className="text-gray-700 text-sm">
                    Puedes solicitarnos una copia de todos los datos personales que tenemos sobre ti, incluyendo información sobre cómo los usamos y con quién los compartimos.
                  </p>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-800 mb-2 flex items-center">
                    <span className="bg-green-200 text-green-800 w-6 h-6 rounded-full flex items-center justify-center mr-2 text-xs">2</span>
                    Derecho de Rectificación
                  </h3>
                  <p className="text-gray-700 text-sm">
                    Puedes solicitarnos que corrijamos cualquier información inaccurate o incompleta que tengamos sobre ti. Es importante mantener tus datos actualizados.
                  </p>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-800 mb-2 flex items-center">
                    <span className="bg-green-200 text-green-800 w-6 h-6 rounded-full flex items-center justify-center mr-2 text-xs">3</span>
                    Derecho de Supresión
                  </h3>
                  <p className="text-gray-700 text-sm">
                    Puedes solicitarnos que eliminemos tus datos personales cuando ya no sean necesarios para los fines para los que fueron recopilados, o cuando retires tu consentimiento.
                  </p>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-800 mb-2 flex items-center">
                    <span className="bg-green-200 text-green-800 w-6 h-6 rounded-full flex items-center justify-center mr-2 text-xs">4</span>
                    Derecho de Limitación
                  </h3>
                  <p className="text-gray-700 text-sm">
                    Puedes solicitarnos que limitemos el uso de tus datos en ciertas circunstancias, por ejemplo, mientras se investiga una reclamación.
                  </p>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-800 mb-2 flex items-center">
                    <span className="bg-green-200 text-green-800 w-6 h-6 rounded-full flex items-center justify-center mr-2 text-xs">5</span>
                    Derecho de Portabilidad
                  </h3>
                  <p className="text-gray-700 text-sm">
                    Puedes solicitarnos que te proporcionemos tus datos en un formato estructurado y legible por máquina, para poder transferirlos a otro responsable.
                  </p>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-800 mb-2 flex items-center">
                    <span className="bg-green-200 text-green-800 w-6 h-6 rounded-full flex items-center justify-center mr-2 text-xs">6</span>
                    Derecho de Oposición
                  </h3>
                  <p className="text-gray-700 text-sm">
                    Puedes oponerte al tratamiento de tus datos para fines de marketing directo en cualquier momento. Dejaremos de usar tus datos para estos fines inmediatamente.
                  </p>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-800 mb-2 flex items-center">
                    <span className="bg-green-200 text-green-800 w-6 h-6 rounded-full flex items-center justify-center mr-2 text-xs">7</span>
                    Derecho a no ser objeto de decisiones automatizadas
                  </h3>
                  <p className="text-gray-700 text-sm">
                    Tienes derecho a no ser objeto de decisiones basadas únicamente en el tratamiento automatizado que afecten significativamente tus derechos.
                  </p>
                </div>
              </div>

              <p className="text-gray-700 mt-4 p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
                <strong>Cómo ejercer tus derechos:</strong> Para ejercer cualquiera de estos derechos, ponte en contacto con nosotros a través de la página de contacto. Responderemos a tu solicitud en un plazo máximo de 30 días. Si no estás satisfecho con nuestra respuesta, puedes presentar una reclamación ante la Autoridad de Control Española (AEPD).
              </p>
            </motion.div>

            {/* Sección 8: Medidas de Seguridad */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.0 }}
            >
              <h2 className="text-xl font-bold text-green-800 mt-8 mb-4 flex items-center">
                <span className="bg-green-100 text-green-700 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm">8</span>
                Medidas de Seguridad
              </h2>
              
              <p className="text-gray-700 mb-4">
                Implementamos medidas técnicas y organizativas apropiadas para proteger tus datos personales contra acceso no autorizado, pérdida, alteración o destrucción. Estas medidas incluyen:
              </p>

              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>
                  <strong>Cifrado de datos:</strong> Utilizamos protocolos de cifrado SSL/TLS para proteger la transmisión de datos entre tu navegador y nuestros servidores.
                </li>
                <li>
                  <strong>Control de acceso:</strong> Restringimos el acceso a tus datos personales únicamente a empleados y proveedores que necesitan conocer dicha información.
                </li>
                <li>
                  <strong>Autenticación:</strong> Implementamos sistemas de autenticación robustos para proteger el acceso a las cuentas de usuario.
                </li>
                <li>
                  <strong>Monitoreo:</strong> Realizamos auditorías y monitoreo continuo para detectar y responder a incidentes de seguridad.
                </li>
                <li>
                  <strong>Formación:</strong> Capacitamos a nuestro personal sobre la importancia de la protección de datos y las mejores prácticas de seguridad.
                </li>
                <li>
                  <strong>Copias de seguridad:</strong> Realizamos copias de seguridad regulares de los datos para garantizar su recuperación en caso de incidentes.
                </li>
              </ul>

              <p className="text-gray-700 mt-4">
                En caso de producirse una brecha de seguridad que afecte a tus datos personales, te notificaremos conforme a la legislación vigente, informándote sobre la naturaleza de la brecha y las medidas adoptadas.
              </p>
            </motion.div>

            {/* Sección 9: Menores de Edad */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.1 }}
            >
              <h2 className="text-xl font-bold text-green-800 mt-8 mb-4 flex items-center">
                <span className="bg-green-100 text-green-700 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm">9</span>
                Menores de Edad
              </h2>
              
              <p className="text-gray-700">
                El programa de fidelidad {companyName} está dirigido a adultos. No recopilamos deliberadamente información personal de menores de 16 años sin el consentimiento verificable de sus padres o tutores legales. Si descubrimos que hemos recopilado datos de un menor sin la autorización adecuada, tomaremos medidas para eliminar dicha información lo antes posible.
              </p>
            </motion.div>

            {/* Sección 10: Cambios en la Política */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
            >
              <h2 className="text-xl font-bold text-green-800 mt-8 mb-4 flex items-center">
                <span className="bg-green-100 text-green-700 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm">10</span>
                Actualizaciones de esta Política
              </h2>
              
              <p className="text-gray-700 mb-4">
                Podemos actualizar esta Política de Privacidad periódicamente para reflejar cambios en nuestras prácticas, tecnología o requisitos legales. Cualquier modificación será publicada en esta página con una fecha de "última actualización" revisada.
              </p>
              <p className="text-gray-700 mb-4">
                Te recomendamos revisar esta política regularmente para mantenerte informado sobre cómo protegemos tu información. En caso de cambios significativos, te notificaremos a través de correo electrónico o un aviso destacado en nuestra plataforma.
              </p>
              <p className="text-gray-700">
                El uso continuado de nuestros servicios después de la publicación de los cambios constituirá tu aceptación de la Política de Privacidad modificada.
              </p>
            </motion.div>

            {/* Sección 11: Contacto */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.3 }}
            >
              <h2 className="text-xl font-bold text-green-800 mt-8 mb-4 flex items-center">
                <span className="bg-green-100 text-green-700 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm">11</span>
                Contacto y DPO
              </h2>
              
              <p className="text-gray-700 mb-4">
                Si tienes preguntas, comentarios o solicitudes relacionadas con esta Política de Privacidad o el tratamiento de tus datos personales, estamos a tu disposición:
              </p>

              <div className="bg-green-50 p-5 rounded-lg mb-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link 
                    href="/contact"
                    className="inline-flex items-center justify-center px-5 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors duration-200"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Acceder a la página de contacto
                  </Link>
                  <p className="text-sm text-gray-600 flex items-center">
                    Completa el formulario y notre equipo te responderá en un plazo máximo de 30 días.
                  </p>
                </div>
              </div>

              <p className="text-gray-700 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                <strong>Nota importante:</strong> Para ejercer tus derechos de protección de datos, puedes utilizar el formulario de contacto indicando claramente el derecho que deseas ejercer. También puedes contactar directamente con la Autoridad Española de Protección de Datos (AEPD) si consideras que no hemos atendido adecuadamente tu solicitud.
              </p>
            </motion.div>

            {/* Footer */}
            <motion.div
              className="mt-12 pt-6 border-t border-gray-300 text-center text-sm text-gray-500"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.4 }}
            >
              <p>Última actualización: {new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}</p>
              <p className="mt-2">{companyName} - {currentYear}</p>
              <p className="mt-4">
                <Link href="/terminos-condiciones-uso" className="text-green-600 hover:text-green-800 underline">
                  Consulta los Términos y Condiciones de Uso del programa
                </Link>
              </p>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </>
  );
};

export async function getStaticProps() {
  return {
    props: {
      title: 'Política de Privacidad',
    },
  };
}

export default PrivacyPolicyPage;
