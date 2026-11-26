import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: "RDA Contractor Data Collection System | Road Development Authority Sri Lanka",
  description:
    "Official centralized administrative portal for contractor data collection, capacity assessment, and QR credentialing under the Road Development Authority, Sri Lanka.",
};

/**
 * Root Layout
 *
 * Provides the global HTML document shell and styles.
 * Layout chrome is handled strictly by route groups:
 * - (admin)/layout.tsx: Wraps authenticated pages in AppShell (Sidebar + TopNav)
 * - (auth)/: Public authentication pages render without any admin chrome
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Noto+Sans+Sinhala:wght@400;500;600;700&family=Noto+Sans+Tamil:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased bg-slate-50 min-h-screen text-slate-800">
        {children}
      </body>
    </html>
  );
}
