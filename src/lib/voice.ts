"use client";

/**
 * إدخال صوتي يعمل في المتصفح باستخدام Web Speech API.
 * يعود بالـ recognition (أو null إذا كان المتصفح لا يدعمه).
 */

type AnySpeechRecognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
};

type SpeechRecognitionResultLike = ArrayLike<{ transcript: string }> & { isFinal?: boolean };
type SpeechRecognitionEventLike = {
  results: ArrayLike<SpeechRecognitionResultLike>;
  resultIndex: number;
};

declare global {
  interface Window {
    SpeechRecognition?: new () => AnySpeechRecognition;
    webkitSpeechRecognition?: new () => AnySpeechRecognition;
  }
}

export function isSpeechSupported(): boolean {
  if (typeof window === "undefined") return false;
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

export function createRecognition(lang = "ar-IQ"): AnySpeechRecognition | null {
  if (typeof window === "undefined") return null;
  const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Ctor) return null;
  const rec = new Ctor();
  rec.lang = lang;
  rec.continuous = true;
  rec.interimResults = true;
  rec.maxAlternatives = 1;
  return rec;
}
