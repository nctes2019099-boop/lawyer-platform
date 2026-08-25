"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "@/lib/store";
import { ArrowRight, Save, Mic, MicOff, Loader2, Square, Type } from "lucide-react";
import { toast } from "react-hot-toast";
import { createRecognition, isSpeechSupported } from "@/lib/voice";

export function NoteEditorScreen() {
  const { selectedNoteId, goBack } = useAppStore();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [interim, setInterim] = useState("");
  const [speechSupported, setSpeechSupported] = useState(true);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<ReturnType<typeof createRecognition> | null>(null);
  const baseContentRef = useRef("");

  useEffect(() => {
    setSpeechSupported(isSpeechSupported());
    if (selectedNoteId) {
      fetch(`/api/notes/${selectedNoteId}`)
        .then((r) => r.json())
        .then((data) => {
          setTitle(data.title || "");
          setContent(data.content || "");
        });
    }
  }, [selectedNoteId]);

  useEffect(() => () => stopRecording(), []);

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
      } else {
        toast.error("تعذّر الحفظ");
      }
    } catch {
      toast.error("حدث خطأ");
    } finally {
      setSaving(false);
    }
  };

  /* ===== مسار المتصفح: Web Speech API (الأفضل إن دُعم) ===== */
  const startBrowserSpeech = () => {
    const rec = createRecognition("ar-IQ");
    if (!rec) return false;
    baseContentRef.current = content ? content + (content.endsWith(" ") ? "" : " ") : "";
    rec.onresult = (event) => {
      let finalText = "";
      let interimText = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0]?.transcript || "";
        const isFinal = event.results[i].isFinal === true || i === event.results.length - 1;
        if (isFinal) {
          finalText += transcript;
        } else {
          interimText += transcript;
        }
      }
      if (finalText) {
        baseContentRef.current += finalText;
        setContent(baseContentRef.current);
      }
      setInterim(interimText);
    };
    rec.onerror = (e) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        toast.error("اسمح بالميكروفون من إعدادات المتصفح");
      } else if (e.error !== "no-speech" && e.error !== "aborted") {
        toast.error("تعذّر التعرف على الصوت");
      }
    };
    rec.onend = () => {
      // المستخدم هو من أوقف، أو انتهى الجلسة تلقائياً
      setRecording((prev) => {
        if (prev) {
          // أعد التشغيل تلقائياً لتسجيل مستمر (continuous) ما لم يوقف المستخدم
          try { rec.start(); return prev; } catch { /* ignore */ }
        }
        return false;
      });
      setInterim("");
    };
    try {
      rec.start();
      recognitionRef.current = rec;
      setRecording(true);
      return true;
    } catch {
      return false;
    }
  };

  /* ===== مسار الخادم: تسجيل صوتي ثم إرساله للمزود ===== */
  const startServerRecording = async () => {
    // تحقق مسبق من وجود واجهة الميكروفون (غالباً تتعطل داخل iframe).
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      const inIframe = typeof window !== "undefined" && window.self !== window.top;
      toast.error(
        inIframe
          ? "الميكروفون غير متاح داخل نافذة المعاينة. افتح التطبيق في تبويب مستقل."
          : "المتصفح لا يدعم تسجيل الصوت أو الميكروفون غير متاح.",
        { duration: 5000 }
      );
      return;
    }
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      const name = err instanceof DOMException ? err.name : "";
      const inIframe = typeof window !== "undefined" && window.self !== window.top;
      if (name === "NotAllowedError" || name === "SecurityError") {
        toast.error(
          inIframe
            ? "المعاينة داخل نافذة ولا تملك صلاحية المايك. افتح التطبيق في تبويب مستقل أو اسمح بالمايك من إعدادات المتصفح."
            : "اسمح بالميكروفون من إعدادات المتصفح لهذا الموقع.",
          { duration: 6000 }
        );
      } else if (name === "NotFoundError") {
        toast.error("لم يتم العثور على جهاز ميكروفون.");
      } else {
        toast.error("تعذّر الوصول إلى الميكروفون.");
      }
      return;
    }
    try {
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setTranscribing(true);
        try {
          const fd = new FormData();
          fd.append("audio", blob, "note.webm");
          fd.append("language", "ar");
          const res = await fetch("/api/notes/transcribe", { method: "POST", body: fd });
          const data = await res.json();
          if (res.ok && data.text) {
            setContent((c) => (c ? c + " " : "") + data.text);
            toast.success("تم التحويل");
          } else {
            toast.error(data.error || "خدمة التحويل غير متاحة");
          }
        } catch {
          toast.error("فشل رفع التسجيل");
        } finally {
          setTranscribing(false);
        }
      };
      mr.start();
      mediaRecorderRef.current = mr;
      setRecording(true);
    } catch {
      toast.error("تعذّر الوصول إلى الميكروفون");
    }
  };

  const startRecording = () => {
    if (speechSupported) {
      if (!startBrowserSpeech()) {
        void startServerRecording();
      }
    } else {
      void startServerRecording();
    }
  };

  const stopRecording = () => {
    setRecording(false);
    setInterim("");
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch { /* ignore */ }
      recognitionRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
  };

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

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

        {/* Title */}
        <div className="legal-card rounded-2xl p-4">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="عنوان المذكرة..."
            className="w-full text-lg font-bold bg-transparent border-0 outline-none placeholder:text-muted-foreground/50"
            dir="rtl"
          />
        </div>

        {/* Content */}
        <div className="legal-card rounded-2xl p-4 relative">
          <textarea
            value={content + (interim ? (content ? " " : "") + interim : "")}
            onChange={(e) => { setContent(e.target.value); baseContentRef.current = e.target.value; }}
            placeholder="اكتب محتوى المذكرة هنا، أو اضغط الميكروفون للإملاء الصوتي..."
            className="w-full h-72 bg-transparent border-0 outline-none resize-none text-sm leading-relaxed placeholder:text-muted-foreground/50"
            dir="rtl"
          />
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/40">
            <span className="text-[10px] text-muted-foreground/70 flex items-center gap-1">
              <Type className="w-3 h-3" /> {wordCount} كلمة
            </span>
            <motion.button
              onClick={recording ? stopRecording : startRecording}
              disabled={transcribing}
              className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg ${recording ? "bg-destructive" : "seal-gold"} disabled:opacity-70`}
              whileTap={{ scale: 0.9 }}
              title={speechSupported ? "إملاء صوتي مباشر" : "تسجيل ثم تحويل عبر الخادم"}
            >
              {recording ? <Square className="w-4 h-4 text-white" /> : <Mic className="w-5 h-5 text-white" />}
            </motion.button>
          </div>
        </div>
      </div>

      {/* Recording overlay */}
      <AnimatePresence>
        {recording && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center"
            onClick={stopRecording}
          >
            <div className="text-center">
              <motion.div
                className="w-20 h-20 rounded-full bg-destructive flex items-center justify-center mx-auto mb-4"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <Mic className="w-8 h-8 text-white" />
              </motion.div>
              <p className="text-white font-medium">جاري الاستماع...</p>
              <p className="text-white/60 text-sm mt-1 flex items-center justify-center gap-1.5">
                <MicOff className="w-3.5 h-3.5" /> اضغط للإيقاف
              </p>
              {interim && (
                <p className="mt-4 max-w-xs mx-auto text-white/80 text-sm italic">«{interim}»</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {transcribing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center"
          >
            <div className="text-center">
              <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-3" />
              <p className="text-white font-medium">جاري تحويل التسجيل إلى نص...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
