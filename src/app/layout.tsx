import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.davehajdu.com"),
  title: "Dave Hajdu | The Other 50%",
  description:
    "AI Keynote Speaker, Consultant, and Author. Where business fluency meets technical depth, the rare combination that makes AI actually work inside organizations.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="antialiased">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen flex flex-col" style={{ fontFamily: "'Inter', sans-serif" }}>
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
        <Script
          defer
          src="https://cloud.umami.is/script.js"
          data-website-id="f6e74def-f515-48bb-af6f-6dd01e173b39"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
