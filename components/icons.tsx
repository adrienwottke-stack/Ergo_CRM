// Schlanke Outline-Icons (stroke 1.75) – bewusst ohne Icon-Library.

function iconProps(className?: string) {
  return {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className: className ?? "h-5 w-5",
    "aria-hidden": true,
  };
}

export function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg {...iconProps(className)}>
      <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" />
    </svg>
  );
}

export function HashIcon({ className }: { className?: string }) {
  return (
    <svg {...iconProps(className)}>
      <path d="M4 9h16M4 15h16M10 3 8 21M16 3l-2 18" />
    </svg>
  );
}

export function CalendarCheckIcon({ className }: { className?: string }) {
  return (
    <svg {...iconProps(className)}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M3 10h18M9 15.5l2 2 4-4" />
    </svg>
  );
}

export function UsersIcon({ className }: { className?: string }) {
  return (
    <svg {...iconProps(className)}>
      <circle cx="9" cy="8" r="3.25" />
      <path d="M3.5 19.5c.7-3 2.9-4.5 5.5-4.5s4.8 1.5 5.5 4.5M15.5 5.4a3.25 3.25 0 1 1 .6 6M17.5 15.2c1.8.5 3.1 1.8 3.6 4.3" />
    </svg>
  );
}

export function TrophyIcon({ className }: { className?: string }) {
  return (
    <svg {...iconProps(className)}>
      <path d="M8 4h8v6a4 4 0 0 1-8 0V4Z" />
      <path d="M8 5H5a1 1 0 0 0-1 1c0 2.5 1.5 4 4 4.3M16 5h3a1 1 0 0 1 1 1c0 2.5-1.5 4-4 4.3M12 14v3M8.5 20h7M10 17h4" />
    </svg>
  );
}

export function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg {...iconProps(className)}>
      <path d="m9 5 7 7-7 7" />
    </svg>
  );
}

export function PlusIcon({ className }: { className?: string }) {
  return (
    <svg {...iconProps(className)}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function ClipboardIcon({ className }: { className?: string }) {
  return (
    <svg {...iconProps(className)}>
      <rect x="6" y="4.5" width="12" height="16" rx="2" />
      <path d="M9 4.5a2 2 0 0 1 6 0M9.5 10.5h5M9.5 14h5M9.5 17.5h3" />
    </svg>
  );
}

export function LockIcon({ className }: { className?: string }) {
  return (
    <svg {...iconProps(className)}>
      <rect x="5" y="10.5" width="14" height="9.5" rx="2" />
      <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5M12 14.5v2" />
    </svg>
  );
}
