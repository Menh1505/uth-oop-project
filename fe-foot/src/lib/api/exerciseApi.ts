import type {
  DailyExerciseSummary,
  ExerciseSession,
  ExerciseTemplate,
} from "../../types";

const EXERCISE_BASE_URL = "http://localhost:4003";

const getToken = () =>
  localStorage.getItem("authToken") || localStorage.getItem("accessToken");

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(init?.headers || {}),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${EXERCISE_BASE_URL}${path}`, {
    ...init,
    headers,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Exercise API ${res.status} ${res.statusText || ""} ${text}`.trim()
    );
  }

  const payload = (await res.json().catch(() => null)) as
    | { data?: T }
    | T
    | null;
  return (payload && (payload as any).data) ?? (payload as T);
}

const normalizeTemplate = (template: any): ExerciseTemplate => ({
  id:
    String(template?.id ?? template?._id ?? template?.template_id ?? "") ||
    `tpl-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  name:
    template?.name ||
    template?.exercise_name ||
    template?.ten_buoi_tap ||
    "Buổi tập",
  description: template?.description ?? template?.mo_ta ?? null,
  muscle_group: template?.muscle_group ?? template?.nhom_co ?? null,
  intensity: template?.intensity ?? template?.muc_do ?? null,
  default_duration:
    template?.default_duration ?? template?.duration ?? template?.thoi_luong ?? null,
  default_calories:
    template?.default_calories ??
    template?.calories ??
    template?.calo_tieu_hao ??
    null,
});

const normalizeSession = (session: any): ExerciseSession => ({
  id:
    String(session?.id ?? session?._id ?? session?.session_id ?? "") ||
    `ses-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  exercise_name:
    session?.exercise_name ||
    session?.ten_buoi_tap ||
    session?.name ||
    "Buổi tập",
  duration_minutes: Number(session?.duration_minutes ?? session?.duration ?? 0),
  calories_burned: Number(session?.calories_burned ?? session?.calories ?? 0),
  date: session?.date || session?.exercise_date || session?.ngay_tap || "",
  start_time:
    session?.start_time || session?.exercise_time || session?.gio_tap || null,
  notes: session?.notes ?? session?.ghi_chu ?? null,
  template_id: session?.template_id ?? session?.exercise_template_id ?? null,
  created_at: session?.created_at ?? session?.updated_at ?? null,
});

export type CreateExerciseSessionPayload = {
  exercise_name: string;
  date: string;
  start_time: string;
  duration_minutes: number;
  calories_burned: number;
  notes?: string;
  template_id?: string;
};

export async function getExerciseTemplates(): Promise<ExerciseTemplate[]> {
  const payload = await request<any>(`/api/exercises/templates`);
  const list = Array.isArray(payload?.templates)
    ? payload.templates
    : Array.isArray(payload)
      ? payload
      : [];
  return list.map(normalizeTemplate);
}

export async function createExerciseSession(
  payload: CreateExerciseSessionPayload
): Promise<ExerciseSession> {
  const res = await request<any>(`/api/exercises/sessions`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const session = res?.session || res;
  return normalizeSession(session);
}

export async function getDailyExerciseSummary(
  date: string
): Promise<DailyExerciseSummary> {
  const raw = await request<any>(
    `/api/exercises/summary/daily?date=${encodeURIComponent(date)}`
  );
  const summary = raw?.summary || raw;
  const sessions = Array.isArray(summary?.sessions)
    ? summary.sessions.map(normalizeSession)
    : [];
  return {
    date: summary?.date || date,
    total_duration: Number(summary?.total_duration ?? 0),
    total_calories: Number(summary?.total_calories ?? 0),
    sessions,
  };
}
