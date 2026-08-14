"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { bulkImportContacts } from "@/app/(app)/contacts/actions";
import { btnPrimary, card, input } from "@/components/ui";

interface ParsedContact {
  name: string;
  phone?: string;
  email?: string;
  source?: string;
  note?: string;
}

export default function CsvImportForm() {
  const [csvText, setCsvText] = useState("");
  const [parsedContacts, setParsedContacts] = useState<ParsedContact[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importedCount, setImportedCount] = useState<number | null>(null);
  const router = useRouter();

  const handleParseCsv = (raw: string) => {
    setCsvText(raw);
    if (!raw.trim()) {
      setParsedContacts([]);
      return;
    }

    const lines = raw.trim().split(/\r?\n/).filter(Boolean);
    if (lines.length === 0) return;

    // Check if first line is header
    const firstLine = lines[0]!.toLowerCase();
    const hasHeader = firstLine.includes("name") || firstLine.includes("telefon") || firstLine.includes("email");

    const startIdx = hasHeader ? 1 : 0;
    const items: ParsedContact[] = [];

    for (let i = startIdx; i < lines.length; i++) {
      const parts = lines[i]!.split(/[,;\t]/).map((s) => s.trim().replace(/^["']|["']$/g, ""));
      if (!parts[0]) continue; // Name required

      items.push({
        name: parts[0] || "",
        phone: parts[1] || undefined,
        email: parts[2] || undefined,
        source: parts[3] || "CSV Import",
        note: parts[4] || undefined,
      });
    }

    setParsedContacts(items);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      if (content) handleParseCsv(content);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (parsedContacts.length === 0) return;
    setIsImporting(true);
    try {
      const res = await bulkImportContacts(parsedContacts);
      if (res.success) {
        setImportedCount(res.count);
        setTimeout(() => router.push("/contacts"), 1500);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className={`${card} p-6 sm:p-8 space-y-6 max-w-3xl mx-auto`}>
      <div>
        <h2 className="text-lg font-bold text-slate-900">📥 Kontakte per CSV importieren</h2>
        <p className="mt-1 text-sm text-slate-500">
          Lade eine `.csv` Datei hoch oder füge kommaseparierten Text ein.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
            CSV-Datei auswählen:
          </label>
          <input
            type="file"
            accept=".csv, .txt"
            onChange={handleFileUpload}
            className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-navy-50 file:text-navy-700 hover:file:bg-navy-100"
          />
        </div>

        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-slate-200"></div>
          <span className="flex-shrink mx-4 text-xs font-medium text-slate-400">ODER MANUELL EINFÜGEN</span>
          <div className="flex-grow border-t border-slate-200"></div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
            Format: Name, Telefon, E-Mail, Quelle, Notiz
          </label>
          <textarea
            rows={5}
            value={csvText}
            onChange={(e) => handleParseCsv(e.target.value)}
            placeholder={`Max Mustermann, +49170123456, max@beispiel.de, Empfehlung, Erstkontakt hergestellt\nErika Muster, +49170987654, erika@beispiel.de, Messe, Führungskraft`}
            className={`${input} font-mono text-xs`}
          />
        </div>
      </div>

      {parsedContacts.length > 0 && (
        <div className="space-y-3 border-t border-slate-100 pt-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800">
              Vorschau ({parsedContacts.length} Kontakte erkannt)
            </h3>
          </div>

          <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-700">
                <tr>
                  <th className="p-2.5">Name</th>
                  <th className="p-2.5">Telefon</th>
                  <th className="p-2.5">E-Mail</th>
                  <th className="p-2.5">Quelle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {parsedContacts.slice(0, 10).map((c, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="p-2.5 font-medium text-slate-900">{c.name}</td>
                    <td className="p-2.5 text-slate-600">{c.phone || "–"}</td>
                    <td className="p-2.5 text-slate-600">{c.email || "–"}</td>
                    <td className="p-2.5 text-slate-600">{c.source || "CSV Import"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              disabled={isImporting}
              onClick={handleImport}
              className={btnPrimary}
            >
              {isImporting ? "Importiere..." : `${parsedContacts.length} Kontakte importieren`}
            </button>
          </div>
        </div>
      )}

      {importedCount !== null && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-center text-sm font-bold text-emerald-800">
          ✅ Erfolgreich {importedCount} Kontakte importiert! Weiterleitung...
        </div>
      )}
    </div>
  );
}
