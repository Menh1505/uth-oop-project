import Card from "../ui/Card";
import type { ExerciseSession } from "../../types";
import ExerciseCard from "./ExerciseCard";

type Props = {
  date: string;
  loading: boolean;
  totalDuration: number;
  totalCalories: number;
  sessions: ExerciseSession[];
};

const CALORIES_TARGET = 500;

export default function ExerciseSummary({
  date,
  loading,
  totalDuration,
  totalCalories,
  sessions,
}: Props) {
  const status = totalCalories > CALORIES_TARGET ? "Nặng" : "Tốt";
  const statusColor =
    status === "Tốt"
      ? "bg-green-100 text-green-700"
      : "bg-orange-100 text-orange-700";
  const progress = Math.min(100, (totalCalories / CALORIES_TARGET) * 100);

  return (
    <Card title="Tổng quan buổi tập trong ngày">
      <div className="space-y-5">
        <div>
          <p className="text-xs uppercase text-slate-500">
            Ngày đang theo dõi
          </p>
          <p className="text-lg font-semibold text-slate-900">{date}</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs uppercase text-slate-500">Thời lượng</p>
            <p className="text-2xl font-bold text-slate-900">
              {loading ? "--" : `${totalDuration} phút`}
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs uppercase text-slate-500">Calories</p>
            <p className="text-2xl font-bold text-slate-900">
              {loading ? "--" : `${totalCalories} kcal`}
            </p>
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Tiến độ calories</span>
            <span>
              {totalCalories}/{CALORIES_TARGET} kcal
            </span>
          </div>
          <div className="mt-2 h-2 rounded-full bg-slate-100">
            <div
              className={`h-2 rounded-full bg-gradient-to-r from-primary-400 to-primary-600 transition-all`}
              style={{ width: `${loading ? 0 : progress}%` }}
            />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-700">Trạng thái</p>
            <p className="text-xs text-slate-500">
              {status === "Tốt"
                ? "Cường độ hợp lý"
                : "Cần phục hồi thêm"}
            </p>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusColor}`}>
            {status}
          </span>
        </div>
        <div>
          <p className="text-xs uppercase text-slate-500">Timeline buổi tập</p>
          {loading ? (
            <div className="mt-3 space-y-3">
              {[0, 1, 2].map((idx) => (
                <div
                  key={idx}
                  className="h-10 w-full animate-pulse rounded-lg bg-slate-100"
                />
              ))}
            </div>
          ) : sessions.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">
              Chưa có buổi tập nào cho ngày này.
            </p>
          ) : (
            <ul className="mt-3 space-y-4 border-l border-slate-200 pl-4">
              {sessions.map((session) => (
                <ExerciseCard key={session.id} session={session} />
              ))}
            </ul>
          )}
        </div>
      </div>
    </Card>
  );
}
