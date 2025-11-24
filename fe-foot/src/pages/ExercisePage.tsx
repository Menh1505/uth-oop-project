import { useCallback, useEffect, useMemo, useState } from "react";
import ExerciseForm, {
  type ExerciseFormState,
} from "../components/exercise/ExerciseForm";
import ExerciseSummary from "../components/exercise/ExerciseSummary";
import { Input } from "../components/ui/Input";
import Button from "../components/ui/Button";
import type {
  ExerciseSession,
  ExerciseTemplate,
} from "../types";
import {
  createExerciseSession,
  getDailyExerciseSummary,
  getExerciseTemplates,
} from "../lib/api/exerciseApi";

const DEFAULT_DURATION = 30;
const DEFAULT_CALORIES = 200;

type ToastState = {
  type: "success" | "error";
  message: string;
};

const todayISO = () => new Date().toISOString().slice(0, 10);
const nowTime = () => new Date().toISOString().slice(11, 16);

export default function ExercisePage() {
  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [formState, setFormState] = useState<ExerciseFormState>({
    date: todayISO(),
    time: nowTime(),
    templateId: "",
    name: "",
    duration: DEFAULT_DURATION,
    calories: DEFAULT_CALORIES,
    notes: "",
  });
  const [templates, setTemplates] = useState<ExerciseTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [sessions, setSessions] = useState<ExerciseSession[]>([]);
  const [totalDuration, setTotalDuration] = useState(0);
  const [totalCalories, setTotalCalories] = useState(0);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = (payload: ToastState) => {
    setToast(payload);
  };

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2800);
    return () => clearTimeout(timer);
  }, [toast]);

  const fetchTemplates = useCallback(async () => {
    setTemplatesLoading(true);
    try {
      const list = await getExerciseTemplates();
      setTemplates(list);
    } catch (error) {
      console.error("Tải mẫu bài tập thất bại", error);
      showToast({ type: "error", message: "Không tải được mẫu bài tập" });
    } finally {
      setTemplatesLoading(false);
    }
  }, []);

  const fetchSummary = useCallback(async (date: string) => {
    setSummaryLoading(true);
    try {
      const summary = await getDailyExerciseSummary(date);
      setSessions(summary.sessions);
      setTotalDuration(summary.total_duration);
      setTotalCalories(summary.total_calories);
    } catch (error) {
      console.error("Tải tổng quan tập luyện thất bại", error);
      setSessions([]);
      setTotalDuration(0);
      setTotalCalories(0);
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  useEffect(() => {
    fetchSummary(selectedDate);
  }, [fetchSummary, selectedDate]);

  const handleFormChange = (patch: Partial<ExerciseFormState>) => {
    setFormState((prev) => ({ ...prev, ...patch }));
    if (patch.date) {
      setSelectedDate(patch.date);
    }
  };

  const handleTemplateChange = (templateId: string) => {
    const template = templates.find((tpl) => tpl.id === templateId);
    setFormState((prev) => ({
      ...prev,
      templateId,
      name: template?.name ?? prev.name,
      duration:
        template?.default_duration !== null &&
        template?.default_duration !== undefined
          ? template.default_duration
          : prev.duration || DEFAULT_DURATION,
      calories:
        template?.default_calories !== null &&
        template?.default_calories !== undefined
          ? template.default_calories
          : prev.calories || DEFAULT_CALORIES,
    }));
  };

  const handleSubmit = async () => {
    if (submitting) return;
    const trimmedName = formState.name.trim();
    if (!trimmedName || formState.duration <= 0 || formState.calories < 0) {
      showToast({ type: "error", message: "Thông tin buổi tập chưa hợp lệ" });
      return;
    }
    const template = formState.templateId
      ? templates.find((tpl) => tpl.id === formState.templateId)
      : undefined;

    setSubmitting(true);
    try {
      await createExerciseSession({
        exercise_name: trimmedName,
        date: formState.date,
        start_time: formState.time,
        duration_minutes: formState.duration,
        calories_burned: formState.calories,
        notes: formState.notes || undefined,
        template_id: formState.templateId || undefined,
        intensity: template?.intensity || undefined,
        exercise_type: template?.exercise_type || undefined,
      });
      showToast({ type: "success", message: "Đã ghi nhận buổi tập" });
      setSelectedDate(formState.date);
      setFormState((prev) => ({
        ...prev,
        name: "",
        notes: "",
        templateId: "",
        time: nowTime(),
        duration: DEFAULT_DURATION,
        calories: DEFAULT_CALORIES,
      }));
      fetchSummary(formState.date);
    } catch (error) {
      console.error("Không thể lưu buổi tập", error);
      showToast({ type: "error", message: "Không thể lưu buổi tập" });
    } finally {
      setSubmitting(false);
    }
  };

  const headerSubtitle = useMemo(() => {
    if (summaryLoading) return "Đang tổng hợp dữ liệu...";
    if (sessions.length === 0) return "Chưa có buổi tập nào";
    return `${sessions.length} buổi trong ngày`;
  }, [sessions.length, summaryLoading]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Buổi tập</h1>
          <p className="text-sm text-slate-500">{headerSubtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => handleFormChange({ date: e.target.value })}
          />
          <Button variant="ghost" onClick={() => handleFormChange({ date: todayISO() })}>
            Hôm nay
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="flex-1">
          <ExerciseForm
            state={formState}
            templates={templates}
            templatesLoading={templatesLoading}
            onChange={handleFormChange}
            onSubmit={handleSubmit}
            onTemplateChange={handleTemplateChange}
            onReloadTemplates={fetchTemplates}
            submitting={submitting}
          />
        </div>
        <div className="w-full lg:w-[360px]">
          <ExerciseSummary
            date={selectedDate}
            loading={summaryLoading}
            totalDuration={totalDuration}
            totalCalories={totalCalories}
            sessions={sessions}
          />
        </div>
      </div>

      {toast && (
        <div className="fixed right-6 bottom-6 z-50">
          <div
            className={`rounded-2xl px-4 py-3 text-sm shadow-lg ${
              toast.type === "success"
                ? "bg-emerald-600 text-white"
                : "bg-rose-600 text-white"
            }`}
          >
            {toast.message}
          </div>
        </div>
      )}
    </div>
  );
}
