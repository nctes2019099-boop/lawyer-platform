"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "@/lib/store";
import { CalendarDays, Plus, Clock, MapPin, Check, X, ChevronLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate, formatTime } from "@/lib/utils";
import toast from "react-hot-toast";

const typeColors: Record<string, string> = {
  "جلسة": "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300",
  "استشارة": "bg-violet-100 text-violet-700 dark:bg-violet-950/30 dark:text-violet-300",
  "اجتماع": "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300",
  "موعد محكمة": "bg-cyan-100 text-cyan-700 dark:bg-cyan-950/30 dark:text-cyan-300",
  "أخرى": "bg-muted text-muted-foreground",
};

const tabs = ["الكل", "قادمة", "مكتملة"];

export function AppointmentsScreen() {
  const { navigate, dialogOpen, setDialogOpen } = useAppStore();
  const [appointments, setAppointments] = useState<Record<string, unknown>[]>([]);
  const [activeTab, setActiveTab] = useState("الكل");
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newAppt, setNewAppt] = useState({ title: "", date: "", location: "", type: "جلسة", notes: "" });

  useEffect(() => {
    fetch("/api/appointments")
      .then(r => r.json())
      .then(data => { setAppointments(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (dialogOpen === "add") { setShowAddDialog(true); setDialogOpen(null); }
  }, [dialogOpen, setDialogOpen]);

  const filtered = appointments.filter(a => {
    if (activeTab === "الكل") return true;
    return (a as Record<string, string>).status === activeTab;
  });

  const grouped = filtered.reduce((acc: Record<string, any[]>, appt: any) => {
    const date = new Date(appt.date).toDateString();
    if (!acc[date]) acc[date] = [];
    acc[date].push(appt);
    return acc;
  }, {});

  const handleAdd = async () => {
    if (!newAppt.title || !newAppt.date) { toast.error("العنوان والتاريخ مطلوبان"); return; }
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newAppt, date: new Date(newAppt.date).toISOString() }),
      });
      if (res.ok) {
        toast.success("تم إضافة الموعد");
        setShowAddDialog(false);
        setNewAppt({ title: "", date: "", location: "", type: "جلسة", notes: "" });
        const updated = await fetch("/api/appointments").then(r => r.json());
        setAppointments(Array.isArray(updated) ? updated : []);
      }
    } catch { toast.error("فشل إضافة الموعد"); }
  };

  const handleComplete = async (id: string) => {
    try {
      await fetch(`/api/appointments/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "مكتملة" }) });
      toast.success("تم تحديث الحالة");
      const updated = await fetch("/api/appointments").then(r => r.json());
      setAppointments(Array.isArray(updated) ? updated : []);
    } catch { toast.error("فشل التحديث"); }
  };

  if (loading) return <div className="flex items-center justify-center h-[60vh]"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto pb-20">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="brand-gradient rounded-2xl p-5 text-white relative overflow-hidden">
        <div className="relative z-10 flex items-center justify-between">
          <div><h2 className="text-lg font-extrabold">المواعيد</h2><p className="text-white/70 text-xs mt-1">إدارة المواعيد والجلسات</p></div>
          <div className="w-12 h-12 bg-white/15 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20"><CalendarDays className="w-6 h-6" /></div>
        </div>
      </motion.div>

      <div className="flex gap-1 overflow-x-auto scrollbar-none pb-1">
        {tabs.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${activeTab === tab ? "bg-gradient-to-b from-white to-white/90 dark:from-white/10 dark:to-white/5 text-primary ring-1 ring-primary/10 shadow-sm" : "bg-muted text-muted-foreground hover:bg-accent"}`}>{tab}</button>
        ))}
      </div>

      <div className="space-y-4">
        {Object.entries(grouped).map(([date, appts]) => (
          <div key={date}>
            <h3 className="text-xs font-bold text-muted-foreground mb-2 px-1">
              {new Date(date).toLocaleDateString("ar-EG", { weekday: "long", day: "numeric", month: "short" })}
            </h3>
            <div className="space-y-2">
              {appts.map((appt, i) => {
                const a = appt as Record<string, string>;
                const isPast = new Date(a.date) < new Date();
                return (
                  <motion.div key={a.id || i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                    <Card className={`overflow-hidden ${isPast ? "opacity-60" : ""}`}>
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge className={`text-[10px] ${typeColors[a.type] || typeColors["أخرى"]} border-0`}>{a.type}</Badge>
                              {a.status === "مكتملة" && <Badge className="text-[10px] bg-emerald-100 text-emerald-700 border-0">مكتمل</Badge>}
                            </div>
                            <p className="text-sm font-bold">{a.title}</p>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" />{formatTime(a.date)}</span>
                              {a.location && <span className="text-[10px] text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" />{a.location}</span>}
                            </div>
                          </div>
                          {a.status === "قادمة" && (
                            <button onClick={() => handleComplete(a.id)} className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-600 hover:bg-emerald-200 transition-all">
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <CalendarDays className="w-12 h-12 mb-3 opacity-50" />
            <p className="text-sm font-medium">لا توجد مواعيد</p>
            <Button onClick={() => setShowAddDialog(true)} className="mt-4 brand-gradient" size="sm"><Plus className="w-4 h-4 ml-1" /> إضافة موعد</Button>
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {showAddDialog && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowAddDialog(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-card border border-border rounded-2xl p-5 w-full max-w-sm" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4"><h3 className="font-bold">موعد جديد</h3><button onClick={() => setShowAddDialog(false)}><X className="w-4 h-4" /></button></div>
              <div className="space-y-3">
                <div><label className="text-xs font-medium mb-1 block">العنوان *</label><input value={newAppt.title} onChange={e => setNewAppt({ ...newAppt, title: e.target.value })} className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20" placeholder="عنوان الموعد" /></div>
                <div><label className="text-xs font-medium mb-1 block">التاريخ والوقت *</label><input type="datetime-local" value={newAppt.date} onChange={e => setNewAppt({ ...newAppt, date: e.target.value })} className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20" /></div>
                <div><label className="text-xs font-medium mb-1 block">المكان</label><input value={newAppt.location} onChange={e => setNewAppt({ ...newAppt, location: e.target.value })} className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20" placeholder="مكان الموعد" /></div>
                <div><label className="text-xs font-medium mb-1 block">النوع</label><select value={newAppt.type} onChange={e => setNewAppt({ ...newAppt, type: e.target.value })} className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20"><option value="جلسة">جلسة</option><option value="استشارة">استشارة</option><option value="اجتماع">اجتماع</option><option value="موعد محكمة">موعد محكمة</option><option value="أخرى">أخرى</option></select></div>
                <Button onClick={handleAdd} className="w-full brand-gradient">حفظ الموعد</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
