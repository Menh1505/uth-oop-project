import Card from "../ui/Card";
import Button from "../ui/Button";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import type { ExerciseTemplate } from "../../types";

export type ExerciseFormState = {
  date: string;
  time: string;
  templateId: string;
  name: string;
  duration: number;
  calories: number;
  notes: string;
};

type Props = {
  state: ExerciseFormState;
  templates: ExerciseTemplate[];
  templatesLoading: boolean;
  onChange: (patch: Partial<ExerciseFormState>) => void;
  onSubmit: () => void;
  onTemplateChange: (templateId: string) => void;
  onReloadTemplates: () => void;
  submitting: boolean;
};

export default function ExerciseForm({
  state,
  templates,
  templatesLoading,
  onChange,
  onSubmit,
  onTemplateChange,
  onReloadTemplates,
  submitting,
}: Props) {
  const disableSubmit =
    !state.name.trim() || state.duration <= 0 || state.calories < 0;

  return (
    <Card title="Công cụ buổi tập">
      <div className="space-y-6">
        <section className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Thiết lập buổi tập
          </h3>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <label className="text-sm">
              <span className="mb-1 block text-slate-500">Ngày</span>
              <Input
                type="date"
                value={state.date}
                onChange={(e) => onChange({ date: e.target.value })}
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-slate-500">Giờ bắt đầu</span>
              <Input
                type="time"
                value={state.time}
                onChange={(e) => onChange({ time: e.target.value })}
              />
            </label>
          </div>
          <label className="text-sm">
            <div className="mb-1 flex items-center justify-between text-slate-500">
              <span>Mẫu bài tập</span>
              <button
                type="button"
                className="text-xs font-semibold text-primary-600 hover:text-primary-700"
                onClick={onReloadTemplates}
                disabled={templatesLoading}
              >
                {templatesLoading ? "Đang tải..." : "Tải lại"}
              </button>
            </div>
            <Select
              value={state.templateId}
              onChange={(e) => onTemplateChange(e.target.value)}
            >
              <option value="">Chọn bài tập</option>
              {templates.map((tpl) => (
                <option key={tpl.id} value={tpl.id}>
                  {tpl.name}
                  {tpl.default_duration
                    ? ` • ${tpl.default_duration}p`
                    : ""}
                </option>
              ))}
            </Select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-slate-500">Tên bài tập</span>
            <Input
              placeholder="Ví dụ: Chạy bộ"
              value={state.name}
              onChange={(e) => onChange({ name: e.target.value })}
            />
          </label>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <label className="text-sm">
              <span className="mb-1 block text-slate-500">Thời lượng (phút)</span>
              <Input
                type="number"
                min={0}
                value={state.duration}
                onChange={(e) =>
                  onChange({ duration: Number(e.target.value) || 0 })
                }
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-slate-500">Calories đốt</span>
              <Input
                type="number"
                min={0}
                value={state.calories}
                onChange={(e) =>
                  onChange({ calories: Number(e.target.value) || 0 })
                }
              />
            </label>
          </div>
          <label className="text-sm">
            <span className="mb-1 block text-slate-500">Ghi chú</span>
            <textarea
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
              rows={4}
              value={state.notes}
              placeholder="Cảm nhận hoặc ghi chú nhanh..."
              onChange={(e) => onChange({ notes: e.target.value })}
            />
          </label>
        </section>
        <Button
          className="w-full"
          onClick={onSubmit}
          disabled={disableSubmit || submitting}
        >
          {submitting ? "Đang lưu..." : "Thêm buổi tập"}
        </Button>
      </div>
    </Card>
  );
}
