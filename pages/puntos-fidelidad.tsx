'use client';
import { motion } from 'framer-motion';
import Head from 'next/head';
import Link from 'next/link';
import PointsDisplay from '@/components/DashBoard/ProfileComponents/PointsDisplay';
import ClientLevelDisplay from '@/components/DashBoard/ProfileComponents/ClientLevelDisplay';
import useUserProfile from '@/components/DashBoard/hooks/useUserProfile';
import { getCompanyName, getTermsUsageUrl } from '@/lib/utils/pageUtils';
import useAppConfig from '@/components/hooks/useExpirationConfig';

const PuntosFidelidadPage = () => {
    const {
        userData,
        isLoading,
        error,
        containerVariants,
        itemVariants
    } = useUserProfile();

    // Obtener configuración completa dinámicamente
    const { config: appConfig } = useAppConfig();
    
    // Valores de configuración
    const eurosPorPunto = appConfig?.eurosPorPunto || 3.5;
    const caducidadPuntos = appConfig?.caducidad_puntos_meses || 12;

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
        <>
            <Head>
                <title>Mis Puntos - Club ViveVerde</title>
                <meta
                    name="description"
                    content="Consulta tus puntos de fidelidad y conoce cómo funcionan las recompensas."
                />
            </Head>

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
                    Mis puntos
                </motion.h2>

                {/* Componente de Puntos de Fidelidad */}
                <PointsDisplay
                    points={userData.points}
                    itemVariants={itemVariants}
                />

                {/* Componente de Nivel de Cliente */}
                <ClientLevelDisplay
                    points={userData.points}
                    itemVariants={itemVariants}
                />

                {/* Explicación del sistema de puntos */}
                <motion.div
                    className="bg-white p-5 border border-gray-300 rounded-lg mb-4 shadow-sm"
                    variants={itemVariants}
                >
                    <h3 className="text-xl font-semibold mb-4 text-green-700">
                        ¿Cómo funciona el sistema de puntos?
                    </h3>
                    
                    <div className="space-y-4">
                        <div className="p-3 bg-gray-50 rounded">
                            <div className="flex items-start">
                                <div className="bg-green-100 p-2 rounded-full mr-3">
                                    <i className="fas fa-shopping-bag text-green-700"></i>
                                </div>
                                <div>
                                    <div className="font-medium text-green-700">Acumulación de puntos</div>
                                    <p className="text-gray-600 text-sm mt-1">
                                        Por cada <strong>{eurosPorPunto.toFixed(2).replace('.', ',')} €</strong> de compra, acumulas <strong>1 punto</strong> de fidelidad.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="p-3 bg-gray-50 rounded">
                            <div className="flex items-start">
                                <div className="bg-blue-100 p-2 rounded-full mr-3">
                                    <i className="fas fa-gift text-blue-700"></i>
                                </div>
                                <div>
                                    <div className="font-medium text-blue-700">Canje por recompensas</div>
                                    <p className="text-gray-600 text-sm mt-1">
                                        A partir del <strong>Nivel Brote</strong>, con <strong>50 puntos</strong> puedes obtener un cheque de <strong>5 €</strong> de descuento.
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Válido desde el día siguiente a la compra, con un gasto mínimo de 19€.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="p-3 bg-gray-50 rounded">
                            <div className="flex items-start">
                                <div className="bg-amber-100 p-2 rounded-full mr-3">
                                    <i className="fas fa-clock text-amber-700"></i>
                                </div>
                                <div>
                                    <div className="font-medium text-amber-700">Validez de los puntos</div>
                                    <p className="text-gray-600 text-sm mt-1">
                                        Los puntos tienen una vigencia de <strong>{caducidadPuntos} meses</strong> desde su generación.
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Una vez vencido este plazo, los puntos caducan automáticamente.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 p-3 bg-green-50 rounded border border-green-100">
                        <p className="text-sm text-green-700">
                            <i className="fas fa-lightbulb mr-2"></i>
                            <strong>Consejo:</strong> Canjear puntos no afecta tu progreso en los niveles. ¡Acumula y disfruta de todos los beneficios!
                        </p>
                    </div>
                </motion.div>

                {/* Enlace para ver recompensas */}
                <motion.div
                    className="mt-6 text-center"
                    variants={itemVariants}
                >
                    <Link href="/rewards">
                        <motion.button
                            className="bg-green-800 text-white px-6 py-3 rounded-full font-bold hover:bg-green-700 transition duration-300"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <i className="fas fa-gift mr-2"></i>
                            Ver Recompensas Disponibles
                        </motion.button>
                    </Link>
                </motion.div>

                {/* Términos y condiciones */}
                <motion.div
                    className="mt-6 text-center"
                    variants={itemVariants}
                >
                    <a
                        href={getTermsUsageUrl()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-gray-500 hover:text-green-700 hover:underline"
                    >
                        <i className="fas fa-file-alt mr-1"></i>
                        Consulta los Términos y Condiciones de Uso – Tarjeta {getCompanyName()}
                    </a>
                </motion.div>
            </motion.div>
        </>
    );
};

export default PuntosFidelidadPage;