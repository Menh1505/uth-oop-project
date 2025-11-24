import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAppStore } from "../../store/useAppStore";
import type { MealLog } from "../../types";

const MEAL_BASE = "/api/meals";
const MEAL_COLLECTION_URL = `${MEAL_BASE}/`;
type MealType = "Breakfast" | "Lunch" | "Dinner" | "Snack";
const MEAL_TYPE_MAP: Record<MealType, string> = {
  Breakfast: "Bữa sáng",
  Lunch: "Bữa trưa",
  Dinner: "Bữa tối",
  Snack: "Ăn vặt",
};
const MEAL_LABEL_TO_TYPE = Object.entries(MEAL_TYPE_MAP).reduce(
  (acc, [key, label]) => {
    acc[label] = key as MealType;
    return acc;
  },
  {} as Record<string, MealType>
);

const DEFAULT_CALORIES = 450;
const DEFAULT_MASS = 250;

type MealTemplate = {
  id: string;
  ten_mon: string;
  loai_bua_an: string;
  luong_calories: number;
  khoi_luong: number;
  description?: string | null;
  image_url?: string | null;
};

type CreateMealOverride = {
  mealName?: string;
  mealTypeLabel?: string;
  calories?: number;
  mass?: number;
  notes?: string;
  date?: string;
  time?: string;
};

const mealsLog = (...args: unknown[]) => console.log("[MealsPage]", ...args);

