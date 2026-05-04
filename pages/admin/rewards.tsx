import Head from "next/head";
import type { NextPage } from "next";
import AdminLayout from "@/components/Admin/AdminLayout";
import RewardsSection from "@/components/Admin/Sections/RewardsSection";

const AdminRewardsPage: NextPage = () => {
  return (
    <AdminLayout>
      <Head>
        <title>Gestión de Recompensas - Club ViveVerde</title>
        <meta
          name="description"
          content="Gestión de recompensas del sistema Club ViveVerde"
        />
      </Head>
      <RewardsSection />
    </AdminLayout>
  );
};

export default AdminRewardsPage;
