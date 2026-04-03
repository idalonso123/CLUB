import Head from "next/head";
import type { NextPage } from "next";
import AdminLayout from "@/components/Admin/AdminLayout";
import BackupSection from "@/components/Admin/Sections/BackupSection";

const AdminBackupPage: NextPage = () => {
  return (
    <AdminLayout>
      <Head>
        <title>Copias de Seguridad - Club ViveVerde</title>
        <meta
          name="description"
          content="Gestión de copias de seguridad del sistema Club ViveVerde"
        />
      </Head>
      <BackupSection />
    </AdminLayout>
  );
};

export default AdminBackupPage;
