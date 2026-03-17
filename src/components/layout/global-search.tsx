"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useUser, useFirestore } from "@/firebase";
import { collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import { Search, X, ArrowRight, Phone, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";

/**
 * Cmd+K global contact search for Monica's MacBook.
 * Opens a modal with a search field and results.
 */
export function GlobalSearch() {
  const router = useRouter();
  const { user } = useUser();
  const firestore = useFirestore();
  const [open, setOpen] = useState(false);
  const [query_, setQuery_] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  // Cmd+K listener
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(o => !o);
        setQuery_("");
        setResults([]);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  const search = useCallback(async (q: string) => {
    if (!user || !firestore || q.trim().length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    try {
      const upper = q.trim().toUpperCase();
      const contactsRef = collection(firestore, "users", user.uid, "contacts");
      const snap = await getDocs(
        query(contactsRef, orderBy("name"), where("name", ">=", upper), where("name", "<=", upper + "\uf8ff"), limit(8))
      );
      setResults(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } finally {
      setSearching(false);
    }
  }, [user, firestore]);

  useEffect(() => {
    const t = setTimeout(() => search(query_), 200);
    return () => clearTimeout(t);
  }, [query_, search]);

  const goTo = (id: string) => {
    router.push(`/contacts/${id}`);
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-start justify-center pt-24 px-4"
      onClick={() => setOpen(false)}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in slide-in-from-top-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 p-4 border-b">
          <Search className="h-5 w-5 text-slate-400 shrink-0" />
          <input
            autoFocus
            type="text"
            placeholder="Search contacts by name, phone, or address..."
            className="flex-1 text-base outline-none bg-transparent placeholder:text-slate-400"
            value={query_}
            onChange={e => setQuery_(e.target.value)}
          />
          {query_ && (
            <button onClick={() => { setQuery_(""); setResults([]); }} className="text-slate-400 hover:text-slate-600">
              <X className="h-4 w-4" />
            </button>
          )}
          <kbd className="hidden sm:flex items-center gap-1 px-2 py-1 bg-slate-100 rounded text-xs text-slate-500 font-mono">
            ESC
          </kbd>
        </div>

        {results.length > 0 && (
          <ul className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {results.map((contact: any) => (
              <li key={contact.id}>
                <button
                  className="w-full flex items-center gap-3 p-3 hover:bg-primary/5 transition-colors text-left group"
                  onClick={() => goTo(contact.id)}
                >
                  <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-primary/10 transition-colors">
                    <User className="h-4 w-4 text-slate-500 group-hover:text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-primary truncate">{contact.name}</p>
                    <div className="flex items-center gap-2">
                      {contact.phone && (
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Phone className="h-3 w-3" />{contact.phone}
                        </span>
                      )}
                      {contact.propertyAddress && (
                        <span className="text-xs text-slate-400 truncate max-w-[160px]">{contact.propertyAddress}</span>
                      )}
                    </div>
                  </div>
                  {contact.icpScore >= 80 && (
                    <Badge className="bg-orange-100 text-orange-700 text-[10px] shrink-0">HOT</Badge>
                  )}
                  <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-primary transition-colors shrink-0" />
                </button>
              </li>
            ))}
          </ul>
        )}

        {query_.length >= 2 && results.length === 0 && !searching && (
          <div className="p-8 text-center text-slate-400 text-sm">
            No contacts found for "{query_}"
          </div>
        )}

        <div className="p-3 bg-slate-50 border-t flex items-center justify-between text-xs text-slate-400">
          <span>Search by name, phone, or address</span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-white border rounded font-mono">⌘K</kbd>
            to toggle
          </span>
        </div>
      </div>
    </div>
  );
}
