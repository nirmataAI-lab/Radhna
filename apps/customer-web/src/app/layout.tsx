import type { Metadata } from "next";
import "./globals.css";
import { CartDrawer } from "@/components/ui/CartDrawer";
import { SocketNotifications } from "@/components/ui/SocketNotifications";

export const metadata: Metadata = {
  title: "Radhna Cuisine",
  description: "Browse the menu, place orders, and track your order in real time.",
  manifest: "/manifest.json",
  appleWebApp: {
    title: "Radhna",
    statusBarStyle: "black-translucent",
  },
};

export const viewport = {
  themeColor: "#ff4500",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased bg-background text-foreground">
        {children}
        <CartDrawer />
        <SocketNotifications />
      </body>
    </html>
  );
}
