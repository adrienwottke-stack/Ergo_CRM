"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { SearchIcon, PlusIcon, PhoneIcon } from "@/components/icons";

interface SearchResult {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  stage: string;
}

export default function CommandPalette({ searchAction }: { searchAction: (query: string) => Promise<SearchResult[]> }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
      setResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await searchAction(query);
        setResults(res);
        setSelectedIndex(0);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [query, searchAction]);

  const handleSelect = (url: string) => {
    setIsOpen(false);
    router.push(url);
  };

  const handleKeyDownInInput = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (results.length > 0 ? (prev + 1) % results.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (results.length > 0 ? (prev - 1 + results.length) % results.length : 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (results[selectedIndex]) {
        handleSelect(`/contacts/${results[selectedIndex]!.id}`);
      }
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs text-slate-300 hover:bg-white/20 hover:text-white transition"
      >
        <SearchIcon className="h-3.5 w-3.5 text-slate-400" />
        <span className="hidden md:inline">Suche...</span>
        <kbd className="rounded bg-navy-900/80 px-1.5 py-0.5 text-[10px] font-semibold text-slate-300 border border-white/10">
          ⌘K
        </kbd>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 bg-slate-900/60 backdrop-blur-sm p-4">
          <div
            className="w-full max-w-xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center border-b border-slate-100 px-4 py-3">
              <SearchIcon className="h-5 w-5 text-slate-400 mr-3 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDownInInput}
                placeholder="Name, Telefonnummer oder E-Mail suchen..."
                className="w-full bg-transparent text-sm font-medium text-slate-900 focus:outline-none placeholder:text-slate-400"
              />
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded p-1 text-xs text-slate-400 hover:bg-slate-100"
              >
                ESC
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto p-2">
              {isLoading ? (
                <p className="p-4 text-center text-xs text-slate-400">Suchen...</p>
              ) : query.trim() && results.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-sm font-medium text-slate-700">Keine Kontakte gefunden</p>
                  <p className="text-xs text-slate-400 mt-1">Versuche einen anderen Suchbegriff</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {results.map((res, idx) => (
                    <button
                      key={res.id}
                      onClick={() => handleSelect(`/contacts/${res.id}`)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition ${
                        idx === selectedIndex ? "bg-navy-50 text-navy-900" : "hover:bg-slate-50 text-slate-800"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-navy-100 text-xs font-bold text-navy-700">
                          {res.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{res.name}</p>
                          {res.phone && (
                            <p className="text-xs text-slate-500 flex items-center gap-1">
                              <PhoneIcon className="h-3 w-3" /> {res.phone}
                            </p>
                          )}
                        </div>
                      </div>
                      <span className="text-xs font-medium text-slate-400">Öffnen ↵</span>
                    </button>
                  ))}

                  <button
                    onClick={() => handleSelect("/contacts/new")}
                    className="w-full flex items-center gap-3 p-3 rounded-xl text-left text-navy-700 hover:bg-navy-50 transition border-t border-slate-100 mt-2"
                  >
                    <PlusIcon className="h-4 w-4" />
                    <span className="text-xs font-semibold">Neuen Kontakt anlegen</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
