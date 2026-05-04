import Head from "next/head";
import type { NextPage } from "next";
import AdminLayout from "@/components/Admin/AdminLayout";
import DashboardSection from "@/components/Admin/Sections/DashboardSection";

const AdminDashboardPage: NextPage = () => {
  return (
    <AdminLayout>
      <Head>
        <title>Panel de Control - Club ViveVerde</title>
        <meta
          name="description"
          content="Panel de control del sistema Club ViveVerde"
        />
      </Head>
      <DashboardSection />
    </AdminLayout>
  );
};

export default AdminDashboardPage;
