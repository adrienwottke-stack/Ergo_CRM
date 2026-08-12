"use client";

import { PrinterIcon } from "@/components/icons";
import { btnSecondary } from "@/components/ui";

export default function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className={`${btnSecondary} print:hidden`}
    >
      <PrinterIcon className="h-4 w-4" />
      Drucken / PDF
    </button>
  );
}
