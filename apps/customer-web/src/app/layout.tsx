import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { CartDrawer } from "@/components/ui/CartDrawer";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Premium Restaurant",
  description: "Order your favorite food with ease.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased bg-background text-foreground`}>
        {children}
        <CartDrawer />
      </body>
    </html>
  );
}