export default function Meals() {
  const { meals, fetchMeals, dailySummary } = useAppStore();

  // ----- Khung 1: tạo bữa ăn (metadata – CreateMealPayload) -----
  const today = new Date().toISOString().slice(0, 10);
  const nowTime = new Date().toISOString().slice(11, 16);

  const [newMealName, setNewMealName] = useState("");
  const [newMealType, setNewMealType] = useState<MealType>("Lunch");
  const [newMealDate, setNewMealDate] = useState(today);
  const [newMealTime, setNewMealTime] = useState(nowTime);
  const [newMealNotes, setNewMealNotes] = useState("");
  const [selectedDate, setSelectedDate] = useState(today);
  const [creating, setCreating] = useState(false);
  const [templates, setTemplates] = useState<MealTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [templatesError, setTemplatesError] = useState<string | null>(null);
  const [highlightedMealId, setHighlightedMealId] = useState<string | null>(null);
  const [selectedTemplateCalories, setSelectedTemplateCalories] =
    useState(DEFAULT_CALORIES);
  const [selectedTemplateMass, setSelectedTemplateMass] =
    useState(DEFAULT_MASS);
  const [summaryLoading, setSummaryLoading] = useState(false);

  // ----- Modal state edit/delete -----
  const [selectedMeal, setSelectedMeal] = useState<MealLog | null>(null);
  const [editName, setEditName] = useState("");
  const [editCal, setEditCal] = useState(0);
  const [editP, setEditP] = useState(0);
  const [editC, setEditC] = useState(0);
  const [editF, setEditF] = useState(0);

  const openEditModal = (meal: MealLog) => {
    setSelectedMeal(meal);
    setEditName(meal.name);
    setEditCal(meal.calories);
    setEditP(meal.protein);
    setEditC(meal.carbs);
    setEditF(meal.fat);
  };

  const closeModal = () => {
    setSelectedMeal(null);
  };

  const handleSelectTemplate = async (template: MealTemplate) => {
    mealsLog("Select template", template.id);
    setNewMealName(template.ten_mon);
    setSelectedTemplateCalories(template.luong_calories);
    setSelectedTemplateMass(template.khoi_luong);
    const mappedType =
      MEAL_LABEL_TO_TYPE[template.loai_bua_an] ?? ("Lunch" as MealType);
    setNewMealType(mappedType);
    try {
      const createdMeal = await handleCreateMeal({
        mealName: template.ten_mon,
        mealTypeLabel: template.loai_bua_an,
        calories: template.luong_calories,
        mass: template.khoi_luong,
      });
      if (createdMeal?.id) {
        setHighlightedMealId(createdMeal.id);
      }
    } catch {
      // errors handled inside handleCreateMeal
    }
  };

  const fetchMealTemplates = useCallback(async () => {
    setTemplatesLoading(true);
    setTemplatesError(null);
    try {
      const res = await fetch("/api/meals/templates");
      if (!res.ok) {
        throw new Error(`Status ${res.status}`);
      }
      const payload = await res.json();
      const data = payload?.data ?? payload;
      let templatesList: MealTemplate[] = [];
      if (Array.isArray(data)) {
        templatesList = data;
      } else if (Array.isArray(data?.templates)) {
        templatesList = data.templates;
      }
      setTemplates(templatesList);
      if (templatesList.length > 0) {
        const first = templatesList[0];
        const defaultType =
          MEAL_LABEL_TO_TYPE[first.loai_bua_an] ?? ("Lunch" as MealType);
        setNewMealName((current) => current || first.ten_mon);
        setNewMealType((current) => current || defaultType);
        setSelectedTemplateCalories(first.luong_calories);
        setSelectedTemplateMass(first.khoi_luong);
      }
    } catch (error) {
      console.error("Load meal templates failed", error);
      setTemplatesError("Không tải được danh sách món ăn mẫu");
    } finally {
      setTemplatesLoading(false);
    }
  }, []);

  const reloadMeals = useCallback(
    async (date: string) => {
      setSummaryLoading(true);
      try {
        await fetchMeals(date);
      } catch (error) {
        console.error("Reload meals failed", error);
      } finally {
        setSummaryLoading(false);
      }
    },
    [fetchMeals]
  );

  const handleUpdateMeal = async () => {
    if (!selectedMeal) return;
    const token =
      localStorage.getItem("authToken") ||
      localStorage.getItem("accessToken");
    if (!token) {
      alert("Chưa đăng nhập");
      return;
    }
    try {
      const res = await fetch(`/api/meals/${selectedMeal.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          meal_name: editName,
          meal_type: "Snack",
          meal_date: selectedMeal.time.split("T")[0],
          meal_time: selectedMeal.time.split("T")[1]?.slice(0, 5) || "00:00",
        }),
      });
      if (res.ok) {
        alert("Cập nhật thành công");
        await reloadMeals(selectedDate);
        closeModal();
      } else {
        alert("Cập nhật thất bại");
      }
    } catch (e) {
      console.error("Update error:", e);
      alert("Lỗi cập nhật");
    }
  };

  const handleDeleteMeal = async () => {
    if (!selectedMeal) return;
    if (!confirm("Xác nhận xóa bữa ăn này?")) return;

    const token =
      localStorage.getItem("authToken") ||
      localStorage.getItem("accessToken");
    if (!token) {
      alert("Chưa đăng nhập");
      return;
    }
    try {
      const res = await fetch(`/api/meals/${selectedMeal.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        alert("Xóa thành công");
        await reloadMeals(selectedDate);
        closeModal();
      } else {
        alert("Xóa thất bại");
      }
    } catch (e) {
      console.error("Delete error:", e);
      alert("Lỗi xóa");
    }
  };

  // ----- Create meal (metadata) -----
  const handleCreateMeal = async (override?: CreateMealOverride) => {
    const token =
      localStorage.getItem("authToken") ||
      localStorage.getItem("accessToken");

    if (!token) {
      alert("Chưa đăng nhập");
      return;
    }

    const mealNameValue = (override?.mealName ?? newMealName).trim();
    if (!mealNameValue) {
      alert("Chọn món ăn từ danh sách");
      return;
    }

    const mealTypeLabel = override?.mealTypeLabel ?? MEAL_TYPE_MAP[newMealType];
    const mealDateValue = override?.date ?? newMealDate;
    const mealTimeValue = override?.time ?? newMealTime;
    const mealCalories =
      override?.calories ?? selectedTemplateCalories ?? DEFAULT_CALORIES;
    const mealMass =
      override?.mass ?? selectedTemplateMass ?? DEFAULT_MASS;
    const notesValue = override?.notes ?? (newMealNotes || undefined);

    const url = MEAL_COLLECTION_URL;
    mealsLog("CreateMeal URL:", url, {
      ten_mon: mealNameValue,
      loai_bua_an: mealTypeLabel,
      ngay_an: mealDateValue,
      thoi_gian_an: mealTimeValue,
      luong_calories: mealCalories,
      khoi_luong: mealMass,
      ghi_chu: notesValue,
    });

    setCreating(true);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ten_mon: mealNameValue,
          loai_bua_an: mealTypeLabel,
          ngay_an: mealDateValue,
          thoi_gian_an: mealTimeValue,
          luong_calories: mealCalories,
          khoi_luong: mealMass,
          ghi_chu: notesValue,
        }),
      });

      mealsLog("CreateMeal status:", res.status);

      if (!res.ok) {
        alert("Tạo bữa ăn thất bại");
        return;
      }

      const payload = await res.json().catch(() => null);
      const createdMeal =
        payload?.data?.meal || payload?.data || payload || null;
      mealsLog("CreateMeal result:", createdMeal);
      if (selectedDate !== mealDateValue) {
        setSelectedDate(mealDateValue);
      } else {
        await reloadMeals(mealDateValue);
      }
      setNewMealNotes("");
      return createdMeal;
    } catch (e) {
      console.error("Create meal error:", e);
      mealsLog("Create meal error detail", e);
      alert("Lỗi tạo bữa ăn (không gọi được server/Nginx)");
      throw e;
    } finally {
      setCreating(false);
    }
  };


  useEffect(() => {
    reloadMeals(selectedDate);
  }, [reloadMeals, selectedDate]);

  useEffect(() => {
    fetchMealTemplates();
  }, [fetchMealTemplates]);

  useEffect(() => {
    if (!highlightedMealId) return;
    const timeout = setTimeout(() => setHighlightedMealId(null), 5000);
    return () => clearTimeout(timeout);
  }, [highlightedMealId]);

  const displayMeals = meals.filter((m) => {
    const meal = m as any;
    return Boolean(
      meal.meal_name ||
        meal.name ||
        meal.ten_mon ||
        meal.meal_date ||
        meal.ngay_an ||
        meal.meal_type ||
        meal.loai_bua_an
    );
  });

  const getMealDate = (meal: any) => {
    const date = meal.meal_date || meal.ngay_an || "";
    return date.includes("T") ? date.split("T")[0] : date;
  };

  const getMealTime = (meal: any) => {
    const time = meal.meal_time || meal.thoi_gian_an || "00:00";
    return time.length > 5 ? time.slice(0, 5) : time;
  };

  const getMealTypeLabel = (meal: any) =>
    meal.loai_bua_an || meal.meal_type || "Bữa ăn";

  const dailyMeals = useMemo(
    () => displayMeals.filter((meal) => !selectedDate || getMealDate(meal) === selectedDate),
    [displayMeals, selectedDate]
  );

  const totalDailyCalories = useMemo(() => {
    if (dailySummary?.tong_calo !== undefined && dailySummary?.tong_calo !== null) {
      return dailySummary.tong_calo;
    }
    return dailyMeals.reduce(
      (sum, meal: any) =>
        sum + Number(meal.total_calories ?? meal.luong_calories ?? 0),
      0
    );
  }, [dailyMeals, dailySummary]);

  const handleSelectedDateChange = (value: string) => {
    setSelectedDate(value);
    if (value) {
      setNewMealDate(value);
    } else {
      setNewMealDate(today);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Nhật ký bữa ăn
          </h1>
          <p className="text-sm text-slate-500">
            Quản lý dữ liệu bữa ăn, ghi nhanh món ăn và đồng bộ nhật ký hàng
            ngày.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => handleSelectedDateChange(e.target.value)}
          />
          <Button
            variant="ghost"
            onClick={() => handleSelectedDateChange(today)}
          >
            Hôm nay
          </Button>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: "24px",
          alignItems: "flex-start",
        }}
      >
        <main style={{ flex: 1, minWidth: 0 }}>
          <div className="space-y-6">
            <Card title="Công cụ bữa ăn">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <section className="space-y-4">
                  <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-wide">
                    Thiết lập thời gian & ghi chú
                  </h2>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <label className="block">
                      <div className="mb-1 text-slate-500">Ngày</div>
                      <Input
                        type="date"
                        value={newMealDate}
                        onChange={(e) => {
                          setNewMealDate(e.target.value);
                          setSelectedDate(e.target.value || today);
                        }}
                      />
                    </label>
                    <label className="block">
                      <div className="mb-1 text-slate-500">Giờ</div>
                      <Input
                        type="time"
                        value={newMealTime}
                        onChange={(e) => setNewMealTime(e.target.value)}
                      />
                    </label>
                  </div>
                  <label className="block text-sm">
                    <div className="mb-1 text-slate-500">Loại bữa ăn</div>
                    <select
                      className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      value={newMealType}
                      onChange={(e) => setNewMealType(e.target.value as MealType)}
                    >
                      <option value="Breakfast">Breakfast</option>
                      <option value="Lunch">Lunch</option>
                      <option value="Dinner">Dinner</option>
                      <option value="Snack">Snack</option>
                    </select>
                  </label>
                  <label className="block text-sm">
                    <div className="mb-1 text-slate-500">Ghi chú</div>
                    <textarea
                      className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      rows={3}
                      value={newMealNotes}
                      onChange={(e) => setNewMealNotes(e.target.value)}
                      placeholder="Thêm ghi chú nếu cần..."
                    />
                  </label>
                  <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                    <div className="text-xs uppercase text-slate-500">
                      Món đã chọn
                    </div>
                    <div className="text-lg font-semibold text-slate-900">
                      {newMealName || "Chưa chọn món từ server"}
                    </div>
                    <div className="text-sm text-slate-500">
                      {MEAL_TYPE_MAP[newMealType]} • {selectedTemplateCalories}{" "}
                      kcal • {selectedTemplateMass} g
                    </div>
                  </div>
                  <Button
                    onClick={async () => {
                      const created = await handleCreateMeal();
                      if (created?.id) {
                        setHighlightedMealId(created.id);
                      }
                    }}
                    disabled={creating || !newMealName.trim()}
                    className="w-full"
                  >
                    {creating ? "Đang gửi..." : "Gửi món đã chọn"}
                  </Button>
                </section>

                <section className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-wide">
                      Chọn món từ server
                    </h2>
                    <Button
                      variant="ghost"
                      onClick={fetchMealTemplates}
                      disabled={templatesLoading}
                    >
                      {templatesLoading ? "Đang tải..." : "Tải lại"}
                    </Button>
                  </div>
                  {templatesError && (
                    <p className="text-sm text-red-500">{templatesError}</p>
                  )}
                  {!templatesLoading && templates.length === 0 && !templatesError && (
                    <p className="text-sm text-slate-500">
                      Chưa có món mẫu, vui lòng thử lại sau.
                    </p>
                  )}
                  {templatesLoading && (
                    <p className="text-sm text-slate-500">Đang tải món ăn...</p>
                  )}
                  {!templatesLoading && templates.length > 0 && (
                    <div className="space-y-3">
                      {templates.map((template) => (
                        <div
                          key={template.id}
                          className="border rounded-xl p-3 bg-white shadow-sm"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold text-base">
                                {template.ten_mon}
                              </p>
                              <p className="text-xs uppercase text-slate-500">
                                {template.loai_bua_an}
                              </p>
                            </div>
                            <div className="text-right text-sm text-slate-600">
                              <div>{template.luong_calories} kcal</div>
                              <div>{template.khoi_luong} g</div>
                            </div>
                          </div>
                          {template.description && (
                            <p className="text-sm text-slate-500 mt-2">
                              {template.description}
                            </p>
                          )}
                          <Button
                            className="mt-3 w-full"
                            onClick={() => handleSelectTemplate(template)}
                            disabled={creating}
                          >
                            Chọn & lưu
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>
            </Card>

            <Card title="Danh sách bữa ăn">
              <ul className="space-y-3">
                {displayMeals.map((m) => {
                  const meal: any = m;
                  const isHighlighted = highlightedMealId === meal.id;
                  return (
                    <li
                      key={meal.id}
                      className={`border rounded-lg p-3 hover:bg-gray-50 cursor-pointer transition ${
                        isHighlighted
                          ? "border-primary-500 ring-2 ring-primary-200"
                          : ""
                      }`}
                      onClick={() => openEditModal(meal)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <div className="font-semibold text-base">
                            {meal.meal_name || "Bữa ăn"}
                          </div>
                          <div className="text-sm text-gray-600">
                            Loại: {meal.meal_type || meal.loai_bua_an || "—"}
                          </div>
                          <div className="text-sm text-gray-600">
                            Ngày: {meal.meal_date || meal.ngay_an || "—"}
                            {meal.meal_time && ` • ${meal.meal_time}`}
                          </div>
                          {meal.notes && (
                            <div className="text-sm text-gray-500 italic">
                              Ghi chú: {meal.notes}
                            </div>
                          )}
                        </div>
                        {meal.id && (
                          <div className="text-xs text-gray-400">
                            ID: {String(meal.id).slice(0, 6)}...
                          </div>
                        )}
                      </div>
                    </li>
                  );
                })}
                {displayMeals.length === 0 && (
                  <li className="text-sm text-gray-500">
                    Chưa có bữa ăn nào.
                  </li>
                )}
              </ul>
            </Card>
          </div>
        </main>

        <aside
          style={{
            width: "320px",
            position: "sticky",
            top: "80px",
            maxHeight: "calc(100vh - 96px)",
            overflowY: "auto",
          }}
        >
          <Card title="Tổng quan trong ngày">
            <div className="space-y-4">
              <div>
                <div className="text-xs uppercase text-slate-500">
                  Ngày đang theo dõi
                </div>
                <div className="text-lg font-semibold text-slate-900">
                  {selectedDate || "Không xác định"}
                </div>
              </div>
              <div className="rounded-xl bg-slate-100 px-4 py-3">
                <div className="text-xs text-slate-500 uppercase">
                  Tổng calories
                </div>
                <div className="text-3xl font-bold text-slate-900">
                  {summaryLoading ? "Đang tải..." : `${totalDailyCalories} kcal`}
                </div>
              </div>
              <div className="space-y-2 text-sm text-slate-500">
                <div>
                  Trạng thái:{" "}
                  {summaryLoading
                    ? "Đang tải..."
                    : dailySummary?.trang_thai_calo ?? "Chưa có dữ liệu"}
                </div>
                {dailySummary?.calo_muc_tieu !== undefined &&
                  dailySummary?.calo_muc_tieu !== null && (
                    <div>
                      Calo mục tiêu: {dailySummary.calo_muc_tieu} kcal
                    </div>
                  )}
                <div>
                  Cập nhật:{" "}
                  {summaryLoading
                    ? "..."
                    : new Date(dailySummary?.updated_at ?? selectedDate)
                        .toLocaleString("vi-VN")}
                </div>
              </div>
              <div className="space-y-2">
                {dailyMeals.length === 0 ? (
                  <p className="text-xs text-slate-500">
                    Chưa có bữa ăn nào cho ngày này.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {dailyMeals.map((meal: any) => (
                      <li
                        key={meal.id}
                        className="rounded-lg border border-slate-200 px-3 py-2"
                      >
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-slate-800">
                            {getMealTypeLabel(meal)}
                          </span>
                          <span className="text-xs text-slate-500">
                            {getMealTime(meal)}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500">
                          {meal.meal_name || meal.ten_mon || "Bữa ăn"} •{" "}
                          {Number(
                            meal.total_calories ?? meal.luong_calories ?? 0
                          )}{" "}
                          kcal
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </Card>
        </aside>
      </div>

      {selectedMeal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-lg font-bold mb-4">Sửa bữa ăn</h2>
            <div className="space-y-3">
              <label className="block">
                <div className="text-sm mb-1">Tên bữa ăn</div>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              </label>
              <p className="text-sm text-gray-600">
                Ngày: {selectedMeal.time.split("T")[0]} | Giờ:{" "}
                {selectedMeal.time.split("T")[1]?.slice(0, 5) || "00:00"}
              </p>
              <p className="text-sm text-gray-600">
                Calories: {editCal} | P{editP}/C{editC}/F{editF}
              </p>
            </div>
            <div className="mt-6 flex gap-3">
              <Button onClick={handleUpdateMeal} className="flex-1">
                Cập nhật
              </Button>
              <Button
                onClick={handleDeleteMeal}
                variant="danger"
                className="flex-1"
              >
                Xóa
              </Button>
              <Button
                onClick={closeModal}
                variant="ghost"
                className="flex-1"
              >
                Đóng
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
