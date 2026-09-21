import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import MascotBot from "@/components/MascotBot";
import SecurityShield from "@/components/SecurityShield";
import Script from "next/script";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "Nekutoon — Leer Manhwas y Webtoons",
  description: "Descubre, lee y sigue los mejores manhwas, webtoons y mangas en Nekutoon. Actualizaciones diarias con la mejor calidad en español.",
  keywords: ["manhwa", "webtoon", "leer manga", "manhwa español", "Nekutoon", "manga gratis", "acción", "romance"],
  openGraph: {
    title: "Nekutoon — El Mejor Catálogo de Manhwas",
    description: "Lee tus manhwas y webtoons favoritos en la plataforma más rápida y limpia de internet.",
    url: "https://www.nekutoon.com",
    siteName: "Nekutoon",
    locale: "es_LA",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Nekutoon — Leer Manhwas y Webtoons",
    description: "Descubre los mejores manhwas actualizados a diario.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark">
      <body className={`${inter.variable} antialiased`}>
        <SecurityShield />
        {children}
        <MascotBot />
        
        {/* Adsterra: Barra Social (Global) */}
        <Script src="//pl31363077.profitableratecpmnetwork.com/bc/8a/a6/bc8aa66355b50d50a83a1ecc72eea53e.js" strategy="lazyOnload" />
      </body>
    </html>
  );
}

