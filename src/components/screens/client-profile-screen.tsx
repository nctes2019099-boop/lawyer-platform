"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAppStore } from "@/lib/store";
import { ArrowRight, User, Phone, Mail, MapPin, Briefcase, Crown, Star } from "lucide-react";

const categoryConfig: Record<string, { color: string; icon: React.ElementType; label: string }> = {
  عامة: { color: "text-emerald-600", icon: User, label: "عامة" },
  خاصة: { color: "text-amber-600", icon: Star, label: "خاصة" },
  VIP: { color: "text-primary", icon: Crown, label: "VIP" },
  تجاري: { color: "text-accent", icon: Briefcase, label: "تجاري" },
};

export function ClientProfileScreen() {
  const { selectedClientId, goBack } = useAppStore();
  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!selectedClientId) return;
    fetch(`/api/clients/${selectedClientId}`)
      .then((r) => r.json())
      .then((data) => { setClient(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [selectedClientId]);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 16, scale: 0.97 },
    show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-4 pt-16 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen p-4 pt-16 flex items-center justify-center">
        <p className="text-muted-foreground">الموكل غير موجود</p>
      </div>
    );
  }

  const cat = categoryConfig[client.category] || categoryConfig["عامة"];
  const CatIcon = cat.icon;

  return (
    <div className="min-h-screen p-4 pb-24 fingerprint-bg">
      <motion.div variants={containerVariants} initial="hidden" animate="show" className="max-w-lg mx-auto space-y-4">
        <motion.div variants={itemVariants} className="flex items-center gap-3">
          <button onClick={goBack} className="w-9 h-9 rounded-xl bg-secondary/50 flex items-center justify-center hover:bg-secondary transition-colors">
            <ArrowRight className="w-4 h-4" />
          </button>
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">الملف الشخصي</p>
            <h2 className="text-base font-bold truncate">{client.name}</h2>
          </div>
        </motion.div>

        {/* Profile Card */}
        <motion.div variants={itemVariants} className="legal-card rounded-2xl p-5 text-center">
          <div className="w-20 h-20 rounded-2xl seal-gold flex items-center justify-center mx-auto mb-3 shadow-lg">
            <span className="text-2xl font-bold text-white">{(client.name || "م").charAt(0)}</span>
          </div>
          <h3 className="text-lg font-bold">{client.name}</h3>
          <div className="flex items-center justify-center gap-2 mt-2">
            <span className={`text-xs px-2 py-1 rounded-md bg-secondary/50 ${cat.color} flex items-center gap-1`}>
              <CatIcon className="w-3 h-3" />{cat.label}
            </span>
          </div>
        </motion.div>

        {/* Contact Info */}
        <motion.div variants={itemVariants} className="legal-card rounded-2xl overflow-hidden">
          {client.phone && (
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border/40">
              <div className="w-9 h-9 rounded-xl bg-secondary/50 flex items-center justify-center">
                <Phone className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] text-muted-foreground">الهاتف</p>
                <p className="text-sm font-medium" dir="ltr">{client.phone}</p>
              </div>
            </div>
          )}
          {client.email && (
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border/40">
              <div className="w-9 h-9 rounded-xl bg-secondary/50 flex items-center justify-center">
                <Mail className="w-4 h-4 text-accent" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] text-muted-foreground">البريد</p>
                <p className="text-sm font-medium">{client.email}</p>
              </div>
            </div>
          )}
          {client.address && (
            <div className="flex items-center gap-3 px-4 py-3.5">
              <div className="w-9 h-9 rounded-xl bg-secondary/50 flex items-center justify-center">
                <MapPin className="w-4 h-4 text-destructive" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] text-muted-foreground">العنوان</p>
                <p className="text-sm font-medium">{client.address}</p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Cases */}
        {client.cases && client.cases.length > 0 && (
          <motion.div variants={itemVariants} className="legal-card rounded-2xl p-4">
            <p className="text-xs font-bold mb-3">القضايا المرتبطة ({client.cases.length})</p>
            <div className="space-y-2">
              {client.cases.map((c: any) => (
                <div key={c.id} className="flex items-center gap-2 p-2 rounded-xl bg-secondary/30">
                  <Briefcase className="w-4 h-4 text-primary" />
                  <p className="text-sm truncate">{c.title}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
