"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "@/lib/store";

export function PageTransition({ children }: { children: React.ReactNode }) {
  const { currentScreen } = useAppStore();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentScreen}
        initial={{ opacity: 0, x: 30, filter: "blur(10px)" }}
        animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
        exit={{ opacity: 0, x: -30, filter: "blur(10px)" }}
        transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
