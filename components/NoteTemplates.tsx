"use client";

const TEMPLATES = [
  { label: "📞 Erstgespräch", text: "Erstgespräch geführt. Beratungstermin angefragt, Rückmeldung in Kürze." },
  { label: "🗣️ Mailbox besprochen", text: "Telefonisch nicht erreicht. Nachricht auf Mailbox hinterlassen mit Bitte um Rückruf." },
  { label: "📅 Termin vereinbart", text: "Beratungstermin erfolgreich vereinbart." },
  { label: "⏳ Kein Bedarf z.Zt.", text: "Aktuell kein Bedarf. Wiedervorlage für spätere Nachfassaktion eingeplant." },
  { label: "📧 Angebot gesendet", text: "Unterlagen und Angebot per E-Mail versendet." },
];

export default function NoteTemplates({
  targetInputId,
  onSelect,
}: {
  targetInputId?: string;
  onSelect?: (text: string) => void;
}) {
  const handleClick = (text: string) => {
    if (onSelect) {
      onSelect(text);
      return;
    }
    if (targetInputId) {
      const el = document.getElementById(targetInputId) as HTMLTextAreaElement | HTMLInputElement | null;
      if (el) {
        if (el.value) {
          el.value = `${el.value}\n${text}`;
        } else {
          el.value = text;
        }
        el.dispatchEvent(new Event("input", { bubbles: true }));
      }
    }
  };

  return (
    <div className="mt-2 flex flex-wrap items-center gap-1.5">
      <span className="text-xs font-medium text-slate-500 mr-1">Bausteine:</span>
      {TEMPLATES.map((tmpl) => (
        <button
          key={tmpl.label}
          type="button"
          onClick={() => handleClick(tmpl.text)}
          className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-navy-50 hover:text-navy-700 transition"
        >
          {tmpl.label}
        </button>
      ))}
    </div>
  );
}
