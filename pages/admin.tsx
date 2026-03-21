import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Head from "next/head";
import type { NextPage } from "next";
import { useRouter } from "next/router";

import UsersSection from "@/components/Admin/Sections/UsersSection";
import RewardsSection from "@/components/Admin/Sections/RewardsSection";
import MainPageSection from "@/components/Admin/Sections/MainPageSection";
import EmailSection from "@/components/Admin/Sections/EmailSection";
import DashboardSection from "@/components/Admin/Sections/DashboardSection";
import Sidebar from "@/components/Admin/Sidebar";
import LogsSection from "@/components/Admin/Sections/LogsSection";
import AnalyticsSection from "@/components/Admin/Sections/AnalyticsSection";
import BackupSection from "@/components/Admin/Sections/BackupSection";

type SectionType = "dashboard" | "users" | "rewards" | "mainpage" | "logs" | "analytics" | "emails" | "backup";

const AdminPage: NextPage = () => {
  const router = useRouter();

  const [activeSection, setActiveSection] = useState<SectionType>("dashboard");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);

  useEffect(() => {
    const checkAdminPermission = async () => {
      try {
        const response = await fetch("/api/auth/refresh", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const data = await response.json();
          const userRole = data.user?.role?.toLowerCase();

          if (userRole === "administrador" || userRole === "admin") {
            setIsAuthorized(true);
          } else {
            router.replace("/");
          }
        } else {
          router.replace("/login?redirect=/admin");
        }
      } catch (error) {
        router.replace("/");
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminPermission();
  }, [router]);

  useEffect(() => {
    if (router.isReady) {
      const { section } = router.query;
      if (section && typeof section === "string") {
        const validSections: SectionType[] = [
          "dashboard",
          "users",
          "rewards",
          "mainpage",
          "logs",
          "analytics",
          "emails",
          "backup",
        ];
        if (validSections.includes(section as SectionType)) {
          setActiveSection(section as SectionType);
        }
      }
    }
  }, [router.isReady, router.query]);

  const handleSectionChange = (section: SectionType) => {
    setActiveSection(section);
    router.push(`/admin?section=${section}`, undefined, { shallow: true });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.5,
        when: "beforeChildren",
        staggerChildren: 0.1,
      },
    },
  };

  const renderActiveSection = () => {
    const sectionElement = (() => {
      switch (activeSection) {
        case "dashboard":
          return <DashboardSection />;
        case "users":
          return <UsersSection />;
        case "rewards":
          return <RewardsSection />;
        case "mainpage":
          return <MainPageSection />;
        case "emails":
          return <EmailSection />;
        case "logs":
          return <LogsSection />;
        case "analytics":
          return <AnalyticsSection />;
        case "backup":
          return <BackupSection />;
        default:
          return <DashboardSection />;
      }
    })();

    return <div id={`admin-section-${activeSection}`}>{sectionElement}</div>;
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-700 border-t-transparent mx-auto"></div>
          <p className="mt-2 text-gray-700">Verificando permisos...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <>
      <Head>
        <title>Panel de Administración - Club ViveVerde</title>
        <meta
          name="description"
          content="Gestiona usuarios, recompensas y configuraciones de la plataforma Club ViveVerde desde el panel de administración."
        />
      </Head>

      <div className="flex h-screen bg-gray-100">
        <Sidebar
          activeSection={activeSection}
          onSectionChange={handleSectionChange}
        />

        <motion.div
          className="flex-1 overflow-auto p-4 md:p-6"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          {renderActiveSection()}
        </motion.div>
      </div>
    </>
  );
};

export default AdminPage;
