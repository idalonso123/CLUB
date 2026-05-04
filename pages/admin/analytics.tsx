import Head from "next/head";
import type { NextPage } from "next";
import AdminLayout from "@/components/Admin/AdminLayout";
import AnalyticsSection from "@/components/Admin/Sections/AnalyticsSection";

const AdminAnalyticsPage: NextPage = () => {
  return (
    <AdminLayout>
      <Head>
        <title>Google Analytics - Club ViveVerde</title>
        <meta
          name="description"
          content="Estadísticas de Google Analytics del sistema Club ViveVerde"
        />
      </Head>
      <AnalyticsSection />
    </AdminLayout>
  );
};

export default AdminAnalyticsPage;
