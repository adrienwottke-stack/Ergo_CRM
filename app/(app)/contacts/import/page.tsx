import Link from "next/link";
import { ArrowLeftIcon } from "@/components/icons";
import { requireUser } from "@/lib/auth";
import CsvImportForm from "@/components/CsvImportForm";
import { pageTitle } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function ContactImportPage() {
  await requireUser();

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/contacts"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-slate-900"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Alle Kontakte
        </Link>
        <h1 className={`${pageTitle} mt-2`}>Kontakte importieren</h1>
      </div>

      <CsvImportForm />
    </div>
  );
}
