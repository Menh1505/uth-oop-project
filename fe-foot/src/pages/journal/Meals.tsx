import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { useEffect, useState } from "react";
import { useAppStore } from "../../store/useAppStore";
import type { MealLog } from "../../types";

const MEAL_BASE = `http://localhost:3000/api/meals`;
type MealType = "Breakfast" | "Lunch" | "Dinner" | "Snack";

export default function Meals() {
  const { meals, addMeal, fetchMeals } = useAppStore();

  // ----- Khung 2: ghi nhanh bữa ăn (macro) -----
  const [mealName, setMealName] = useState("Chicken Bowl");
  const [mealCal, setMealCal] = useState(520);
  const [p, setP] = useState(40);
  const [c, setC] = useState(45);
  const [f, setF] = useState(15);

  // ----- Khung 1: tạo bữa ăn (metadata – CreateMealPayload) -----
  const today = new Date().toISOString().slice(0, 10);
  const nowTime = new Date().toISOString().slice(11, 16);

  const [newMealName, setNewMealName] = useState("Bữa ăn mới");
  const [newMealType, setNewMealType] = useState<MealType>("Lunch");
  const [newMealDate, setNewMealDate] = useState(today);
  const [newMealTime, setNewMealTime] = useState(nowTime);
  const [newMealNotes, setNewMealNotes] = useState("");

  const [creating, setCreating] = useState(false);

  // ----- Khung 3: GET meal -----
  const [queryMeals, setQueryMeals] = useState<MealLog[]>([]);
  const [queryDate, setQueryDate] = useState(today);
  const [rangeStart, setRangeStart] = useState(today);
  const [rangeEnd, setRangeEnd] = useState(today);
  const [loadingQuery, setLoadingQuery] = useState(false);

  // ----- Modal state edit/delete -----
  const [selectedMeal, setSelectedMeal] = useState<MealLog | null>(null);
  const [editName, setEditName] = useState("");
  const [editCal, setEditCal] = useState(0);
  const [editP, setEditP] = useState(0);
  const [editC, setEditC] = useState(0);
  const [editF, setEditF] = useState(0);

  const handleScan = (file?: File) => {
    if (!file) return;
    addMeal({
      name: `Scanned: ${file.name}`,
      calories: 400,
      protein: 20,
      carbs: 50,
      fat: 10,
    });
    alert("Đã quét & thêm bữa ăn (mock)!");
  };

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
        await fetchMeals();
        setQueryMeals([]); // reset filter
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
        await fetchMeals();
        setQueryMeals([]);
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
  const handleCreateMeal = async () => {
  const token =
    localStorage.getItem("authToken") ||
    localStorage.getItem("accessToken");

  if (!token) {
    alert("Chưa đăng nhập");
    return;
  }
  if (!newMealName.trim()) {
    alert("Nhập tên bữa ăn");
    return;
  }

  const url = `${MEAL_BASE}/`; // chú ý có dấu / ở cuối

  console.log("CreateMeal URL:", url);

  setCreating(true);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        meal_name: newMealName,
        meal_type: newMealType,
        meal_date: newMealDate,
        meal_time: newMealTime,
        notes: newMealNotes || undefined,
      }),
    });

    console.log("CreateMeal status:", res.status);

    if (!res.ok) {
      alert("Tạo bữa ăn thất bại");
      return;
    }

    alert("Tạo bữa ăn thành công");
    await fetchMeals();
    setQueryMeals([]);
    setNewMealName("Bữa ăn mới");
    setNewMealNotes("");
  } catch (e) {
    console.error("Create meal error:", e);
    alert("Lỗi tạo bữa ăn (không gọi được server/Nginx)");
  } finally {
    setCreating(false);
  }
};


  // ----- Query meals -----
  const parseMealsResponse = async (res: Response): Promise<MealLog[]> => {
    const json = await res.json();
    console.log("📦 RAW RESPONSE FROM API:", json);
    if (Array.isArray(json)) return json as MealLog[];
    if (Array.isArray(json.meals)) return json.meals as MealLog[];
    return [];
  };

  const handleGetAllMeals = async () => {
    setLoadingQuery(true);
    try {
      await fetchMeals();
      setQueryMeals([]); // dùng list mặc định từ store
    } finally {
      setLoadingQuery(false);
    }
  };

  const handleGetMealsByDate = async () => {
    const token =
      localStorage.getItem("authToken") ||
      localStorage.getItem("accessToken");
    if (!token) {
      alert("Chưa đăng nhập");
      return;
    }
    setLoadingQuery(true);
    try {
      const res = await fetch(`/api/meals/date/${queryDate}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        alert("Lấy bữa ăn theo ngày thất bại");
        return;
      }
      const data = await parseMealsResponse(res);
      setQueryMeals(data);
    } catch (e) {
      console.error("Get meals by date error:", e);
      alert("Lỗi lấy bữa ăn theo ngày");
    } finally {
      setLoadingQuery(false);
    }
  };

  const handleGetMealsByRange = async () => {
    const token =
      localStorage.getItem("authToken") ||
      localStorage.getItem("accessToken");
    if (!token) {
      alert("Chưa đăng nhập");
      return;
    }
    setLoadingQuery(true);
    try {
      const res = await fetch(
        `/api/meals/range/${rangeStart}/${rangeEnd}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!res.ok) {
        alert("Lấy bữa ăn theo khoảng ngày thất bại");
        return;
      }
      const data = await parseMealsResponse(res);
      setQueryMeals(data);
    } catch (e) {
      console.error("Get meals by range error:", e);
      alert("Lỗi lấy bữa ăn theo khoảng ngày");
    } finally {
      setLoadingQuery(false);
    }
  };

  useEffect(() => {
    // load toàn bộ bữa ăn khi vào page
    fetchMeals().catch(() => {});
  }, [fetchMeals]);

  const rawMeals = queryMeals.length > 0 ? queryMeals : meals;
  const displayMeals = rawMeals.filter(
    (m) => (m as any).meal_name || (m as any).meal_date || (m as any).meal_type
  );

  return (
    <Card title="Quản lý bữa ăn">
      {/* 3 khung chính */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Khung 1: Tạo bữa ăn (CreateMealPayload) */}
        <section className="border rounded-xl p-4 bg-white shadow-sm">
          <h2 className="font-semibold mb-3">Tạo bữa ăn</h2>
          <div className="space-y-3">
            <label className="block">
              <div className="text-sm mb-1">Tên bữa ăn</div>
              <Input
                value={newMealName}
                onChange={(e) => setNewMealName(e.target.value)}
              />
            </label>

            <label className="block">
              <div className="text-sm mb-1">Loại bữa ăn</div>
              <select
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={newMealType}
                onChange={(e) =>
                  setNewMealType(e.target.value as MealType)
                }
              >
                <option value="Breakfast">Breakfast</option>
                <option value="Lunch">Lunch</option>
                <option value="Dinner">Dinner</option>
                <option value="Snack">Snack</option>
              </select>
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <div className="text-sm mb-1">Ngày</div>
                <Input
                  type="date"
                  value={newMealDate}
                  onChange={(e) => setNewMealDate(e.target.value)}
                />
              </label>
              <label className="block">
                <div className="text-sm mb-1">Giờ</div>
                <Input
                  type="time"
                  value={newMealTime}
                  onChange={(e) => setNewMealTime(e.target.value)}
                />
              </label>
            </div>

            <label className="block">
              <div className="text-sm mb-1">Ghi chú</div>
              <textarea
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                rows={3}
                value={newMealNotes}
                onChange={(e) => setNewMealNotes(e.target.value)}
                placeholder="Thêm ghi chú nếu cần..."
              />
            </label>

            <Button
              onClick={handleCreateMeal}
              disabled={creating}
              className="w-full mt-2"
            >
              {creating ? "Đang tạo..." : "Tạo bữa ăn"}
            </Button>
          </div>
        </section>

        {/* Khung 2: Ghi nhanh bữa ăn (macro) */}
        <section className="border rounded-xl p-4 bg-white shadow-sm">
          <h2 className="font-semibold mb-3">Ghi nhanh bữa ăn</h2>
          <div className="grid grid-cols-1 gap-3">
            <label className="block">
              <div className="text-sm mb-1">Tên</div>
              <Input
                value={mealName}
                onChange={(e) => setMealName(e.target.value)}
              />
            </label>
            <label className="block">
              <div className="text-sm mb-1">Calories</div>
              <Input
                type="number"
                value={mealCal}
                onChange={(e) =>
                  setMealCal(Number(e.target.value) || 0)
                }
              />
            </label>
            <div className="grid grid-cols-3 gap-3">
              <label className="block">
                <div className="text-sm mb-1">Protein (g)</div>
                <Input
                  type="number"
                  value={p}
                  onChange={(e) =>
                    setP(Number(e.target.value) || 0)
                  }
                />
              </label>
              <label className="block">
                <div className="text-sm mb-1">Carbs (g)</div>
                <Input
                  type="number"
                  value={c}
                  onChange={(e) =>
                    setC(Number(e.target.value) || 0)
                  }
                />
              </label>
              <label className="block">
                <div className="text-sm mb-1">Fat (g)</div>
                <Input
                  type="number"
                  value={f}
                  onChange={(e) =>
                    setF(Number(e.target.value) || 0)
                  }
                />
              </label>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <Button
              onClick={() =>
                addMeal({
                  name: mealName,
                  calories: mealCal,
                  protein: p,
                  carbs: c,
                  fat: f,
                })
              }
            >
              Thêm bữa ăn
            </Button>
            <label className="cursor-pointer text-sm px-3 py-2 border rounded-md hover:bg-gray-50 flex items-center">
              Quét barcode/ảnh
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) =>
                  handleScan(e.target.files?.[0] || undefined)
                }
              />
            </label>
          </div>
        </section>

        {/* Khung 3: GET meal */}
        <section className="border rounded-xl p-4 bg-white shadow-sm">
          <h2 className="font-semibold mb-3">Lấy bữa ăn</h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="text-sm font-medium">Tất cả</div>
              <Button
                variant="secondary"
                onClick={handleGetAllMeals}
                disabled={loadingQuery}
              >
                {loadingQuery ? "Đang tải..." : "Tải tất cả từ server"}
              </Button>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium">Theo ngày</div>
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={queryDate}
                  onChange={(e) => setQueryDate(e.target.value)}
                />
                <Button
                  onClick={handleGetMealsByDate}
                  disabled={loadingQuery}
                >
                  Lấy
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium">Theo khoảng ngày</div>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="date"
                  value={rangeStart}
                  onChange={(e) => setRangeStart(e.target.value)}
                />
                <Input
                  type="date"
                  value={rangeEnd}
                  onChange={(e) => setRangeEnd(e.target.value)}
                />
              </div>
              <Button
                onClick={handleGetMealsByRange}
                disabled={loadingQuery}
                className="mt-2"
              >
                Lấy theo khoảng
              </Button>
            </div>
          </div>
        </section>
      </div>

      {/* Danh sách bữa ăn */}
      <ul className="mt-6 space-y-2">
  {displayMeals.map((m) => {
    const meal: any = m; // vì MealLog đang chưa update hết field

    return (
      <li
        key={meal.id}
        className="border rounded-lg p-3 hover:bg-gray-50 cursor-pointer"
        onClick={() => openEditModal(meal)}
      >
        <div className="flex justify-between items-start">
          <div>
            {/* Tên bữa ăn */}
            <div className="font-semibold text-base">
              {meal.meal_name || "Bữa ăn"}
            </div>

            {/* Loại bữa ăn */}
            <div className="text-sm text-gray-600 mt-1">
              Loại: {meal.meal_type || "—"}
            </div>

            {/* Ngày / giờ */}
            <div className="text-sm text-gray-600">
              Ngày: {meal.meal_date || "—"}
              {meal.meal_time && ` • ${meal.meal_time}`}
            </div>

            {/* Ghi chú */}
            {meal.notes && (
              <div className="text-sm text-gray-500 mt-1 italic">
                Ghi chú: {meal.notes}
              </div>
            )}
          </div>

          {/* ID rút gọn */}
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
    <li className="text-sm text-gray-500">Chưa có bữa ăn nào.</li>
  )}
</ul>


      {/* Modal Edit/Delete */}
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
                variant="destructive"
                className="flex-1"
              >
                Xóa
              </Button>
              <Button
                onClick={closeModal}
                variant="secondary"
                className="flex-1"
              >
                Đóng
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
