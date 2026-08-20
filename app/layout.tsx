import type { Metadata, Viewport } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import ServiceWorkerRegistrierung from "@/components/ServiceWorkerRegistrierung";

// Chrome meldet die Installierbarkeit ueber "beforeinstallprompt" - und zwar
// frueh, oft bevor React ueberhaupt haengt. Wer erst in einer Komponente
// zuhoert, verpasst das Ereignis und hat einen Knopf ohne Wirkung. Deshalb
// dieser Dreizeiler direkt im HTML: er faengt das Ereignis auf, haelt es fest
// und sagt der Schleuse per eigenem Ereignis Bescheid.
const INSTALL_MITSCHNITT = `window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();window.__ergoInstall=e;window.dispatchEvent(new Event('ergo-install-bereit'))});`;

const inter = Inter({
  variable: "--font-inter",
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
  appleWebApp: { capable: true, title: "Ergo CRM", statusBarStyle: "default" },
  icons: { apple: "/apple-touch-icon.png" },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
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
      <head>
        <script dangerouslySetInnerHTML={{ __html: INSTALL_MITSCHNITT }} />
      </head>
      <body
        className={`${inter.variable} ${geistMono.variable} font-sans antialiased`}
      >
        {children}
        <ServiceWorkerRegistrierung />
      </body>
    </html>
  );
}
