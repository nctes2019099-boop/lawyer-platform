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
  title: "ميزان العدالة - منصة المحامين الذكية",
  description: "منصة إدارة مكتب المحاماة المتكاملة",
  viewport: "width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover",
  themeColor: "#C9A227",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "ميزان",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="ميزان" />
        <meta name="theme-color" content="#C9A227" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
