import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "La Gauchita Federal",
    template: "%s | La Gauchita Federal",
  },
  description: "Portal federal de historia, cultura, instituciones, reconocimientos y archivo del patrimonio cultural argentino.",
  openGraph: {
    title: "La Gauchita Federal",
    description: "Portal federal de historia, cultura, instituciones, reconocimientos y archivo del patrimonio cultural argentino.",
    type: "website",
    locale: "es_AR",
    siteName: "La Gauchita Federal",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es-AR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

