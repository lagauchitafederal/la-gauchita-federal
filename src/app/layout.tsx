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

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
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
  twitter: {
    card: "summary_large_image",
    title: "La Gauchita Federal",
    description: "Portal federal de historia, cultura, instituciones, reconocimientos y archivo del patrimonio cultural argentino.",
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

