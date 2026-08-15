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

export function LogoutIcon({ className }: { className?: string }) {
  return (
    <svg {...iconProps(className)}>
      <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" />
      <path d="M10 8 6 12l4 4M6 12h9" />
    </svg>
  );
}

export function UndoIcon({ className }: { className?: string }) {
  return (
    <svg {...iconProps(className)}>
      <path d="M9 14 4 9l5-5" />
      <path d="M4 9h9a7 7 0 0 1 0 14h-3" />
    </svg>
  );
}

export function CheckIcon({ className }: { className?: string }) {
  return (
    <svg {...iconProps(className)}>
      <path d="m5 13 4 4L19 7" />
    </svg>
  );
}

export function TargetIcon({ className }: { className?: string }) {
  return (
    <svg {...iconProps(className)}>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="3.5" />
    </svg>
  );
}

export function LayersIcon({ className }: { className?: string }) {
  return (
    <svg {...iconProps(className)}>
      <path d="m12 3 9 5-9 5-9-5 9-5" />
      <path d="m3 13 9 5 9-5" />
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

export function FlameIcon({ className }: { className?: string }) {
  return (
    <svg {...iconProps(className)}>
      <path d="M12 21c3.6 0 6-2.4 6-5.6 0-2.5-1.5-4.4-2.9-6C13.9 8 13 6.5 13 4.5c0 0-5.5 2.6-5.5 7.5 0 1.2.3 2.1.8 2.9.3-.9.9-1.7 1.7-2.4.4 2.6 2 3.4 2 5.5 0 1.2-.5 2.2-1.4 2.8" />
    </svg>
  );
}

export function PrinterIcon({ className }: { className?: string }) {
  return (
    <svg {...iconProps(className)}>
      <path d="M7 8V3.5h10V8M7 17H4.5a1 1 0 0 1-1-1v-6a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2v6a1 1 0 0 1-1 1H17M7 14.5h10v6H7v-6Z" />
    </svg>
  );
}

export function BellIcon({ className }: { className?: string }) {
  return (
    <svg {...iconProps(className)}>
      <path d="M18 10a6 6 0 1 0-12 0c0 4-1.5 5.5-2.5 6.5h17c-1-1-2.5-2.5-2.5-6.5M10 20a2.2 2.2 0 0 0 4 0" />
    </svg>
  );
}

export function ClockIcon({ className }: { className?: string }) {
  return (
    <svg {...iconProps(className)}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
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

export function TrashIcon({ className }: { className?: string }) {
  return (
    <svg {...iconProps(className)}>
      <path d="M4 7h16M10 4h4M6 7l1 13h10l1-13" />
      <path d="M10 11v5M14 11v5" />
    </svg>
  );
}

export function SearchIcon({ className }: { className?: string }) {
  return (
    <svg {...iconProps(className)}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4.35-4.35" />
    </svg>
  );
}
