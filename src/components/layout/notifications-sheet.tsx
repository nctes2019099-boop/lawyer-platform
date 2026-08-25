"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X, Check, Trash2, Info, AlertTriangle, CheckCircle2, Megaphone } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { getRelativeTime } from "@/lib/utils";
import { toast } from "react-hot-toast";

interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
}

const typeConfig: Record<string, { color: string; bg: string; icon: React.ElementType }> = {
  info: { color: "text-primary", bg: "bg-primary/10", icon: Info },
  warning: { color: "text-amber-600", bg: "bg-amber-100 dark:bg-amber-950/30", icon: AlertTriangle },
  success: { color: "text-emerald-600", bg: "bg-emerald-100 dark:bg-emerald-950/30", icon: CheckCircle2 },
  alert: { color: "text-rose-600", bg: "bg-rose-100 dark:bg-rose-950/30", icon: Megaphone },
};

export function NotificationsSheet() {
  const { notificationsOpen, setNotificationsOpen } = useAppStore();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((d: unknown) => setItems(Array.isArray(d) ? (d as AppNotification[]) : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (notificationsOpen) load();
  }, [notificationsOpen, load]);

  const markAllRead = async () => {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ read: true }) });
  };

  const remove = async (id: string) => {
    setDeletingId(id);
    const prev = items;
    setItems((p) => p.filter((n) => n.id !== id));
    try {
      const res = await fetch("/api/notifications", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
      if (!res.ok) { setItems(prev); toast.error("فشل الحذف"); }
    } catch {
      setItems(prev);
    } finally {
      setDeletingId(null);
    }
  };

  const clearAll = async () => {
    const prev = items;
    setItems([]);
    try {
      const res = await fetch("/api/notifications", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ clearAll: true }) });
      if (!res.ok) { setItems(prev); toast.error("فشل الحذف"); }
      else toast.success("تم حذف جميع الإشعارات");
    } catch {
      setItems(prev);
    }
  };

  const unread = items.filter((n) => !n.read);
  const read = items.filter((n) => n.read);

  return (
    <AnimatePresence>
      {notificationsOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setNotificationsOpen(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
          />
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className="fixed top-0 left-0 bottom-0 w-[360px] max-w-[88vw] bg-background border-r border-border z-50 flex flex-col"
          >
            {/* Header */}
            <div className="relative p-5 brand-emerald text-white overflow-hidden">
              <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-white/10" />
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  <h2 className="font-bold">الإشعارات</h2>
                  {unread.length > 0 && (
                    <span className="bg-white/20 text-white text-[10px] px-2 py-0.5 rounded-full">{unread.length} غير مقروء</span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {unread.length > 0 && (
                    <button onClick={markAllRead} className="w-8 h-8 rounded-lg hover:bg-white/15 flex items-center justify-center" title="تعليم الكل كمقروء">
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                  <button onClick={() => setNotificationsOpen(false)} className="w-8 h-8 rounded-lg hover:bg-white/15 flex items-center justify-center">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto scrollbar-none">
              {loading ? (
                <div className="p-4 space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-20 rounded-2xl bg-secondary/50 animate-pulse" />
                  ))}
                </div>
              ) : items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                  <div className="w-16 h-16 rounded-2xl bg-secondary/60 flex items-center justify-center mb-3">
                    <Bell className="w-7 h-7 text-muted-foreground/50" />
                  </div>
                  <p className="text-sm text-muted-foreground">لا توجد إشعارات</p>
                </div>
              ) : (
                <div className="p-3 space-y-3">
                  {unread.length > 0 && <Section title="جديد" items={unread} onRemove={remove} deletingId={deletingId} unread />}
                  {read.length > 0 && <Section title="سابق" items={read} onRemove={remove} deletingId={deletingId} />}
                </div>
              )}
            </div>

            {items.length > 0 && (
              <div className="p-3 border-t border-border">
                <button onClick={clearAll} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-destructive hover:bg-destructive/5 text-sm font-medium">
                  <Trash2 className="w-4 h-4" /> حذف جميع الإشعارات
                </button>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function Section({
  title,
  items,
  onRemove,
  deletingId,
  unread,
}: {
  title: string;
  items: AppNotification[];
  onRemove: (id: string) => void;
  deletingId: string | null;
  unread?: boolean;
}) {
  return (
    <div>
      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-2 mb-1.5">{title}</p>
      <div className="space-y-2">
        {items.map((n) => {
          const cfg = typeConfig[n.type] || typeConfig.info;
          const Icon = cfg.icon;
          return (
            <motion.div
              key={n.id}
              layout
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: deletingId === n.id ? 0 : 1, x: 0, height: deletingId === n.id ? 0 : "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className={`group relative rounded-2xl p-3 pr-4 border ${unread ? "bg-accent/40 border-primary/20" : "bg-card/60 border-border/50"}`}
            >
              <span className={`absolute right-0 top-3 bottom-3 w-[3px] rounded-l-full ${unread ? "bg-primary" : "bg-transparent"}`} />
              <div className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-xl ${cfg.bg} flex items-center justify-center shrink-0`}>
                  <Icon className={`w-4 h-4 ${cfg.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold leading-snug">{n.title}</p>
                    {unread && <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />}
                  </div>
                  <p className="text-[12px] text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                  <p className="text-[10px] text-muted-foreground/70 mt-1.5">{getRelativeTime(n.createdAt)}</p>
                </div>
                <button
                  onClick={() => onRemove(n.id)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                  aria-label="حذف"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
