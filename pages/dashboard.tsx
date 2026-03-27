import UserProfile from "@/components/DashBoard/profile";
import Head from "next/head";

const DashboardPage = () => {
  return (
    <>
      <Head>
        <title>Panel de Usuario - Club ViveVerde</title>
        <meta
          name="description"
          content="Accede a tu cuenta de Club ViveVerde o regístrate para disfrutar de nuestro sistema de fidelización."
        />
      </Head>

      <div className="mx-auto p-6 max-w-7xl">
        <UserProfile />
      </div>
    </>
  );
};

export default DashboardPage;
