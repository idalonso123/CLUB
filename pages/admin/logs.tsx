import Head from "next/head";
import type { NextPage } from "next";
import AdminLayout from "@/components/Admin/AdminLayout";
import LogsSection from "@/components/Admin/Sections/LogsSection";

const AdminLogsPage: NextPage = () => {
  return (
    <AdminLayout>
      <Head>
        <title>Logs del Sistema - Club ViveVerde</title>
        <meta
          name="description"
          content="Visualización de logs del sistema Club ViveVerde"
        />
      </Head>
      <LogsSection />
    </AdminLayout>
  );
};

export default AdminLogsPage;
