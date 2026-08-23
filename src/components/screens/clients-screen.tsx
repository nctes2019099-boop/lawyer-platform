"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "@/lib/store";
import {
  Users, Search, Plus, ChevronLeft, Phone, Mail, MapPin,
  Briefcase, Crown, Star, Filter, X, Check
} from "lucide-react";
import { toast } from "react-hot-toast";

const categoryConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  عامة: { label: "عامة", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300", icon: Users },
  خاصة: { label: "خاصة", color: "bg-violet-100 text-violet-700 dark:bg-violet-950/30 dark:text-violet-300", icon: Star },
  VIP: { label: "VIP", color: "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300", icon: Crown },
  تجاري: { label: "تجاري", color: "bg-cyan-100 text-cyan-700 dark:bg-cyan-950/30 dark:text-cyan-300", icon: Briefcase },
};

const tabs = ["الكل", "عامة", "خاصة", "VIP", "تجاري"];

interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  governorate?: string;
  category: string;
  createdAt: string;
}

export function ClientsScreen() {
  const { navigate, dialogOpen, setDialogOpen } = useAppStore();
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("الكل");
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newClient, setNewClient] = useState({
    name: "", email: "", phone: "", address: "", governorate: "", category: "عامة"
  });

  useEffect(() => {
    fetch("/api/clients")
      .then(r => r.json())
      .then((data: Client[]) => { setClients(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (dialogOpen === "add") { setShowAddDialog(true); setDialogOpen(null); }
  }, [dialogOpen, setDialogOpen]);

  const filtered = useMemo(() => {
    return clients.filter(c => {
      const matchesTab = activeTab === "الكل" || c.category === activeTab;
      const matchesSearch = !search || c.name?.includes(search) || c.phone?.includes(search);
      return matchesTab && matchesSearch;
    });
  }, [clients, activeTab, search]);

  const stats = useMemo(() => {
    const total = clients.length;
    const vip = clients.filter(c => c.category === "VIP").length;
    const newThisMonth = clients.filter(c => {
      const created = new Date(c.createdAt);
      const now = new Date();
      return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
    }).length;
    return { total, vip, newThisMonth };
  }, [clients]);

  const handleAddClient = async () => {
    if (!newClient.name) { toast.error("اسم الموكل مطلوب"); return; }
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newClient)
      });
      if (res.ok) {
        toast.success("تم إضافة الموكل بنجاح");
        setShowAddDialog(false);
        setNewClient({ name: "", email: "", phone: "", address: "", governorate: "", category: "عامة" });
        const updated = await fetch("/api/clients").then(r => r.json());
        setClients(Array.isArray(updated) ? updated : []);
      }
    } catch { toast.error("فشل إضافة الموكل"); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 pb-24 fingerprint-bg">
      <div className="max-w-lg mx-auto space-y-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="brand-gradient rounded-2xl p-5 text-white relative overflow-hidden"
        >
          <div className="absolute top-2 right-4 w-20 h-20 bg-white/5 rounded-full" />
          <div className="absolute bottom-2 left-4 w-16 h-16 bg-white/[0.07] rounded-full" />
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-extrabold">الموكلين</h2>
              <p className="text-white/70 text-xs mt-1">إدارة بيانات الموكلين</p>
            </div>
            <div className="w-12 h-12 bg-white/15 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20">
              <Users className="w-6 h-6" />
            </div>
          </div>
          <div className="relative z-10 flex gap-4 mt-4">
            <div><p className="text-2xl font-bold">{stats.total}</p><p className="text-[10px] text-white/60">الكل</p></div>
            <div><p className="text-2xl font-bold">{stats.vip}</p><p className="text-[10px] text-white/60">VIP</p></div>
            <div><p className="text-2xl font-bold">{stats.newThisMonth}</p><p className="text-[10px] text-white/60">جديد</p></div>
          </div>
        </motion.div>

        {/* Search + Add */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="البحث في الموكلين..."
              className="w-full h-11 pr-10 pl-4 rounded-xl bg-secondary/50 border-0 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
              dir="rtl"
            />
          </div>
          <motion.button
            onClick={() => setShowAddDialog(true)}
            className="w-11 h-11 rounded-xl seal-gold flex items-center justify-center shadow-md"
            whileTap={{ scale: 0.9 }}
          >
            <Plus className="w-5 h-5 text-white" />
          </motion.button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-1">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all ${
                activeTab === tab ? "bg-primary text-primary-foreground shadow-sm" : "bg-secondary text-muted-foreground hover:bg-secondary/80"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Clients List */}
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filtered.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
                <Users className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">لا يوجد موكلين</p>
              </motion.div>
            ) : (
              filtered.map((client, i) => {
                const cat = categoryConfig[client.category] || categoryConfig["عامة"];
                const CatIcon = cat.icon;
                return (
                  <motion.div
                    key={client.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="legal-card rounded-2xl p-4 hover-legal cursor-pointer"
                    onClick={() => navigate("client-profile", { clientId: client.id })}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl seal-gold flex items-center justify-center text-white font-bold text-sm">
                        {client.name?.charAt(0) || "م"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold truncate">{client.name}</p>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-md ${cat.color} flex items-center gap-0.5`}>
                            <CatIcon className="w-2.5 h-2.5" />{cat.label}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                          <Phone className="w-3 h-3" />{client.phone || "—"}
                        </p>
                      </div>
                      <ChevronLeft className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>

        {/* Add Dialog */}
        <AnimatePresence>
          {showAddDialog && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center"
              onClick={() => setShowAddDialog(false)}
            >
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="bg-card w-full max-w-lg rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}
              >
                <div className="w-12 h-1 bg-border rounded-full mx-auto mb-6" />
                <h3 className="text-lg font-bold mb-4">إضافة موكل جديد</h3>
                <div className="space-y-3">
                  <input
                    type="text"
                    value={newClient.name}
                    onChange={e => setNewClient({ ...newClient, name: e.target.value })}
                    placeholder="اسم الموكل *"
                    className="w-full h-12 px-4 rounded-xl bg-secondary/50 border-0 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                    dir="rtl"
                  />
                  <input
                    type="tel"
                    value={newClient.phone}
                    onChange={e => setNewClient({ ...newClient, phone: e.target.value })}
                    placeholder="رقم الهاتف"
                    className="w-full h-12 px-4 rounded-xl bg-secondary/50 border-0 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                    dir="rtl"
                  />
                  <input
                    type="email"
                    value={newClient.email}
                    onChange={e => setNewClient({ ...newClient, email: e.target.value })}
                    placeholder="البريد الإلكتروني"
                    className="w-full h-12 px-4 rounded-xl bg-secondary/50 border-0 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                    dir="rtl"
                  />
                  <input
                    type="text"
                    value={newClient.address}
                    onChange={e => setNewClient({ ...newClient, address: e.target.value })}
                    placeholder="العنوان"
                    className="w-full h-12 px-4 rounded-xl bg-secondary/50 border-0 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                    dir="rtl"
                  />
                  <select
                    value={newClient.category}
                    onChange={e => setNewClient({ ...newClient, category: e.target.value })}
                    className="w-full h-12 px-4 rounded-xl bg-secondary/50 border-0 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                    dir="rtl"
                  >
                    {tabs.slice(1).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <motion.button
                    onClick={handleAddClient}
                    className="w-full h-12 rounded-xl seal-gold text-white font-semibold text-sm"
                    whileTap={{ scale: 0.96 }}
                  >
                    إضافة الموكل
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
