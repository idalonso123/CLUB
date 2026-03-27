import React from "react";
import Navbar from "@/components/Layout/Navbar";

type LayoutProps = {
  children: React.ReactNode;
};

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col">
      <header>
        <Navbar />
      </header>
      <main
        className="flex-grow"
        style={{
          backgroundImage: 'url("/banner/footer.jpg")',
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat"
        }}
      >
        {children}
      </main>
    </div>
  );
};

export default Layout;