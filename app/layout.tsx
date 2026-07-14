import type { Metadata } from "next";
import { Barlow_Condensed, Montserrat } from "next/font/google";
import "./globals.css";

const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-barlow-condensed",
  display: "swap",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-montserrat",
  display: "swap",
});

export const metadata: Metadata = {
  title: "CBS-Afstemning",
  description: "Afstemning fra Copenhagen Bike Show",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="da" className={`${barlowCondensed.variable} ${montserrat.variable}`}>
      <body>{children}</body>
    </html>
  );
}
