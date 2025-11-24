import { useEffect, useMemo, useState } from "react";
import Card from "../../components/ui/Card";
import { Select } from "../../components/ui/Select";
import { useAppStore } from "../../store/useAppStore";
import { ApiClient } from "../../lib/api/client";
import type {
  HabitScoreResponse,
  HealthSummaryResponse,
  WorkoutWeekSummary,
} from "../../types/analytics";

const RANGE_OPTIONS = [
  { value: "7d", label: "7 ngày" },
  { value: "30d", label: "30 ngày" },
  { value: "90d", label: "90 ngày" },
] as const;

type RangeValue = (typeof RANGE_OPTIONS)[number]["value"];

type LineSeries = {
  key: string;
  label: string;
  color: string;
};

type ChartPoint = {
  date: string;
  [key: string]: number | string;
};

export default function HealthDashboard() {
  const { profile } = useAppStore();
  const userId = profile?.user_id;
  const [range, setRange] = useState<RangeValue>("7d");
  const [healthSummary, setHealthSummary] = useState<HealthSummaryResponse | null>(null);
  const [habitScore, setHabitScore] = useState<HabitScoreResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const [healthRes, habitRes] = await Promise.all([
          ApiClient.get<HealthSummaryResponse>(
            `/analytics/users/${userId}/health-summary?range=${range}`
          ),
          ApiClient.get<HabitScoreResponse>(
            `/analytics/users/${userId}/habit-score?from=${formatDateForApi(
              startOfMonth
            )}&to=${formatDateForApi(today)}`
          ),
        ]);
        setHealthSummary(healthRes);
        setHabitScore(habitRes);
      } catch (err) {
        console.error("Health dashboard error", err);
        setError(err instanceof Error ? err.message : "Không thể tải dữ liệu");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId, range]);

  const caloriesChartData = useMemo<ChartPoint[]>(() => {
    if (!healthSummary?.daily) return [];
    return healthSummary.daily.map((d) => ({
      date: d.date,
      caloriesIn: d.caloriesIn,
      caloriesOut: d.caloriesOut,
      calorieBalance: d.calorieBalance,
    }));
  }, [healthSummary]);

  const healthScoreChart = useMemo<ChartPoint[]>(() => {
    if (!healthSummary?.daily) return [];
    return healthSummary.daily.map((d) => ({
      date: d.date,
      healthScore: d.healthScore,
    }));
  }, [healthSummary]);

  const weightTrendChart = useMemo<ChartPoint[]>(() => {
    if (!healthSummary?.weightTrend?.length) return [];
    return healthSummary.weightTrend.map((point) => ({
      date: point.date,
      weight: point.weight,
    }));
  }, [healthSummary]);

  const workoutWeekly = useMemo(
    () => healthSummary?.workoutSessionsPerWeek ?? [],
    [healthSummary]
  );

  const macro = healthSummary?.macroBreakdown;
  const summaryCards = getSummaryCards(healthSummary, habitScore);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-blue-600">FitFood Analytics</p>
          <h1 className="text-2xl font-semibold">My Health &amp; Habit Dashboard</h1>
          <p className="text-sm text-gray-500">
            Tổng hợp dinh dưỡng, luyện tập và thói quen dựa trên dữ liệu đồng bộ
          </p>
        </div>
        <label className="text-sm text-gray-600 flex items-center gap-2">
          Khoảng thời gian
          <Select value={range} onChange={(e) => setRange(e.target.value as RangeValue)}>
            {RANGE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </label>
      </header>

      {!userId && (
        <Card>
          <p className="text-sm text-gray-500">Đang tải thông tin người dùng…</p>
        </Card>
      )}

      {error && <AlertBanner message={error} />}

      {loading ? (
        <Card>
          <p className="text-sm text-gray-500">Đang đồng bộ dữ liệu phân tích…</p>
        </Card>
      ) : (
        <>
          {summaryCards.length ? (
            <section className="grid gap-4 md:grid-cols-3">
              {summaryCards.map((card) => (
                <Card key={card.title} title={card.title}>
                  <p className="text-3xl font-semibold text-gray-900">
                    {card.value}
                  </p>
                  <p className="text-sm text-gray-500">{card.caption}</p>
                </Card>
              ))}
            </section>
          ) : (
            <Card>
              <p className="text-sm text-gray-500">
                Chưa có dữ liệu đủ để hiển thị tổng quan.
              </p>
            </Card>
          )}

          <Card title="Calories &amp; Balance">
            {caloriesChartData.length ? (
              <LineChart
                data={caloriesChartData}
                series={[
                  { key: "caloriesIn", label: "Calories In", color: "#2563eb" },
                  { key: "caloriesOut", label: "Calories Out", color: "#16a34a" },
                  { key: "calorieBalance", label: "Cân bằng", color: "#f97316" },
                ]}
              />
            ) : (
              <EmptyState message="Chưa có dữ liệu calories cho khoảng thời gian này." />
            )}
          </Card>

          <section className="grid gap-4 md:grid-cols-2">
            <Card title="Health Score">
              {healthScoreChart.length ? (
                <LineChart
                  data={healthScoreChart}
                  series={[{ key: "healthScore", label: "Điểm", color: "#7c3aed" }]}
                  yRange={{ min: 0, max: 100 }}
                />
              ) : (
                <EmptyState message="Chưa có điểm sức khỏe." />
              )}
            </Card>
            <Card title="Weight Trend">
              {weightTrendChart.length ? (
                <LineChart
                  data={weightTrendChart}
                  series={[{ key: "weight", label: "Cân nặng (kg)", color: "#0ea5e9" }]}
                />
              ) : (
                <EmptyState message="Chưa ghi nhận cân nặng trong thời gian này." />
              )}
            </Card>
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            <Card title="Workout Sessions / Tuần">
              {workoutWeekly.length ? (
                <WorkoutBarChart data={workoutWeekly} />
              ) : (
                <EmptyState message="Chưa có buổi tập nào được ghi nhận." />
              )}
            </Card>
            <Card title="Macro Breakdown">
              {macro ? (
                <MacroBreakdown macro={macro} />
              ) : (
                <EmptyState message="Chưa có dữ liệu macro." />
              )}
            </Card>
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            <Card title="Thói quen nổi bật">
              {habitScore?.daily?.length ? (
                <HabitHighlights habits={habitScore} />
              ) : (
                <EmptyState message="Chưa có dữ liệu streak." />
              )}
            </Card>
            <Card title="Insights">
              {healthSummary?.insights?.length ? (
                <ul className="space-y-2 text-sm">
                  {healthSummary.insights.map((insight) => (
                    <li key={insight} className="flex gap-2">
                      <span className="text-blue-500">•</span>
                      <span>{insight}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState message="Chúng tôi sẽ đưa ra gợi ý khi có đủ dữ liệu." />
              )}
            </Card>
          </section>
        </>
      )}
    </div>
  );
}

function AlertBanner({ message }: { message: string }) {
  return (
    <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
      {message}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return <p className="text-sm text-gray-500">{message}</p>;
}

function LineChart({
  data,
  series,
  height = 220,
  yRange,
}: {
  data: ChartPoint[];
  series: LineSeries[];
  height?: number;
  yRange?: { min: number; max: number };
}) {
  if (!data.length) return null;
  const width = Math.max((data.length - 1) * 80, 120);
  const values = series.flatMap((s) => data.map((point) => Number(point[s.key] ?? 0)));
  const minValue = yRange?.min ?? Math.min(...values);
  const maxValue = yRange?.max ?? Math.max(...values);
  const adjustedMin = minValue === maxValue ? minValue - 10 : minValue;
  const adjustedMax = minValue === maxValue ? maxValue + 10 : maxValue;
  const range = adjustedMax - adjustedMin || 1;

  return (
    <div className="space-y-3">
      <div className="h-60 w-full">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
          className="h-full w-full"
        >
          {series.map((serie) => {
            const path = data
              .map((point, idx) => {
                const x = data.length === 1 ? width / 2 : (idx / (data.length - 1)) * width;
                const value = Number(point[serie.key] ?? 0);
                const y = height - ((value - adjustedMin) / range) * height;
                return `${x},${y}`;
              })
              .join(" ");
            return (
              <polyline
                key={serie.key}
                fill="none"
                stroke={serie.color}
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                points={path}
                opacity={0.9}
              />
            );
          })}
        </svg>
      </div>
      <div className="flex flex-wrap gap-4 text-xs">
        {series.map((serie) => (
          <span key={serie.key} className="flex items-center gap-2 font-medium">
            <span className="h-2 w-6 rounded-full" style={{ backgroundColor: serie.color }} />
            {serie.label}
          </span>
        ))}
      </div>
      <div className="flex flex-wrap gap-2 text-xs text-gray-500">
        {data.map((point) => (
          <span key={point.date}>{formatDateLabel(point.date)}</span>
        ))}
      </div>
    </div>
  );
}

function WorkoutBarChart({ data }: { data: WorkoutWeekSummary[] }) {
  const maxSessions = Math.max(...data.map((d) => d.sessions), 1);
  return (
    <div className="flex h-56 items-end justify-between gap-3">
      {data.map((week) => {
        const heightPercent = (week.sessions / maxSessions) * 100;
        return (
          <div key={week.weekStart} className="flex-1 text-center">
            <div className="rounded-t-lg bg-blue-500" style={{ height: `${heightPercent}%` }} />
            <p className="mt-2 text-xs font-medium text-gray-600">
              {formatWeekLabel(week.weekStart)}
            </p>
            <p className="text-xs text-gray-500">{week.sessions} buổi</p>
          </div>
        );
      })}
    </div>
  );
}

function MacroBreakdown({ macro }: { macro: HealthSummaryResponse["macroBreakdown"] }) {
  const total = macro.proteinPercentage + macro.carbPercentage + macro.fatPercentage;
  return (
    <div className="space-y-4">
      <div className="flex h-4 overflow-hidden rounded-full bg-gray-100">
        <span className="bg-blue-500" style={{ width: `${macro.proteinPercentage}%` }} />
        <span className="bg-emerald-500" style={{ width: `${macro.carbPercentage}%` }} />
        <span className="bg-amber-500" style={{ width: `${macro.fatPercentage}%` }} />
      </div>
      <dl className="grid grid-cols-3 gap-3 text-sm">
        <MacroItem label="Protein" percent={macro.proteinPercentage} grams={macro.proteinGrams} color="text-blue-600" />
        <MacroItem label="Carb" percent={macro.carbPercentage} grams={macro.carbGrams} color="text-emerald-600" />
        <MacroItem label="Fat" percent={macro.fatPercentage} grams={macro.fatGrams} color="text-amber-600" />
      </dl>
      {total < 99 && (
        <p className="text-xs text-gray-500">* Phần trăm dựa trên tổng gram macro trung bình</p>
      )}
    </div>
  );
}

function MacroItem({
  label,
  percent,
  grams,
  color,
}: {
  label: string;
  percent: number;
  grams: number;
  color: string;
}) {
  return (
    <div>
      <p className={`text-xs uppercase ${color}`}>{label}</p>
      <p className="text-lg font-semibold">{percent.toFixed(1)}%</p>
      <p className="text-xs text-gray-500">{Math.round(grams)} g</p>
    </div>
  );
}

function HabitHighlights({ habits }: { habits: HabitScoreResponse }) {
  const best = habits.summary.bestDay;
  const worst = habits.summary.worstDay;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-emerald-50 p-3 text-sm">
          <p className="font-medium text-emerald-600">Meal streak</p>
          <p className="text-2xl font-semibold text-emerald-700">
            {habits.summary.mealLoggingStreakDays} ngày
          </p>
        </div>
        <div className="rounded-lg bg-blue-50 p-3 text-sm">
          <p className="font-medium text-blue-600">Workout streak</p>
          <p className="text-2xl font-semibold text-blue-700">
            {habits.summary.workoutLoggingStreakDays} ngày
          </p>
        </div>
      </div>
      <div className="rounded-lg bg-slate-50 p-3 text-sm">
        <p className="text-slate-600">Điểm sức khỏe trung bình</p>
        <p className="text-3xl font-semibold text-slate-900">
          {habits.summary.averageHealthScore.toFixed(1)} / 100
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3 text-xs">
        {best && (
          <div className="rounded border border-emerald-200 p-3">
            <p className="font-semibold text-emerald-700">Ngày tốt nhất</p>
            <p>{formatDateLabel(best.date)}</p>
            <p className="text-lg font-medium text-emerald-700">{best.healthScore}</p>
          </div>
        )}
        {worst && (
          <div className="rounded border border-rose-200 p-3">
            <p className="font-semibold text-rose-600">Ngày thấp nhất</p>
            <p>{formatDateLabel(worst.date)}</p>
            <p className="text-lg font-medium text-rose-600">{worst.healthScore}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function getSummaryCards(
  healthSummary: HealthSummaryResponse | null,
  habitScore: HabitScoreResponse | null
) {
  const cards: { title: string; value: string; caption: string }[] = [];
  if (healthSummary?.averages) {
    cards.push({
      title: "Average calories",
      value: `${Math.round(healthSummary.averages.caloriesIn)} in / ${Math.round(
        healthSummary.averages.caloriesOut || 0
      )} out`,
      caption: "Trung bình mỗi ngày trong giai đoạn chọn",
    });
  }
  if (habitScore?.summary) {
    cards.push({
      title: "Meal logging streak",
      value: `${habitScore.summary.mealLoggingStreakDays} ngày`,
      caption: "Số ngày liên tiếp đã ghi nhật ký bữa ăn",
    });
    cards.push({
      title: "Avg health score",
      value: `${habitScore.summary.averageHealthScore.toFixed(1)} / 100`,
      caption: "Chỉ số tổng hợp từ streak & kcal",
    });
  }
  return cards;
}

function formatDateForApi(date: Date) {
  return date.toISOString().slice(0, 10);
}

function formatDateLabel(dateStr: string) {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
}

function formatWeekLabel(dateStr: string) {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;
  const end = new Date(date);
  end.setDate(end.getDate() + 6);
  return `${date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })} - ${end.toLocaleDateString(
    "vi-VN",
    { day: "2-digit", month: "2-digit" }
  )}`;
}
