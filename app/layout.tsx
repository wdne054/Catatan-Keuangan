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

const chartDateFix = `
.chart-card:has(.chart-periods button:nth-child(2).active) > div:nth-of-type(4) > div:first-child,
.chart-card:has(.chart-periods button:nth-child(3).active) > div:nth-of-type(4) > div:first-child {
  overflow-x: auto !important;
  overflow-y: hidden !important;
  padding-bottom: 8px !important;
  -webkit-overflow-scrolling: touch;
}

.chart-card:has(.chart-periods button:nth-child(2).active) > div:nth-of-type(4) > div:first-child > div:first-child {
  min-width: 653px !important;
  width: 653px !important;
}

.chart-card:has(.chart-periods button:nth-child(3).active) > div:nth-of-type(4) > div:first-child > div:first-child {
  min-width: 1405px !important;
  width: 1405px !important;
}

.chart-card:has(.chart-periods button:nth-child(2).active) > div:nth-of-type(4) > div:first-child > div:nth-child(2) {
  grid-template-columns: repeat(14, 42px) !important;
  min-width: 653px !important;
  width: 653px !important;
  gap: 5px !important;
}

.chart-card:has(.chart-periods button:nth-child(3).active) > div:nth-of-type(4) > div:first-child > div:nth-child(2) {
  grid-template-columns: repeat(30, 42px) !important;
  min-width: 1405px !important;
  width: 1405px !important;
  gap: 5px !important;
}

.chart-card:has(.chart-periods button:nth-child(2).active) > div:nth-of-type(4) > div:first-child > div:nth-child(2) span,
.chart-card:has(.chart-periods button:nth-child(3).active) > div:nth-of-type(4) > div:first-child > div:nth-child(2) span {
  width: 42px !important;
  min-width: 42px !important;
  max-width: 42px !important;
  overflow: visible !important;
  text-overflow: clip !important;
  white-space: nowrap !important;
  font-size: 9px !important;
  line-height: 1.2 !important;
  text-align: center !important;
}
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <head>
        <style dangerouslySetInnerHTML={{ __html: chartDateFix }} />
      </head>
      <body>{children}<Script id="jasdor-sw" strategy="afterInteractive">{`if ("serviceWorker" in navigator) { navigator.serviceWorker.register("/sw.js").catch(() => {}); }`}</Script></body>
    </html>
  );
}
