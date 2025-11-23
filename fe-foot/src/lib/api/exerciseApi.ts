import type {
  DailyExerciseSummary,
  ExerciseSession,
  ExerciseTemplate,
} from "../../types";

const runtimeEnv =
  typeof import.meta !== "undefined"
    ? {
        direct: import.meta.env?.VITE_EXERCISE_API_BASE_URL as string | undefined,
        defaultBase: import.meta.env?.VITE_API_BASE_URL as string | undefined,
      }
    : { direct: undefined, defaultBase: undefined };

const rawBases = [
  runtimeEnv.direct,
  runtimeEnv.defaultBase,
  "/api",
].filter((value): value is string => Boolean(value));

const baseCandidates = Array.from(new Set(rawBases));

const normalizeBase = (raw: string) => {
  const trimmed = raw.replace(/\/+$/, "");
  return trimmed.endsWith("/exercises") ? trimmed : `${trimmed}/exercises`;
};

const getToken = () =>
  localStorage.getItem("authToken") || localStorage.getItem("accessToken");

const clearStoredTokens = () => {
  localStorage.removeItem("authToken");
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
};

const refreshAccessToken = async (): Promise<boolean> => {
  const refreshToken = localStorage.getItem("refreshToken");
  if (!refreshToken) return false;
  try {
    const res = await fetch("/api/auth/refresh", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (!res.ok) {
      clearStoredTokens();
      return false;
    }
    const data = await res.json().catch(() => null);
    if (!data?.access_token) {
      clearStoredTokens();
      return false;
    }
    localStorage.setItem("authToken", data.access_token);
    localStorage.setItem("accessToken", data.access_token);
    if (data.refresh_token) {
      localStorage.setItem("refreshToken", data.refresh_token);
    }
    return true;
  } catch {
    return false;
  }
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let lastNetworkError: Error | null = null;
  for (const rawBase of baseCandidates) {
    const base = normalizeBase(rawBase);
    try {
      return await performRequest<T>(base, path, init);
    } catch (error) {
      if (error instanceof TypeError) {
        lastNetworkError = error;
        continue;
      }
      throw error;
    }
  }
  throw (
    lastNetworkError ??
    new Error("Exercise API request failed: no reachable base URL")
  );
}

async function performRequest<T>(
  base: string,
  path: string,
  init?: RequestInit,
  attemptRefresh = true
): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(init?.headers || {}),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const url = `${base}${path.startsWith("/") ? path : `/${path}`}`.replace(
    /([^:]\/)\/+/g,
    "$1"
  );

  const res = await fetch(url, {
    ...init,
    headers,
  });

  if (res.status === 401 && attemptRefresh) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return performRequest<T>(base, path, init, false);
    }
  }

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
  exercise_type: template?.exercise_type ?? template?.type ?? null,
  default_duration:
    template?.default_duration ?? template?.duration ?? template?.thoi_luong ?? null,
  default_calories:
    template?.default_calories ??
    template?.calories ??
    template?.calo_tieu_hao ??
    null,
  instructions: Array.isArray(template?.instructions)
    ? template.instructions
    : template?.huong_dan
      ? String(template.huong_dan).split("\n").map((step) => step.trim()).filter(Boolean)
      : null,
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
  intensity?: string;
  exercise_type?: string;
};

export async function getExerciseTemplates(): Promise<ExerciseTemplate[]> {
  const payload = await request<any>(`/templates`);
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
  const res = await request<any>(`/sessions`, {
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
    `/summary/daily?date=${encodeURIComponent(date)}`
  );
  const summary = raw?.summary || raw;
  const source = Array.isArray(summary?.sessions)
    ? summary.sessions
    : Array.isArray(summary?.exercises)
      ? summary.exercises
      : [];
  const sessions = source.map(normalizeSession);
  return {
    date: summary?.date || date,
    total_duration: Number(summary?.total_duration ?? 0),
    total_calories: Number(summary?.total_calories ?? 0),
    sessions,
  };
}
