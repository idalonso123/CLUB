import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Sidebar from "@/components/Admin/Sidebar";
import { motion } from "framer-motion";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [userRole, setUserRole] = useState<string>("");

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
          const role = data.user?.role?.toLowerCase() || "";
          setUserRole(role);

          if (
            role === "administrador" ||
            role === "admin" ||
            role === "marketing"
          ) {
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
    <div className="flex h-screen bg-gray-100">
      <Sidebar userRole={userRole} />

      <motion.div
        className="flex-1 overflow-auto p-4 md:p-6"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {children}
      </motion.div>
    </div>
  );
};

export default AdminLayout;
