import type { ExerciseSession } from "../../types";

type Props = {
  session: ExerciseSession;
};

export default function ExerciseCard({ session }: Props) {
  const startTime = session.start_time
    ? session.start_time.slice(0, 5)
    : session.created_at
      ? new Date(session.created_at).toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "--:--";

  return (
    <li className="relative pl-6">
      <span className="absolute left-0 top-2 inline-flex h-3 w-3 -translate-x-1/2 items-center justify-center">
        <span className="h-2.5 w-2.5 rounded-full bg-primary-500 ring-4 ring-primary-100" />
      </span>
      <div className="flex items-center justify-between text-sm text-slate-600">
        <span className="font-semibold text-slate-900">
          {session.exercise_name}
        </span>
        <span>{startTime}</span>
      </div>
      <div className="text-xs text-slate-500">
        {session.duration_minutes} phút • {session.calories_burned} kcal
      </div>
      {session.notes && (
        <div className="mt-1 text-xs text-slate-400">
          {session.notes}
        </div>
      )}
    </li>
  );
}
