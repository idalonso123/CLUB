import Head from "next/head";
import type { NextPage } from "next";
import AdminLayout from "@/components/Admin/AdminLayout";
import MainPageSection from "@/components/Admin/Sections/MainPageSection";

const AdminMainPageSection: NextPage = () => {
  return (
    <AdminLayout>
      <Head>
        <title>Gestión Página Principal - Club ViveVerde</title>
        <meta
          name="description"
          content="Gestión de la página principal del sistema Club ViveVerde"
        />
      </Head>
      <MainPageSection />
    </AdminLayout>
  );
};

export default AdminMainPageSection;
