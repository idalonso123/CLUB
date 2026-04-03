import Head from "next/head";
import type { NextPage } from "next";
import AdminLayout from "@/components/Admin/AdminLayout";
import UsersSection from "@/components/Admin/Sections/UsersSection";

const AdminUsersPage: NextPage = () => {
  return (
    <AdminLayout>
      <Head>
        <title>Gestión de Usuarios - Club ViveVerde</title>
        <meta
          name="description"
          content="Gestión de usuarios del sistema Club ViveVerde"
        />
      </Head>
      <UsersSection />
    </AdminLayout>
  );
};

export default AdminUsersPage;
