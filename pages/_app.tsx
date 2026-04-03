import "@/styles/globals.css";
import type { AppProps } from "next/app";
import Layout from "@/components/Layout/Layout";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/contexts/AuthContext";
import RewardsProvider from "@/components/Admin/RewardsProvider";
import MainPageProvider from "@/components/Admin/MainPageProvider";
import GoogleAnalytics from "@/components/HomePages/GoogleAnalytics";
import { Toaster } from "react-hot-toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function App({ Component, pageProps }: AppProps) {
  const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_MEASUREMENT_ID_GOOGLE || "club-viveverde-secret-key";
  return (
    <div className={`${geistSans.variable} ${geistMono.variable}`}>
      <GoogleAnalytics measurementId={GA_MEASUREMENT_ID} />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
            borderRadius: '8px',
            padding: '16px',
          },
          success: {
            iconTheme: {
              primary: '#10B981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#EF4444',
              secondary: '#fff',
            },
          },
        }}
      />
      <AuthProvider>
        <RewardsProvider>
          <MainPageProvider>
            <Layout>
              <Component {...pageProps} />
            </Layout>
          </MainPageProvider>
        </RewardsProvider>
      </AuthProvider>
    </div>
  );
}
