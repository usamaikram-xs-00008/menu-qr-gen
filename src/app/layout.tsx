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
  title: "MenuQR - Digital Restaurant Menus with QR Codes",
  description: "Create beautiful digital menus for your restaurant in minutes. Generate QR codes instantly and give your customers a contactless dining experience.",
  keywords: "digital menu, restaurant menu, QR code menu, contactless menu, restaurant management",
  authors: [{ name: "MenuQR Team" }],
  openGraph: {
    title: "MenuQR - Digital Restaurant Menus with QR Codes",
    description: "Create beautiful digital menus for your restaurant in minutes. Generate QR codes instantly.",
    type: "website",
    url: "https://menuqr.com",
    images: [
      {
        url: "https://menuqr.com/og-image.png",
        width: 1200,
        height: 630,
        alt: "MenuQR - Digital Restaurant Menus",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MenuQR - Digital Restaurant Menus with QR Codes",
    description: "Create beautiful digital menus for your restaurant in minutes.",
    images: ["https://menuqr.com/twitter-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
  },
  themeColor: "#2563eb",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}