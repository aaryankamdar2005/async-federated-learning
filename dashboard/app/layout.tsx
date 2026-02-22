// app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AsyncShield | Decentralized Federated Learning",
  description: "A secure, zero-trust network for asynchronous AI model training.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-black text-white antialiased`}>
        {/* The Navbar will now sit at the top of every single page! */}
        <Navbar />
        
        {/* The rest of your pages (Landing, Server, Client) render here */}
        <main>{children}</main>
      </body>
    </html>
  );
}