import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ReduxProvider from "@/providers/ReduxProvider";
import Footer from "@/components/layout/Footer";
import { Toaster } from "react-hot-toast";
import Header from "@/components/layout/Header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ecommerce Store",
  description: "We sell goods.",
  icons: {
    icon: "data:,",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-theme="light_custom"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body>
        <ReduxProvider>
          <Header />
          <main className="flex-grow">
            <div className="page-container">{children}</div>
          </main>
          <Toaster
            position="top-center"
            containerStyle={{
              top: "5rem",
            }}
          />
          <Footer />
        </ReduxProvider>
      </body>
    </html>
  );
}
