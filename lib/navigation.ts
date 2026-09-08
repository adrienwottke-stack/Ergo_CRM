export type NavSymbol =
  | "heute"
  | "kontakte"
  | "kalender"
  | "fortschritt"
  | "team";
export interface NavLink {
  href: string;
  label: string;
  symbol?: NavSymbol;
  exact?: boolean;
  match?: string[];
}

export const HAUPTNAVIGATION: NavLink[] = [
  { href: "/heute", label: "Heute", symbol: "heute" },
  {
    href: "/namen",
    label: "Kontakte",
    symbol: "kontakte",
    match: ["/contacts", "/suche"],
  },
  { href: "/kalender", label: "Kalender", symbol: "kalender" },
  {
    href: "/fortschritt",
    label: "Fortschritt",
    symbol: "fortschritt",
    match: [
      "/arena",
      "/leaderboard",
      "/log",
      "/einheiten",
      "/spiel",
      "/trichter",
    ],
  },
  { href: "/mannschaft", label: "Team", symbol: "team", match: ["/einladen"] },
];

export function navAktiv(link: NavLink, pathname: string): boolean {
  return link.exact
    ? pathname === link.href
    : [link.href, ...(link.match ?? [])].some(
        (path) => pathname === path || pathname.startsWith(`${path}/`),
      );
}
