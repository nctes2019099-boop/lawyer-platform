import type { Metadata, Viewport } from "next";
import "./globals.css";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://mizan.example.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "ميزان العدالة - منصة المحامين الذكية",
  description:
    "منصة إدارة مكتب المحاماة المتكاملة: القضايا، الموكلين، المواعيد، الجلسات، المالية، الوثائق، والمزيد.",
  applicationName: "ميزان العدالة",
  keywords: [
    "محاماة",
    "محامي",
    "إدارة القضايا",
    "العرائض",
    "المواعيد",
    "المالية",
    "العراق",
  ],
  authors: [{ name: "ميزان العدالة" }],
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: ["/favicon-16.png"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "ميزان",
  },
  openGraph: {
    type: "website",
    locale: "ar_IQ",
    title: "ميزان العدالة - منصة المحامين",
    description: "منصة إدارة مكتب المحاماة المتكاملة",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: { card: "summary_large_image", images: ["/og-image.png"] },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#C9A227" },
    { media: "(prefers-color-scheme: dark)", color: "#0f1830" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl">
      <body className="antialiased">{children}</body>
    </html>
  );
}
