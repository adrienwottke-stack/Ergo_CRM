import type { Metadata, Viewport } from "next";
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
  title: "Ergo CRM",
  description: "Kontakt-Tracking für das Ergo-Netzwerk",
  // Am Handy laeuft die Anwendung ueber "Zum Startbildschirm hinzufuegen"
  // wie eine eigene App: eigenes Symbol, keine Adressleiste.
  appleWebApp: { capable: true, title: "Ergo CRM", statusBarStyle: "black-translucent" },
  icons: { apple: "/apple-touch-icon.png" },
};

export const viewport: Viewport = {
  themeColor: "#0a1628",
  // Die Kopfzeile ist klebrig und die Ergebnis-Knoepfe sitzen unten – ohne
  // viewportFit verschwinden sie am iPhone hinter der Home-Leiste.
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
