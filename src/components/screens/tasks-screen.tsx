"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "@/lib/store";
import {
  CheckSquare, Plus, Search, Filter, ArrowLeft, Trash2, Edit3,
  Clock, Calendar, AlertCircle, CheckCircle2, Circle, Timer,
  Briefcase, X, ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: string | null;
  completedAt: string | null;
  caseId: string | null;
  case: { id: string; title: string; caseNumber: string } | null;
  createdAt: string;
}

export function TasksScreen() {
  const { navigate } = useAppStore();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [showAdd, setShowAdd] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "عادية",
    dueDate: "",
    caseId: "",
  });

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/tasks");
      const data = await res.json();
      setTasks(Array.isArray(data) ? data : []);
    } catch {
      toast.error("فشل تحميل المهام");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const filtered = tasks.filter((t) => {
    const matchSearch = t.title.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || t.status === filterStatus;
    const matchPriority = filterPriority === "all" || t.priority === filterPriority;
    return matchSearch && matchStatus && matchPriority;
  });

  const pendingCount = tasks.filter((t) => t.status === "pending").length;
  const completedCount = tasks.filter((t) => t.status === "completed").length;
  const overdueCount = tasks.filter((t) => {
    if (t.status === "completed" || !t.dueDate) return false;
    return new Date(t.dueDate) < new Date();
  }).length;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;

    const url = editingTask ? `/api/tasks/${editingTask.id}` : "/api/tasks";
    const method = editingTask ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        toast.success(editingTask ? "تم التحديث" : "تمت الإضافة");
        setShowAdd(false);
        setEditingTask(null);
        setForm({ title: "", description: "", priority: "عادية", dueDate: "", caseId: "" });
        fetchTasks();
      } else {
        toast.error("فشل الحفظ");
      }
    } catch {
      toast.error("خطأ في الاتصال");
    }
  }

  async function toggleStatus(task: Task) {
    const newStatus = task.status === "completed" ? "pending" : "completed";
    try {
      await fetch(`/api/tasks/${task.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...task, status: newStatus }),
      });
      fetchTasks();
    } catch {
      toast.error("فشل التحديث");
    }
  }

  async function deleteTask(id: string) {
    if (!confirm("هل أنت متأكد من الحذف؟")) return;
    try {
      await fetch(`/api/tasks/${id}`, { method: "DELETE" });
      toast.success("تم الحذف");
      fetchTasks();
    } catch {
      toast.error("فشل الحذف");
    }
  }

  function openEdit(task: Task) {
    setEditingTask(task);
    setForm({
      title: task.title,
      description: task.description || "",
      priority: task.priority,
      dueDate: task.dueDate ? task.dueDate.split("T")[0] : "",
      caseId: task.caseId || "",
    });
    setShowAdd(true);
  }

  const priorityColor = (p: string) => {
    if (p === "حرجة") return "bg-destructive text-white";
    if (p === "عاجلة") return "bg-orange-500 text-white";
    return "bg-emerald-500 text-white";
  };

  return (
    <div className="min-h-screen pb-24">
      <div className="sticky top-16 z-30 glass-legal border-b border-border/50">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate("dashboard")} className="p-2 rounded-xl hover:bg-secondary transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-lg font-bold flex items-center gap-2">
                  <CheckSquare className="w-5 h-5 text-primary" />
                  المهام
                </h1>
                <p className="text-xs text-muted-foreground">إدارة المهام والمواعيد النهائية</p>
              </div>
            </div>
            <Button size="sm" onClick={() => { setEditingTask(null); setForm({ title: "", description: "", priority: "عادية", dueDate: "", caseId: "" }); setShowAdd(true); }} className="seal-gold text-white rounded-xl">
              <Plus className="w-4 h-4 ml-1" />
              مهمة جديدة
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="legal-card rounded-xl p-2 text-center">
              <p className="text-lg font-bold text-primary">{pendingCount}</p>
              <p className="text-[10px] text-muted-foreground">قيد الانتظار</p>
            </div>
            <div className="legal-card rounded-xl p-2 text-center">
              <p className="text-lg font-bold text-emerald-600">{completedCount}</p>
              <p className="text-[10px] text-muted-foreground">مكتملة</p>
            </div>
            <div className="legal-card rounded-xl p-2 text-center">
              <p className="text-lg font-bold text-destructive">{overdueCount}</p>
              <p className="text-[10px] text-muted-foreground">متأخرة</p>
            </div>
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="بحث في المهام..." className="pr-9 rounded-xl bg-secondary/50" />
            </div>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="rounded-xl bg-secondary/50 px-3 text-sm border border-border">
              <option value="all">الكل</option>
              <option value="pending">قيد الانتظار</option>
              <option value="completed">مكتملة</option>
            </select>
            <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)} className="rounded-xl bg-secondary/50 px-3 text-sm border border-border">
              <option value="all">الأولوية</option>
              <option value="حرجة">حرجة</option>
              <option value="عاجلة">عاجلة</option>
              <option value="عادية">عادية</option>
            </select>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 pt-4 space-y-3">
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">جاري التحميل...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <CheckSquare className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">لا توجد مهام</p>
          </div>
        ) : (
          <AnimatePresence>
            {filtered.map((task) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className={`legal-card rounded-2xl p-4 ${task.status === "completed" ? "opacity-60" : ""}`}
              >
                <div className="flex items-start gap-3">
                  <button onClick={() => toggleStatus(task)} className="mt-1">
                    {task.status === "completed" ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <Circle className="w-5 h-5 text-muted-foreground" />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className={`font-bold text-sm ${task.status === "completed" ? "line-through text-muted-foreground" : ""}`}>{task.title}</h3>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${priorityColor(task.priority)}`}>{task.priority}</span>
                    </div>
                    {task.description && <p className="text-xs text-muted-foreground mt-1">{task.description}</p>}
                    <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground">
                      {task.dueDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(task.dueDate).toLocaleDateString("ar-IQ")}
                        </span>
                      )}
                      {task.case && (
                        <span className="flex items-center gap-1">
                          <Briefcase className="w-3 h-3" />
                          {task.case.caseNumber}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(task)} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
                      <Edit3 className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <button onClick={() => deleteTask(task.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors">
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-4"
            onClick={() => setShowAdd(false)}
          >
            <motion.div
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-background rounded-3xl p-6 w-full max-w-md space-y-4"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">{editingTask ? "تعديل مهمة" : "مهمة جديدة"}</h2>
                <button onClick={() => setShowAdd(false)} className="p-2 rounded-xl hover:bg-secondary">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-3">
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="عنوان المهمة" required />
                <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="وصف (اختياري)" />
                <div className="grid grid-cols-2 gap-2">
                  <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="rounded-xl bg-secondary/50 px-3 py-2 text-sm border border-border">
                    <option value="عادية">عادية</option>
                    <option value="عاجلة">عاجلة</option>
                    <option value="حرجة">حرجة</option>
                  </select>
                  <Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
                </div>
                <Button type="submit" className="w-full seal-gold text-white rounded-xl">
                  {editingTask ? "تحديث" : "إضافة"}
                </Button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
