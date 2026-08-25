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

// Die gemerkte Ansicht muss VOR dem ersten Anzeigen stehen, sonst blitzt beim
// Laden kurz die helle Seite auf, bevor React die Klasse setzt - das sieht wie
// ein Fehler aus. Deshalb hier, im Kopf, ohne React: liest die Einstellung,
// faellt auf die Geraetevorgabe zurueck und setzt die Klasse sofort.
// Der try/catch ist noetig, weil localStorage in manchen Browsern (privater
// Modus, gesperrte Cookies) beim blossen Zugriff wirft.
const THEMA_VORLAUF = `(function(){try{var t=localStorage.getItem('ergo-thema')||'system';var d=t==='dunkel'||(t==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d)}catch(e){}})();`;

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
  // Die Kopfzeile ist jetzt dunkel und reicht bis unter die Statusleiste.
  // "black-translucent" laesst den Inhalt darunter durchlaufen - zusammen mit
  // dem safe-area-Polster im AppShell steht das Navy hinter der Uhrzeit, statt
  // dass daueber ein weisser Streifen klebt.
  appleWebApp: {
    capable: true,
    title: "Ergo CRM",
    statusBarStyle: "black-translucent",
  },
  icons: { apple: "/apple-touch-icon.png" },
};

export const viewport: Viewport = {
  // Dieselbe Farbe wie die Kopfzeile, in beiden Ansichten - die Leiste des
  // Browsers soll die Kopfzeile fortsetzen, nicht mit ihr brechen.
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
    // suppressHydrationWarning: das Skript unten setzt die Klasse "dark" schon
    // vor React. Ohne den Hinweis meldet React genau diesen Unterschied.
    <html lang="de" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEMA_VORLAUF }} />
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
