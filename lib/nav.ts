// Unterreiter der zusammengefassten Bereiche. Liegen hier und nicht in der
// Reiter-Komponente, damit Server-Komponenten sie importieren koennen, ohne
// ueber die "use client"-Grenze zu stolpern.

export const PIPELINE_TABS = [
  { href: "/pipeline", label: "Pipeline" },
  { href: "/vorgaenge", label: "Vorgänge" },
  { href: "/contacts", label: "Kontakte" },
];

export const ZAHLEN_TABS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/trichter", label: "Trichter" },
];
