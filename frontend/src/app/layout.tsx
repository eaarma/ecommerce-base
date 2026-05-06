import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ReduxProvider from "@/providers/ReduxProvider";
import Footer from "@/components/layout/Footer";
import { Toaster } from "react-hot-toast";
import Header from "@/components/layout/Header";
import { getPublicShopOrFallback } from "@/lib/shopService";
import { buildStoreMetadata } from "@/lib/storeSeo";
import {
  buildStoreThemeStyle,
  STOREFRONT_THEME_NAME,
} from "@/lib/storeTheme";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const shop = await getPublicShopOrFallback();
  const metadata = buildStoreMetadata({
    shop,
    fallbackDescription: shop.shortDescription,
  });

  return {
    ...metadata,
    icons: {
      icon: shop.faviconUrl?.trim() || "data:,",
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const shop = await getPublicShopOrFallback();
  const storeThemeStyle = buildStoreThemeStyle(shop);

  return (
    <html
      lang="en"
      data-theme={STOREFRONT_THEME_NAME}
      style={storeThemeStyle}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-base-100 text-base-content">
        <ReduxProvider>
          <Header shop={shop} />
          <main className="flex-grow">
            <div className="page-container">{children}</div>
          </main>
          <Toaster
            position="top-center"
            containerStyle={{
              top: "5rem",
            }}
          />
          <Footer shop={shop} />
        </ReduxProvider>
      </body>
    </html>
  );
}
