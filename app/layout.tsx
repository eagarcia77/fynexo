import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FYNEXO",
  description: "Financial Operations & Procurement Intelligence",
  icons: { icon: "/fynexo-mark.svg", shortcut: "/fynexo-mark.svg", apple: "/fynexo-mark.svg" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
