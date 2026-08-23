"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAppStore } from "@/lib/store";
import { ArrowRight, Save, Mic, MicOff, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";

export function NoteEditorScreen() {
  const { selectedNoteId, goBack } = useAppStore();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);

  useEffect(() => {
    if (selectedNoteId) {
      fetch(`/api/notes/${selectedNoteId}`)
        .then((r) => r.json())
        .then((data) => {
          setTitle(data.title || "");
          setContent(data.content || "");
        });
    }
  }, [selectedNoteId]);

  const save = async () => {
    if (!title.trim()) { toast.error("أدخل عنواناً"); return; }
    setSaving(true);
    try {
      const url = selectedNoteId ? `/api/notes/${selectedNoteId}` : "/api/notes";
      const method = selectedNoteId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content }),
      });
      if (res.ok) {
        toast.success(selectedNoteId ? "تم التحديث" : "تم الإنشاء");
        goBack();
      }
    } catch { toast.error("حدث خطأ"); }
    finally { setSaving(false); }
  };

  const toggleRecording = () => {
    if (recording) {
      setRecording(false);
      setTranscribing(true);
      setTimeout(() => { setTranscribing(false); toast.success("تم التحويل"); }, 2000);
    } else {
      setRecording(true);
    }
  };

  return (
    <div className="min-h-screen p-4 pb-24 fingerprint-bg">
      <div className="max-w-lg mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={goBack} className="w-9 h-9 rounded-xl bg-secondary/50 flex items-center justify-center hover:bg-secondary transition-colors">
            <ArrowRight className="w-4 h-4" />
          </button>
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">المفكرة</p>
            <h2 className="text-base font-bold">{selectedNoteId ? "تعديل" : "مذكرة جديدة"}</h2>
          </div>
          <motion.button
            onClick={save}
            disabled={saving}
            className="w-10 h-10 rounded-xl seal-gold flex items-center justify-center shadow-md disabled:opacity-70"
            whileTap={{ scale: 0.9 }}
          >
            {saving ? <Loader2 className="w-5 h-5 text-white animate-spin" /> : <Save className="w-5 h-5 text-white" />}
          </motion.button>
        </div>

        {/* Title Input */}
        <div className="legal-card rounded-2xl p-4">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="عنوان المذكرة..."
            className="w-full text-lg font-bold bg-transparent border-0 outline-none placeholder:text-muted-foreground/50"
            dir="rtl"
          />
        </div>

        {/* Content Area */}
        <div className="legal-card rounded-2xl p-4 relative">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="اكتب محتوى المذكرة هنا..."
            className="w-full h-64 bg-transparent border-0 outline-none resize-none text-sm leading-relaxed placeholder:text-muted-foreground/50"
            dir="rtl"
          />
          {/* Voice Button */}
          <motion.button
            onClick={toggleRecording}
            className={`absolute bottom-4 left-4 w-12 h-12 rounded-full flex items-center justify-center shadow-lg ${recording ? "bg-destructive" : "seal-gold"}`}
            whileTap={{ scale: 0.9 }}
          >
            {recording ? <MicOff className="w-5 h-5 text-white" /> : <Mic className="w-5 h-5 text-white" />}
          </motion.button>
        </div>

        {/* Recording Overlay */}
        {recording && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center"
          >
            <div className="text-center">
              <motion.div
                className="w-20 h-20 rounded-full bg-destructive flex items-center justify-center mx-auto mb-4"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <Mic className="w-8 h-8 text-white" />
              </motion.div>
              <p className="text-white font-medium">جاري التسجيل...</p>
              <p className="text-white/60 text-sm mt-1">اضغط لإيقاف التسجيل</p>
            </div>
          </motion.div>
        )}

        {/* Transcribing Overlay */}
        {transcribing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center"
          >
            <div className="text-center">
              <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-3" />
              <p className="text-white font-medium">جاري التحويل...</p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
