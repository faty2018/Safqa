import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Safqa — Veille des appels d'offres publics",
  description: "Plateforme B2B de veille et gestion d'appels d'offres publics au Maroc.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
