'use client';
import { motion } from 'framer-motion';
import Head from 'next/head';
import PetCardsDisplay from '@/components/DashBoard/ProfileComponents/PetCardsDisplay';

const CarnetsMascotasPage = () => {
    // Variantes de animación
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
            },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { type: 'spring' as const, stiffness: 100 },
        },
    };

    return (
        <>
            <Head>
                <title>Carnets Mascotas - Club ViveVerde</title>
                <meta
                    name="description"
                    content="Gestiona los carnets de mascota de tu Clan ViveVerde."
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
                    Carnets Mascotas
                </motion.h2>

                <PetCardsDisplay
                    itemVariants={itemVariants}
                />
            </motion.div>
        </>
    );
};

export default CarnetsMascotasPage;