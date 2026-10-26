import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import MascotBot from "@/components/MascotBot";
import SecurityShield from "@/components/SecurityShield";
import { AdsterraPopunder } from "@/components/Adsterra";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#0a0a0c",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export const metadata: Metadata = {
  title: "Nekumi — Leer Manhwas, Webtoons y Mangas Online",
  description: "Descubre, lee y sigue los mejores manhwas, webtoons y mangas en Nekumi. Actualizaciones diarias con la mejor calidad y velocidad en español.",
  keywords: ["manhwa", "webtoon", "leer manga", "manhwa español", "Nekumi", "Nekutoon", "manga gratis", "acción", "romance", "fantasía", "isekai"],
  openGraph: {
    title: "Nekumi — El Mejor Catálogo de Manhwas y Webtoons",
    description: "Lee tus manhwas y webtoons favoritos en la plataforma más rápida y limpia de internet.",
    url: "https://www.nekutoon.com",
    siteName: "Nekumi",
    locale: "es_LA",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Nekumi — Leer Manhwas y Webtoons",
    description: "Descubre los mejores manhwas actualizados a diario.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
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
        <div id="root-app">
          <AdsterraPopunder />
          <SecurityShield />
          {children}
          <MascotBot />
        </div>
      </body>
    </html>
  );
}
