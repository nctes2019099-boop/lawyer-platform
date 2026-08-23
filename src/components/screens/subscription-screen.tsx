"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Crown, Check, CreditCard, Zap, Shield, Clock } from "lucide-react";
import { toast } from "react-hot-toast";

const plans = [
  { name: "مجاني", price: "0", period: "للأبد", features: ["5 قضايا", "10 موكلين", "دعم أساسي"], popular: false },
  { name: "احترافي", price: "25,000", period: "شهري", features: ["قضايا غير محدودة", "موكلين غير محدودين", "تقارير متقدمة", "دعم م priority"], popular: true },
  { name: "مؤسسي", price: "75,000", period: "شهري", features: ["كل شيء في الاحترافي", "عدة مستخدمين", "API access", "دعم 24/7"], popular: false },
];

export function SubscriptionScreen() {
  const [currentPlan, setCurrentPlan] = useState("مجاني");
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 16, scale: 0.97 },
    show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen p-4 pb-24 fingerprint-bg">
      <motion.div variants={containerVariants} initial="hidden" animate="show" className="max-w-lg mx-auto space-y-4">
        <motion.div variants={itemVariants}>
          <p className="text-xs text-muted-foreground">إدارة الاشتراك</p>
          <h2 className="text-lg font-bold text-foreground">الاشتراكات</h2>
        </motion.div>

        {/* Current Plan Badge */}
        <motion.div variants={itemVariants} className="legal-card rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl seal-gold flex items-center justify-center">
            <Crown className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold">الخطة الحالية</p>
            <p className="text-xs text-muted-foreground">{currentPlan}</p>
          </div>
          <span className="text-[10px] px-2 py-1 rounded-md bg-emerald-100 text-emerald-700 font-medium">نشط</span>
        </motion.div>

        {/* Plans */}
        <div className="space-y-3">
          {plans.map((plan) => (
            <motion.div
              key={plan.name}
              variants={itemVariants}
              className={`legal-card rounded-2xl p-5 relative ${plan.popular ? "ring-2 ring-primary/30" : ""}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full seal-gold text-white text-[10px] font-bold">
                  الأكثر شيوعاً
                </div>
              )}
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-bold">{plan.name}</h3>
                <div className="text-left">
                  <p className="text-xl font-bold number-magnify">{plan.price} <span className="text-xs font-normal text-muted-foreground">د.ع</span></p>
                  <p className="text-[10px] text-muted-foreground">/{plan.period}</p>
                </div>
              </div>
              <div className="gold-divider my-3" />
              <ul className="space-y-2 mb-4">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <motion.button
                onClick={() => { setCurrentPlan(plan.name); toast.success(`تم اختيار ${plan.name}`); }}
                className={`w-full h-10 rounded-xl text-sm font-medium transition-colors ${
                  currentPlan === plan.name
                    ? "bg-secondary text-muted-foreground cursor-default"
                    : "seal-gold text-white"
                }`}
                whileTap={currentPlan !== plan.name ? { scale: 0.96 } : undefined}
              >
                {currentPlan === plan.name ? "الخطة الحالية" : "اشترك الآن"}
              </motion.button>
            </motion.div>
          ))}
        </div>

        {/* Payment Methods */}
        <motion.div variants={itemVariants} className="legal-card rounded-2xl p-4">
          <p className="text-sm font-bold mb-3">طرق الدفع</p>
          <div className="flex gap-2">
            <div className="flex-1 flex items-center gap-2 p-3 rounded-xl bg-secondary/30 border border-primary/20">
              <CreditCard className="w-4 h-4 text-primary" />
              <span className="text-xs font-medium">بطاقة مصرفية</span>
            </div>
            <div className="flex-1 flex items-center gap-2 p-3 rounded-xl bg-secondary/30 border border-border">
              <Zap className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">زين كاش</span>
            </div>
          </div>
        </motion.div>

        {/* Security Note */}
        <motion.div variants={itemVariants} className="flex items-center gap-2 justify-center text-[10px] text-muted-foreground">
          <Shield className="w-3 h-3" />
          <span>مدفوعات آمنة ومشفرة</span>
        </motion.div>
      </motion.div>
    </div>
  );
}
