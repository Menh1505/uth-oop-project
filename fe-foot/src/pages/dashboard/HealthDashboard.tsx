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
import type { Exercise } from "../../types";
import { getDailyExerciseSummary } from "../../lib/api/exerciseApi";

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
  const { profile, fetchMeals } = useAppStore();
  const userId = profile?.user_id;
  const [range, setRange] = useState<RangeValue>("7d");
  const [healthSummary, setHealthSummary] = useState<HealthSummaryResponse | null>(null);
  const [habitScore, setHabitScore] = useState<HabitScoreResponse | null>(null);
  const [dailyWorkout, setDailyWorkout] = useState<DailyExerciseSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usingFallback, setUsingFallback] = useState(false);

  useEffect(() => {
    if (!userId) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const todayKey = formatDateForApi(today);
        const [healthRes, habitRes, workoutRes] = await Promise.all([
          ApiClient.get<HealthSummaryResponse>(`/analytics/users/${userId}/health-summary?range=${range}`),
          ApiClient.get<HabitScoreResponse>(
            `/analytics/users/${userId}/habit-score?from=${formatDateForApi(startOfMonth)}&to=${formatDateForApi(
              today
            )}`
          ),
          ApiClient.get<DailyExerciseSummary>(`/exercises/summary/daily?date=${todayKey}`),
        ]);
        setHealthSummary(healthRes);
        setHabitScore(habitRes);
        setDailyWorkout(workoutRes);
        setUsingFallback(false);
      } catch (err) {
        console.error("Health dashboard error", err);
        const fallback = await buildLocalRangeSummary({
          range,
          fetchMeals,
          workoutState: dailyWorkout,
        });
        if (fallback) {
          setHealthSummary(fallback.health);
          setHabitScore(fallback.habit);
          setDailyWorkout(fallback.workout);
          setError("Đang hiển thị dữ liệu tổng hợp từ nhật ký bữa ăn/buổi tập.");
          setUsingFallback(true);
        } else {
          setError("Không thể tải dữ liệu. Vui lòng kiểm tra backend/gateway.");
          setHealthSummary(null);
          setHabitScore(null);
          setDailyWorkout(null);
          setUsingFallback(false);
        }
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
        <div className="grid gap-4">
          <WorkoutSummaryCard
            summary={dailyWorkout}
            usingFallback={usingFallback}
            rangeMeta={
              usingFallback && healthSummary
                ? {
                    from: healthSummary.from,
                    to: healthSummary.to,
                    totalDuration: healthSummary.daily.reduce(
                      (s, d: any) => s + Number((d as any).workoutDurationMinutes || 0),
                      0
                    ),
                    totalCalories: healthSummary.daily.reduce(
                      (s, d) => s + Number((d as any).caloriesOut || 0),
                      0
                    ),
                    totalSessions: healthSummary.daily.reduce(
                      (s, d) => s + Number((d as any).workoutsLoggedCount || 0),
                      0
                    ),
                    days: healthSummary.daily.length,
                  }
                : null
            }
          />

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

          <section className="grid gap-4 lg:grid-cols-2">
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

            <Card title="Macro Breakdown">
              {macro ? (
                <MacroBreakdown macro={macro} />
              ) : (
                <EmptyState message="Chưa có dữ liệu macro." />
              )}
            </Card>
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
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
        </div>
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
            const points = data.map((point, idx) => {
              const x = data.length === 1 ? width / 2 : (idx / (data.length - 1)) * width;
              const value = Number(point[serie.key] ?? 0);
              const y = height - ((value - adjustedMin) / range) * height;
              return { x, y, value };
            });
            const path = points.map((p) => `${p.x},${p.y}`).join(" ");
            return (
              <g key={serie.key}>
                <polyline
                  fill="none"
                  stroke={serie.color}
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={path}
                  opacity={0.9}
                />
                {points.map((p, idx) => (
                  <circle
                    key={`${serie.key}-${idx}`}
                    cx={p.x}
                    cy={p.y}
                    r={3.5}
                    fill={serie.color}
                    stroke="white"
                    strokeWidth={1}
                    opacity={0.95}
                  />
                ))}
              </g>
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
  if (!data.length) return <EmptyState message="Chưa có buổi tập nào được ghi nhận." />;
  const maxSessions = Math.max(...data.map((d) => d.sessions || 0), 1);
  return (
    <div className="flex h-56 items-end justify-between gap-3">
      {data.map((week) => {
        const safeSessions = week.sessions || 0;
        const heightPercent = (safeSessions / maxSessions) * 100;
        return (
          <div key={week.weekStart} className="flex-1 text-center">
            <div className="rounded-t-lg bg-blue-500" style={{ height: `${heightPercent}%` }} />
            <p className="mt-2 text-xs font-medium text-gray-600">
              {formatWeekLabel(week.weekStart)}
            </p>
            <p className="text-xs text-gray-500">{safeSessions} buổi</p>
          </div>
        );
      })}
    </div>
  );
}

function MacroBreakdown({ macro }: { macro: HealthSummaryResponse["macroBreakdown"] }) {
  const total = macro.proteinPercentage + macro.carbPercentage + macro.fatPercentage;
  const hasData = total > 0 || macro.proteinGrams + macro.carbGrams + macro.fatGrams > 0;
  if (!hasData) {
    return <EmptyState message="Chưa có dữ liệu macro." />;
  }
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

async function buildLocalRangeSummary({
  range,
  fetchMeals,
  workoutState,
}: {
  range: RangeValue;
  fetchMeals: (date?: string) => Promise<any>;
  workoutState: DailyExerciseSummary | null;
}) {
  const days =
    range === "90d" ? 90
    : range === "30d" ? 30
    : 7;

  const today = new Date();
  const dateKeys = Array.from({ length: days }, (_, idx) => {
    const d = new Date(today);
    d.setDate(today.getDate() - idx);
    return formatDateForApi(d);
  }).reverse();

  const dailyData: HealthSummaryResponse["daily"] = [];
  let workoutsPerWeek: WorkoutWeekSummary[] = [];
  let fallbackWorkoutToday: DailyExerciseSummary | null = workoutState;

  for (const dateKey of dateKeys) {
    const [mealSummary, workoutSummary] = await Promise.all([
      fetchMealSummary(dateKey),
      getDailyExerciseSummary(dateKey).catch(() => null),
    ]);

    if (!fallbackWorkoutToday && dateKey === dateKeys[dateKeys.length - 1]) {
      fallbackWorkoutToday = workoutSummary;
    }

    const caloriesIn = mealSummary?.tong_calo ?? 0;
    const caloriesOut =
      workoutSummary?.total_calories_burned ??
      workoutSummary?.total_calories ??
      0;
    const calorieTarget = mealSummary?.calo_muc_tieu ?? 0;
    const healthScore =
      caloriesIn && calorieTarget
        ? Math.max(0, Math.min(100, (caloriesIn / calorieTarget) * 100))
        : 0;

    dailyData.push({
      date: dateKey,
      caloriesIn,
      caloriesOut,
      calorieBalance: caloriesIn - (calorieTarget || caloriesIn),
      calorieTarget: calorieTarget || caloriesIn,
      mealsLoggedCount: (mealSummary?.meals || []).length || 0,
      workoutsLoggedCount: workoutSummary?.sessions?.length || 0,
      ...estimateMacroFromCalories(caloriesIn || calorieTarget || 0),
      healthScore: computeHealthScore(
        caloriesIn,
        calorieTarget,
        workoutSummary?.sessions?.length || 0
      ),
    });

    if (workoutSummary) {
      const weekStart = getWeekStart(dateKey);
      const existing = workoutsPerWeek.find((w) => w.weekStart === weekStart);
      const sessions = workoutSummary.sessions?.length || 0;
      const minutes =
        (workoutSummary.total_duration as number | undefined) ??
        workoutSummary.total_duration_minutes ??
        0;
      if (existing) {
        existing.sessions += sessions;
        existing.minutes += minutes;
      } else {
        workoutsPerWeek.push({ weekStart, sessions, minutes });
      }

      // Store per-day workout minutes to display later
      const last = dailyData[dailyData.length - 1];
      if (last) {
        (last as any).workoutDurationMinutes = minutes;
        (last as any).workoutSessions = sessions;
      }
    }
  }

  if (!dailyData.length) return null;

  const avg = <T extends keyof HealthSummaryResponse["daily"][number]>(key: T) =>
    dailyData.reduce((s, d) => s + Number(d[key] || 0), 0) / dailyData.length;

  const health: HealthSummaryResponse = {
    userId: "local",
    from: dailyData[0].date,
    to: dailyData[dailyData.length - 1].date,
    daily: dailyData,
    averages: {
      caloriesIn: avg("caloriesIn"),
      caloriesOut: avg("caloriesOut"),
      calorieBalance: avg("calorieBalance"),
      healthScore: avg("healthScore"),
    },
    macroBreakdown: {
      proteinPercentage: avg("proteinPercentage"),
      carbPercentage: avg("carbPercentage"),
      fatPercentage: avg("fatPercentage"),
      proteinGrams: avg("proteinGrams"),
      carbGrams: avg("carbGrams"),
      fatGrams: avg("fatGrams"),
    },
    workoutSessionsPerWeek: workoutsPerWeek,
    insights: buildInsights(healthSummaryDraft(dailyData)),
    weightTrend: [],
  };

  const habit: HabitScoreResponse = {
    userId: "local",
    from: health.from,
    to: health.to,
    daily: dailyData.map((d) => ({
      date: d.date,
      healthScore: d.healthScore,
      mealLoggingStreakDays: d.mealsLoggedCount ? 1 : 0,
      workoutLoggingStreakDays: d.workoutsLoggedCount ? 1 : 0,
    })),
    summary: {
      averageHealthScore: health.averages.healthScore,
      bestDay: dailyData
        .slice()
        .sort((a, b) => b.healthScore - a.healthScore)[0],
      worstDay: dailyData
        .slice()
        .sort((a, b) => a.healthScore - b.healthScore)[0],
      mealLoggingStreakDays: dailyData.filter((d) => d.mealsLoggedCount > 0).length,
      workoutLoggingStreakDays: dailyData.filter((d) => d.workoutsLoggedCount > 0).length,
    },
  };

  const workoutSummary: DailyExerciseSummary | null = fallbackWorkoutToday
    ? {
        ...fallbackWorkoutToday,
        total_duration_minutes:
          (fallbackWorkoutToday as any).total_duration ??
          fallbackWorkoutToday.total_duration_minutes ??
          0,
        total_calories_burned:
          (fallbackWorkoutToday as any).total_calories ??
          fallbackWorkoutToday.total_calories_burned ??
          0,
      }
    : null;

  return { health, habit, workout: workoutSummary };
}

async function fetchMealSummary(date: string) {
  try {
    const payload = await ApiClient.get<any>(`/meals/me?date=${date}`);
    const body = (payload as any)?.data ?? payload;
    return body?.summary
      ? { ...body.summary, meals: body.meals || [] }
      : body;
  } catch (error) {
    console.warn("fetchMealSummary fallback error", error);
    return null;
  }
}

function getWeekStart(dateKey: string) {
  const date = new Date(`${dateKey}T00:00:00Z`);
  const day = date.getUTCDay();
  const diff = (day + 6) % 7;
  date.setUTCDate(date.getUTCDate() - diff);
  const year = date.getUTCFullYear();
  const month = `${date.getUTCMonth() + 1}`.padStart(2, "0");
  const dayString = `${date.getUTCDate()}`.padStart(2, "0");
  return `${year}-${month}-${dayString}`;
}

function computeHealthScore(caloriesIn: number, calorieTarget: number, workouts: number) {
  if (!caloriesIn) return workouts > 0 ? 40 : 20;
  const target = calorieTarget || caloriesIn || 1;
  const ratio = caloriesIn / target;
  // Score drops as you deviate from target; add small bonus for workouts
  const base = Math.max(0, 100 - Math.abs(1 - ratio) * 100);
  const bonus = workouts > 0 ? 5 : 0;
  return Math.min(100, base + bonus);
}

function estimateMacroFromCalories(calories: number) {
  // Default ratio 30/45/25
  const proteinPct = 30;
  const carbPct = 45;
  const fatPct = 25;
  return {
    proteinPercentage: proteinPct,
    carbPercentage: carbPct,
    fatPercentage: fatPct,
    proteinGrams: (calories * (proteinPct / 100)) / 4,
    carbGrams: (calories * (carbPct / 100)) / 4,
    fatGrams: (calories * (fatPct / 100)) / 9,
  };
}

function healthSummaryDraft(daily: HealthSummaryResponse["daily"]) {
  const caloriesInAvg = daily.reduce((s, d) => s + (d.caloriesIn || 0), 0) / daily.length;
  const caloriesTargetAvg = daily.reduce((s, d) => s + (d.calorieTarget || 0), 0) / daily.length;
  const workoutDays = daily.filter((d) => (d.workoutsLoggedCount || 0) > 0).length;
  return { caloriesInAvg, caloriesTargetAvg, workoutDays };
}

function buildInsights(meta: { caloriesInAvg: number; caloriesTargetAvg: number; workoutDays: number }) {
  const insights: string[] = [];
  if (meta.caloriesTargetAvg) {
    const delta = meta.caloriesInAvg - meta.caloriesTargetAvg;
    if (delta > 100) insights.push("Bạn đang ăn cao hơn mục tiêu, cân nhắc giảm khẩu phần hoặc tăng vận động.");
    else if (delta < -100) insights.push("Bạn đang ăn thấp hơn mục tiêu, chú ý nạp đủ năng lượng cho phục hồi.");
    else insights.push("Lượng calorie gần mục tiêu, tiếp tục duy trì.");
  }
  insights.push(
    meta.workoutDays >= 3
      ? "Bạn đang duy trì luyện tập tốt (>=3 ngày trong giai đoạn chọn)."
      : "Tăng số ngày luyện tập để đạt hiệu quả tốt hơn."
  );
  return insights;
}

type DailyExerciseSummary = {
  date: string;
  total_exercises?: number;
  total_duration_minutes?: number;
  total_calories_burned?: number;
  exercise_types?: string[];
  exercises?: (Partial<Exercise> & {
    exercise_name: string;
    duration_minutes?: number;
    calories_burned?: number;
    exercise_time?: string;
    notes?: string | null;
    intensity?: string | null;
  })[];
};

function WorkoutSummaryCard({
  summary,
  usingFallback,
  rangeMeta,
}: {
  summary: DailyExerciseSummary | null;
  usingFallback: boolean;
  rangeMeta: {
    from: string;
    to: string;
    totalDuration: number;
    totalCalories: number;
    totalSessions: number;
    days: number;
  } | null;
}) {
  if (!summary && !rangeMeta) return null;

  const isRange = usingFallback && rangeMeta;
  const duration = Math.round(
    isRange ? rangeMeta!.totalDuration : summary?.total_duration_minutes ?? 0
  );
  const calories = Math.round(
    isRange ? rangeMeta!.totalCalories : summary?.total_calories_burned ?? 0
  );
  const days = isRange ? rangeMeta!.days : 1;
  const targetCalories = 500 * days;
  const progress = targetCalories > 0 ? Math.min(100, Math.round((calories / targetCalories) * 100)) : 0;
  const status =
    calories >= targetCalories * 0.9
      ? { label: "Tốt", color: "bg-emerald-100 text-emerald-700" }
      : { label: "Cần bổ sung", color: "bg-amber-100 text-amber-700" };

  const sessions = isRange
    ? []
    : [...(summary?.exercises || [])].sort((a, b) => {
        const ta = (a.exercise_time || "").toString();
        const tb = (b.exercise_time || "").toString();
        return tb.localeCompare(ta);
      });

  return (
    <Card title={isRange ? "Tổng quan buổi tập (theo khoảng)" : "Tổng quan buổi tập trong ngày"}>
      <div className="space-y-4">
        <p className="text-sm text-gray-500">
          {isRange ? "Khoảng đang theo dõi" : "Ngày đang theo dõi"}
        </p>
        <p className="text-lg font-semibold text-gray-900">
          {isRange ? `${rangeMeta!.from} → ${rangeMeta!.to}` : summary?.date}
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          <StatPill label="Thời lượng" value={`${duration} phút`} />
          <StatPill label="Calories" value={`${calories} kcal`} />
        </div>

        <div className="space-y-1">
          <p className="text-sm text-gray-600">
            {isRange ? `Tiến độ calories (tổng ${days} ngày)` : "Tiến độ calories"}
          </p>
          <div className="h-2 rounded-full bg-gray-100">
            <div
              className="h-2 rounded-full bg-gradient-to-r from-pink-500 to-amber-400 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-gray-500">
            {calories}/{targetCalories} kcal
          </p>
        </div>

        <div className="flex items-center gap-3 text-sm">
          <div className="font-semibold text-gray-800">Trạng thái</div>
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${status.color}`}>
            {status.label}
          </span>
        </div>

        {isRange ? (
          <div className="text-sm text-gray-700">
            {rangeMeta!.totalSessions} buổi trong {rangeMeta!.days} ngày.
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm font-semibold text-gray-800">Timeline buổi tập</p>
            {sessions.length ? (
              <ul className="space-y-3">
                {sessions.map((s, idx) => (
                  <li key={`${s.exercise_name}-${idx}`} className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <span className="mt-1 inline-block h-3 w-3 rounded-full border-2 border-gray-800" />
                      <div>
                        <p className="font-semibold text-gray-900">{s.exercise_name}</p>
                        <p className="text-xs text-gray-600">
                          {renderDuration(s.duration_minutes)} • {renderCalories(s.calories_burned)}
                        </p>
                        {s.notes && <p className="text-xs text-gray-500">{s.notes}</p>}
                      </div>
                    </div>
                    <p className="text-xs font-medium text-gray-700">{renderTime(s.exercise_time)}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState message="Chưa có buổi tập nào trong ngày." />
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-gray-50 px-4 py-3">
      <p className="text-xs uppercase text-gray-500">{label}</p>
      <p className="text-2xl font-semibold text-gray-900">{value}</p>
    </div>
  );
}

function renderDuration(min?: number) {
  if (!min) return "0 phút";
  return `${min} phút`;
}

function renderCalories(kcal?: number) {
  if (!kcal) return "0 kcal";
  return `${kcal} kcal`;
}

function renderTime(time?: string) {
  if (!time) return "";
  // Accept HH:MM[:SS]
  const [h, m] = time.split(":");
  if (!h || !m) return time;
  return `${h.padStart(2, "0")}:${m.padStart(2, "0")}`;
}
