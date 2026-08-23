"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "@/lib/store";
import { BookOpen, Search, Heart, ChevronDown, ChevronUp, Filter } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import toast from "react-hot-toast";

const lawCategories = ["الكل", "مدني", "تجاري", "عمالي", "جنائي", "عقاري", "أحوال شخصية", "مرور", "فكري", "إجراءات"];

const categoryColors: Record<string, string> = {
  "مدني": "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300",
  "تجاري": "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300",
  "عمالي": "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300",
  "جنائي": "bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300",
  "عقاري": "bg-cyan-100 text-cyan-700 dark:bg-cyan-950/30 dark:text-cyan-300",
  "أحوال شخصية": "bg-violet-100 text-violet-700 dark:bg-violet-950/30 dark:text-violet-300",
  "مرور": "bg-orange-100 text-orange-700 dark:bg-orange-950/30 dark:text-orange-300",
  "فكري": "bg-pink-100 text-pink-700 dark:bg-pink-950/30 dark:text-pink-300",
  "إجراءات": "bg-slate-100 text-slate-700 dark:bg-slate-950/30 dark:text-slate-300",
};

export function LawsScreen() {
  const [laws, setLaws] = useState<Record<string, unknown>[]>([]);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("الكل");
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/laws")
      .then(r => r.json())
      .then(data => { setLaws(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = laws.filter(l => {
    const matchesTab = activeTab === "الكل" || (l as Record<string, string>).category === activeTab;
    const matchesSearch = !search || (l as Record<string, string>).title?.includes(search) || (l as Record<string, string>).content?.includes(search);
    return matchesTab && matchesSearch;
  });

  const toggleFavorite = async (id: string, current: boolean) => {
    try {
      await fetch("/api/laws", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, isFavorite: !current }) });
      setLaws(laws.map(l => (l as Record<string, unknown>).id === id ? { ...l, isFavorite: !current } : l));
      toast.success(!current ? "تمت الإضافة للمفضلة" : "تمت الإزالة من المفضلة");
    } catch { toast.error("فشل التحديث"); }
  };

  if (loading) return <div className="flex items-center justify-center h-[60vh]"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto pb-20">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="brand-gradient rounded-2xl p-5 text-white relative overflow-hidden">
        <div className="relative z-10 flex items-center justify-between">
          <div><h2 className="text-lg font-extrabold">القوانين</h2><p className="text-white/70 text-xs mt-1">مكتبة القوانين العراقية</p></div>
          <div className="w-12 h-12 bg-white/15 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20"><BookOpen className="w-6 h-6" /></div>
        </div>
      </motion.div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث في القوانين..." className="w-full h-10 px-10 rounded-xl border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20" />
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto scrollbar-none pb-1">
        {lawCategories.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${activeTab === tab ? "bg-gradient-to-b from-white to-white/90 dark:from-white/10 dark:to-white/5 text-primary ring-1 ring-primary/10 shadow-sm" : "bg-muted text-muted-foreground hover:bg-accent"}`}>{tab}</button>
        ))}
      </div>

      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {filtered.map((law, i) => {
            const l = law as Record<string, unknown>;
            const isExpanded = expandedId === l.id;
            return (
              <motion.div key={l.id as string} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ delay: i * 0.05 }}>
                <Card className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={`text-[10px] ${categoryColors[l.category as string] || "bg-muted"} border-0`}>{l.category as string}</Badge>
                          {!!l.number && <span className="text-[10px] text-muted-foreground">رقم {String(l.number)} لسنة {String(l.year || "")}</span>}
                        </div>
                        <h3 className="text-sm font-bold">{l.title as string}</h3>
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                              <p className="text-xs text-muted-foreground mt-3 leading-relaxed">{l.content as string}</p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                      <div className="flex flex-col items-center gap-2 mr-2">
                        <button onClick={() => toggleFavorite(l.id as string, l.isFavorite as boolean)} className="w-8 h-8 rounded-lg hover:bg-accent flex items-center justify-center transition-all">
                          <Heart className={`w-4 h-4 ${l.isFavorite ? "fill-rose-500 text-rose-500" : "text-muted-foreground"}`} />
                        </button>
                        <button onClick={() => setExpandedId(isExpanded ? null : l.id as string)} className="w-8 h-8 rounded-lg hover:bg-accent flex items-center justify-center transition-all">
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {filtered.length === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <BookOpen className="w-12 h-12 mb-3 opacity-50" />
          <p className="text-sm font-medium">لا توجد قوانين</p>
        </motion.div>
      )}
    </div>
  );
}
