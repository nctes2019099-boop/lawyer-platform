"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "@/lib/store";
import {
  Search,
  X,
  Briefcase,
  Users,
  BookOpen,
  CalendarDays,
  FileText,
  Clock,
  Trash2,
} from "lucide-react";

const categoryIcons: Record<string, React.ElementType> = {
  cases: Briefcase,
  clients: Users,
  laws: BookOpen,
  appointments: CalendarDays,
  notes: FileText,
};

const categoryLabels: Record<string, string> = {
  cases: "القضايا",
  clients: "الموكلين",
  laws: "القوانين",
  appointments: "المواعيد",
  notes: "المفكرة",
};

export function GlobalSearchDialog() {
  const { searchOpen, setSearchOpen } = useAppStore();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Record<string, unknown[]>>({});
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem("recent-searches");
    if (saved) setRecentSearches(JSON.parse(saved));
  }, []);

  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [searchOpen]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === "Escape") setSearchOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [setSearchOpen]);

  const search = useCallback(
    async (q: string) => {
      if (!q || q.length < 2) {
        setResults({});
        return;
      }
      setLoading(true);
      try {
        const url = `/api/search?q=${encodeURIComponent(q)}${activeCategory ? `&type=${activeCategory}` : ""}`;
        const res = await fetch(url);
        const data = await res.json();
        setResults(data);
      } catch {
        setResults({});
      }
      setLoading(false);
    },
    [activeCategory]
  );

  useEffect(() => {
    const timer = setTimeout(() => search(query), 300);
    return () => clearTimeout(timer);
  }, [query, search]);

  const addRecent = (q: string) => {
    const updated = [q, ...recentSearches.filter((s) => s !== q)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem("recent-searches", JSON.stringify(updated));
  };

  const clearRecent = () => {
    setRecentSearches([]);
    localStorage.removeItem("recent-searches");
  };

  const hasResults = Object.values(results).some((arr) => arr.length > 0);

  return (
    <AnimatePresence>
      {searchOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[70] flex items-start justify-center pt-20 px-4"
          onClick={() => setSearchOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            style={{ maxHeight: "70vh" }}
          >
            {/* Search Input */}
            <div className="flex items-center gap-3 p-4 border-b border-border">
              <Search className="w-5 h-5 text-muted-foreground" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ابحث في القضايا، الموكلين، القوانين..."
                className="flex-1 bg-transparent outline-none text-sm"
              />
              {query && (
                <button onClick={() => setQuery("")}>
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              )}
            </div>

            {/* Category Chips */}
            <div className="flex gap-2 p-3 overflow-x-auto scrollbar-none">
              <button
                onClick={() => setActiveCategory(null)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  !activeCategory
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-accent"
                }`}
              >
                الكل
              </button>
              {Object.entries(categoryLabels).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setActiveCategory(activeCategory === key ? null : key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                    activeCategory === key
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-accent"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Results */}
            <div className="overflow-y-auto" style={{ maxHeight: "calc(70vh - 140px)" }}>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : query.length >= 2 && hasResults ? (
                <div className="p-3 space-y-4">
                  {Object.entries(results).map(([category, items]) => {
                    if (!items.length) return null;
                    const Icon = categoryIcons[category] || FileText;
                    return (
                      <div key={category}>
                        <div className="flex items-center gap-2 mb-2 px-1">
                          <Icon className="w-4 h-4 text-primary" />
                          <span className="text-xs font-bold text-muted-foreground">
                            {categoryLabels[category]}
                          </span>
                          <span className="text-[10px] text-muted-foreground/60">
                            ({items.length})
                          </span>
                        </div>
                        <div className="space-y-1">
                          {items.map((item: any, i: number) => (
                            <motion.button
                              key={i}
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: i * 0.05 }}
                              onClick={() => {
                                addRecent(query);
                                setSearchOpen(false);
                              }}
                              className="w-full text-right px-3 py-2.5 rounded-xl hover:bg-accent transition-all"
                            >
                              <p className="text-sm font-medium truncate">
                                {(item.title as string) || (item.name as string) || (item.caseNumber as string) || ""}
                              </p>
                              {(item.description as string) || (item.content as string) ? (
                                <p className="text-xs text-muted-foreground truncate mt-0.5">
                                  {(item.description as string) || (item.content as string)?.slice(0, 60)}
                                </p>
                              ) : null}
                            </motion.button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : query.length >= 2 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <Search className="w-8 h-8 mb-2 opacity-50" />
                  <p className="text-sm">لا توجد نتائج</p>
                </div>
              ) : recentSearches.length > 0 ? (
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-muted-foreground">عمليات البحث الأخيرة</span>
                    <button
                      onClick={clearRecent}
                      className="text-[10px] text-rose-500 flex items-center gap-1 hover:underline"
                    >
                      <Trash2 className="w-3 h-3" />
                      مسح
                    </button>
                  </div>
                  <div className="space-y-1">
                    {recentSearches.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => setQuery(s)}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-accent transition-all text-right"
                      >
                        <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-sm">{s}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <Search className="w-8 h-8 mb-2 opacity-50" />
                  <p className="text-sm">ابدأ بالكتابة للبحث</p>
                  <p className="text-xs mt-1">Ctrl+K للفتح السريع</p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
