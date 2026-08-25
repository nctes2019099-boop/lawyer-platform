"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Search, Heart, X, Copy, Check, Eye, Scale } from "lucide-react";
import { toast } from "react-hot-toast";

const categoryColors: Record<string, string> = {
  مدني: "bg-cyan-100 text-cyan-700 dark:bg-cyan-950/30 dark:text-cyan-300",
  تجاري: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300",
  عمالي: "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300",
  جنائي: "bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300",
  عقاري: "bg-purple-100 text-purple-700 dark:bg-purple-950/30 dark:text-purple-300",
  "أحوال شخصية": "bg-pink-100 text-pink-700 dark:bg-pink-950/30 dark:text-pink-300",
  مرور: "bg-orange-100 text-orange-700 dark:bg-orange-950/30 dark:text-orange-300",
  فكري: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-300",
  إجراءات: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
};

export function LawsScreen() {
  const [laws, setLaws] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState("الكل");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);
  const [selected, setSelected] = useState<any | null>(null);
  const [viewed, setViewed] = useState<Record<string, number>>({});
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/laws").then((r) => r.json()).then((d) => { setLaws(Array.isArray(d) ? d : []); setLoading(false); }).catch(() => setLoading(false));
    try {
      const saved = JSON.parse(localStorage.getItem("law-views") || "{}");
      if (saved) setViewed(saved);
    } catch { /* ignore */ }
  }, []);

  const categories = useMemo(() => ["الكل", ...Array.from(new Set(laws.map((l) => l.category).filter(Boolean)))], [laws]);

  const filtered = useMemo(() => {
    const q = search.trim();
    return laws.filter((l) => {
      const matchCat = activeCat === "الكل" || l.category === activeCat;
      const matchFav = !favoritesOnly || l.isFavorite;
      const matchSearch = !q || (l.title || "").includes(q) || (l.number || "") === q || (l.content || "").includes(q);
      return matchCat && matchFav && matchSearch;
    });
  }, [laws, search, activeCat, favoritesOnly]);

  const toggleFav = async (l: any) => {
    setToggling(l.id);
    const next = !l.isFavorite;
    setLaws((prev) => prev.map((x) => (x.id === l.id ? { ...x, isFavorite: next } : x)));
    try {
      const res = await fetch("/api/laws", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: l.id, isFavorite: next }) });
      if (!res.ok) throw new Error();
      toast.success(next ? "أُضيفت للمفضلة" : "أُزيلت من المفضلة");
    } catch {
      setLaws((prev) => prev.map((x) => (x.id === l.id ? { ...x, isFavorite: !next } : x)));
      toast.error("فشل التحديث");
    } finally {
      setToggling(null);
    }
  };

  const openLaw = (l: any) => {
    setSelected(l);
    const next = { ...viewed, [l.id]: (viewed[l.id] || 0) + 1 };
    setViewed(next);
    localStorage.setItem("law-views", JSON.stringify(next));
  };

  const copyContent = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("تم نسخ النص");
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="max-w-lg mx-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl brand-emerald flex items-center justify-center shadow-md shadow-primary/20"><Scale className="w-5 h-5 text-white" /></div>
          <div><h2 className="text-lg font-extrabold">القوانين</h2><p className="text-[11px] text-muted-foreground">المكتبة القانونية العراقية</p></div>
        </div>
        <button onClick={() => setFavoritesOnly((v) => !v)} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${favoritesOnly ? "bg-rose-100 text-rose-600" : "bg-secondary/60 text-muted-foreground hover:bg-secondary"}`}>
          <Heart className={`w-5 h-5 ${favoritesOnly ? "fill-current" : ""}`} />
        </button>
      </div>

      <div className="relative mb-3">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ابحث برقم القانون أو نصه..." className="form-input pr-10" dir="rtl" />
      </div>

      <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-1 mb-4">
        {categories.map((cat) => (
          <button key={cat} onClick={() => setActiveCat(cat)} className={`px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all ${activeCat === cat ? "brand-emerald text-white shadow" : "bg-secondary text-muted-foreground"}`}>
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-28 rounded-2xl bg-secondary/50 animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16"><BookOpen className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" /><p className="text-sm text-muted-foreground">لا توجد قوانين</p></div>
      ) : (
        <div className="space-y-3">
          {filtered.map((l) => (
            <motion.div key={l.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="legal-card rounded-2xl p-4 hover-legal cursor-pointer" onClick={() => openLaw(l)}>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold ${categoryColors[l.category] || categoryColors["إجراءات"]}`}>{l.category}</span>
                    {l.number && <span className="text-[10px] text-muted-foreground font-mono">رقم {l.number}{l.year ? ` / ${l.year}` : ""}</span>}
                  </div>
                  <p className="text-sm font-bold mt-1.5">{l.title}</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); toggleFav(l); }}
                  disabled={toggling === l.id}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${l.isFavorite ? "text-rose-500 bg-rose-50 dark:bg-rose-950/30" : "text-muted-foreground/40 hover:text-rose-500 hover:bg-rose-50"}`}
                >
                  <Heart className={`w-4 h-4 ${l.isFavorite ? "fill-current" : ""}`} />
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">{l.content}</p>
              <div className="flex items-center gap-3 mt-2.5 text-[10px] text-muted-foreground/70">
                {viewed[l.id] ? <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {viewed[l.id]}</span> : null}
                <span>اضغط للعرض الكامل</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {selected && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setSelected(null)}>
            <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="bg-card border border-border rounded-t-3xl sm:rounded-2xl w-full max-w-lg max-h-[88vh] overflow-y-auto">
              <div className="sticky top-0 bg-card/95 backdrop-blur p-4 border-b flex items-center justify-between brand-emerald text-white rounded-t-3xl sm:rounded-t-2xl">
                <div className="min-w-0">
                  <p className="text-xs text-white/80">{selected.category}{selected.number ? ` — رقم ${selected.number} لسنة ${selected.year || ""}` : ""}</p>
                  <h3 className="font-bold text-sm truncate">{selected.title}</h3>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => copyContent(selected.content)} className="w-9 h-9 rounded-xl hover:bg-white/15 flex items-center justify-center">{copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}</button>
                  <button onClick={() => setSelected(null)} className="w-9 h-9 rounded-xl hover:bg-white/15 flex items-center justify-center"><X className="w-4 h-4" /></button>
                </div>
              </div>
              <div className="p-5">
                <p className="text-sm leading-loose whitespace-pre-wrap">{selected.content}</p>
              </div>
              <div className="sticky bottom-0 p-4 border-t bg-card/95 backdrop-blur flex gap-2">
                <button onClick={() => toggleFav(selected)} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 ${selected.isFavorite ? "bg-rose-100 text-rose-600" : "brand-emerald text-white"}`}>
                  <Heart className={`w-4 h-4 ${selected.isFavorite ? "fill-current" : ""}`} /> {selected.isFavorite ? "مفضلة" : "أضف للمفضلة"}
                </button>
                <button onClick={() => copyContent(selected.content)} className="flex-1 py-2.5 rounded-xl border border-border hover:bg-secondary text-sm font-semibold">نسخ النص</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
