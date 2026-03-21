import Head from "next/head";
import ResetPassword from "@/components/Auth/ResetPassword";

const ResetPasswordPage = () => {
  return (
    <>
      <Head>
        <title>Restablecer Contraseña - Club ViveVerde</title>
        <meta
          name="description"
          content="Restablece tu contraseña para acceder a tu cuenta de Club ViveVerde y disfrutar de nuestro sistema de fidelización."
        />
      </Head>

      <div className="container mx-auto px-4 py-8">
        <ResetPassword />
      </div>
    </>
  );
};

export default ResetPasswordPage;
