import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://recoup.internal"),
  title: {
    default: "Recoup — Autonomous P2P Debt Recovery Agent",
    template: "%s | Recoup",
  },
  description:
    "Autonomous recovery infrastructure for Razorpay merchants. Tracks debtor commitments, enforces deterministic dispute freezes, and maintains an immutable audit ledger.",
  keywords: [
    "debt recovery",
    "Razorpay",
    "autonomous agent",
    "audit ledger",
    "promise to pay",
    "dispute management",
    "fintech infrastructure",
  ],
  authors: [{ name: "Recoup Engineering" }],
  creator: "Recoup",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "Recoup",
    title: "Recoup — Autonomous P2P Debt Recovery Agent",
    description: "Every promise to pay, tracked, verified, and provable. Built for Razorpay merchants.",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "Recoup — Autonomous Debt Recovery",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Recoup — Autonomous P2P Debt Recovery Agent",
    description: "Every promise to pay, tracked, verified, and provable. Built for Razorpay merchants.",
    images: ["/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* Google Font: Caacupé One */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Caacupe+One&display=swap"
          rel="stylesheet"
        />
        {/* Blade typography matching Razorpay's actual product feel */}
        <link href="https://cdn.jsdelivr.net/npm/@razorpay/blade/fonts.css" rel="stylesheet" />
      </head>
      <body className="min-h-full flex flex-col font-sans" suppressHydrationWarning>{children}</body>
    </html>
  );
}

