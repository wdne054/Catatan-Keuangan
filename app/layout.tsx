import type { Metadata } from "next";
import "./globals.css";
import Script from "next/script";

export const metadata: Metadata = {
  title: "Jasdorby_esaashop",
  description: "Catatan keuangan harian Jasdorby_esaashop",
  applicationName: "Jasdorby_esaashop",
  manifest: "/manifest.webmanifest",
  themeColor: "#6f8b67",
  icons: {
    icon: "/pwa-icon.svg",
    apple: "/pwa-icon.svg",
  },
  appleWebApp: {
    capable: true,
    title: "Jasdorby_esaashop",
    statusBarStyle: "default",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body>{children}<Script id="jasdor-sw" strategy="afterInteractive">{`if ("serviceWorker" in navigator) { navigator.serviceWorker.register("/sw.js").catch(() => {}); }`}</Script></body>
    </html>
  );
}
