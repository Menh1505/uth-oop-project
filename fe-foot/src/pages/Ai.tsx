import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { useAppStore } from "../store/useAppStore";
import { useState, useEffect } from "react";
import { ApiClient } from "../lib/api/client";

interface Recommendation {
  id: string;
  type: string;
  title: string;
  description: string;
  calories?: number;
  durationMin?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
}

interface NutritionAdviceResponse {
  success: boolean;
  advice: string;
  recommendations: string[];
  user: {
    name: string;
    goals_count: number;
  };
}

interface AskCoachResponse {
  success: boolean;
  question: string;
  answer: string;
  user: {
    name: string;
  };
}

interface ChatMessage {
  id: string;
  type: 'user' | 'coach';
  content: string;
  timestamp: string;
}

export default function Ai() {
  const { profile, addMeal, addWorkout } = useAppStore();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // AI Coach states
  const [nutritionAdvice, setNutritionAdvice] = useState<NutritionAdviceResponse | null>(null);
  const [adviceLoading, setAdviceLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    if (profile) {
      fetchRecommendations();
      fetchNutritionAdvice();
    }
  }, [profile]);

  const fetchNutritionAdvice = async (specificQuestion?: string) => {
    try {
      setAdviceLoading(true);
      const response = await ApiClient.post<NutritionAdviceResponse>('/ai/nutrition-advice', {
        question: specificQuestion || undefined
      });
      setNutritionAdvice(response);
    } catch (err) {
      console.error('Error fetching nutrition advice:', err);
    } finally {
      setAdviceLoading(false);
    }
  };

  const askCoach = async (userQuestion: string) => {
    if (!userQuestion.trim()) return;
    
    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      type: 'user',
      content: userQuestion,
      timestamp: new Date().toISOString()
    };
    
    setChatMessages(prev => [...prev, userMessage]);
    setChatLoading(true);
    setQuestion("");
    
    try {
      const response = await ApiClient.post<AskCoachResponse>('/ai/ask-coach', {
        question: userQuestion
      });
      
      const coachMessage: ChatMessage = {
        id: `coach_${Date.now()}`,
        type: 'coach',
        content: response.answer,
        timestamp: new Date().toISOString()
      };
      
      setChatMessages(prev => [...prev, coachMessage]);
    } catch (err) {
      const errorMessage: ChatMessage = {
        id: `error_${Date.now()}`,
        type: 'coach',
        content: 'Xin lỗi, tôi không thể trả lời câu hỏi này lúc này. Vui lòng thử lại sau.',
        timestamp: new Date().toISOString()
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleQuestionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    askCoach(question);
  };
  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      setError("");
      const userId = (profile as any)?.id ?? (profile as any)?.userId ?? 0;
      // Backend recommendation-service exposes GET /recommendations/daily/:userId
      const res: any = await ApiClient.get(`/recommendations/daily/${userId}`);
      const rec = res?.recommendation || res?.recommendations || [];
      const mapped: Recommendation[] = Array.isArray(rec)
        ? rec
        : [
            {
              id: String(rec.recommendation_id || "rec_1"),
              type: rec.type || "meal",
              title: rec.title || "Gợi ý bữa ăn",
              description: rec.content || "",
              calories: rec.calories,
              protein: rec.protein,
              carbs: rec.carbs,
              fat: rec.fat,
            },
          ];
      setRecommendations(mapped || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi tải gợi ý");
      useMockSuggestions();
    } finally {
      setLoading(false);
    }
  };

  const useMockSuggestions = () => {
    if (!profile) return;
    const cheap = (profile as any).budgetPerMeal < 90000;
    const baseMeal =
      (profile as any).diet === "vegan"
        ? { name: "Vegan Protein Bowl", calories: 520, protein: 28, carbs: 65, fat: 12 }
        : { name: "Chicken Brown Rice", calories: 550, protein: 40, carbs: 55, fat: 14 };
    const meal = cheap ? { ...baseMeal, name: baseMeal.name + " (Budget)" } : baseMeal;

    let workout = { name: "Full-body 30m", caloriesBurned: 250, durationMin: 30 };
    if ((profile as any).goal === "gain_muscle") workout = { name: "Strength 30m", caloriesBurned: 180, durationMin: 30 };
    if ((profile as any).goal === "lose_fat") workout = { name: "HIIT 30m", caloriesBurned: 300, durationMin: 30 };
    if ((profile as any).goal === "endurance") workout = { name: "Zone2 30m", caloriesBurned: 240, durationMin: 30 };

    setRecommendations([
      {
        id: "meal_1",
        type: "meal",
        title: meal.name,
        description: `${meal.calories} kcal · P${meal.protein}/C${meal.carbs}/F${meal.fat}`,
        calories: meal.calories,
        protein: meal.protein,
        carbs: meal.carbs,
        fat: meal.fat,
      },
      {
        id: "workout_1",
        type: "workout",
        title: workout.name,
        description: `~${workout.caloriesBurned} kcal đốt`,
        calories: workout.caloriesBurned,
        durationMin: workout.durationMin,
      },
    ]);
  };

  const mealRec = recommendations.find((r) => r.type === "meal");
  const workoutRec = recommendations.find((r) => r.type === "workout");

  if (!profile) return null;

  return (
    <div className="space-y-6">
      {/* AI Nutrition Coach Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="🤖 AI Nutrition Coach">
          {adviceLoading ? (
            <div className="text-gray-500 text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              Đang tư vấn dinh dưỡng...
            </div>
          ) : nutritionAdvice ? (
            <div className="space-y-4">
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                <h4 className="font-medium text-blue-900 mb-2">Lời khuyên dinh dưỡng</h4>
                <p className="text-blue-800 text-sm">{nutritionAdvice.advice}</p>
              </div>
              
              {nutritionAdvice.recommendations && nutritionAdvice.recommendations.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900">Gợi ý thực hiện:</h4>
                  <ul className="space-y-1">
                    {nutritionAdvice.recommendations.map((tip, index) => (
                      <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                        <span className="text-green-500 mt-1">•</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => fetchNutritionAdvice()}
                className="w-full"
              >
                🔄 Lấy lời khuyên mới
              </Button>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-500 mb-4">Chưa có lời khuyên dinh dưỡng</p>
              <Button onClick={() => fetchNutritionAdvice()}>
                Lấy lời khuyên AI
              </Button>
            </div>
          )}
        </Card>

        <Card title="💬 Hỏi đáp với Coach">
          <div className="space-y-4">
            {/* Chat Messages */}
            <div className="max-h-60 overflow-y-auto space-y-3 border rounded-lg p-3 bg-gray-50">
              {chatMessages.length === 0 ? (
                <div className="text-center text-gray-500 py-4">
                  <p className="mb-2">👋 Chào bạn!</p>
                  <p className="text-sm">Hãy đặt câu hỏi về dinh dưỡng, tập luyện, hoặc sức khỏe nhé!</p>
                </div>
              ) : (
                chatMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs px-4 py-2 rounded-lg text-sm ${
                        message.type === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white border text-gray-800'
                      }`}
                    >
                      {message.content}
                    </div>
                  </div>
                ))
              )}
              
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border rounded-lg px-4 py-2 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <div className="animate-bounce w-1 h-1 bg-gray-400 rounded-full"></div>
                      <div className="animate-bounce w-1 h-1 bg-gray-400 rounded-full delay-100"></div>
                      <div className="animate-bounce w-1 h-1 bg-gray-400 rounded-full delay-200"></div>
                      <span className="ml-2">Coach đang suy nghĩ...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Question Input */}
            <form onSubmit={handleQuestionSubmit} className="flex gap-2">
              <Input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Đặt câu hỏi cho AI Coach..."
                disabled={chatLoading}
                className="flex-1"
              />
              <Button 
                type="submit" 
                disabled={!question.trim() || chatLoading}
                size="sm"
              >
                {chatLoading ? '⏳' : '➤'}
              </Button>
            </form>
          </div>
        </Card>
      </div>

      {/* Original Recommendations Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="🍽️ Ăn gì hôm nay?">
          {error && <div className="text-yellow-700 text-xs mb-2">Lỗi: {error}</div>}
          {loading ? (
            <div className="text-gray-500">Đang tải gợi ý...</div>
          ) : mealRec ? (
            <>
              <p className="text-sm text-gray-700 mb-3">
                <b>{mealRec.title}</b> — {mealRec.description}
              </p>
              <Button
                onClick={() =>
                  addMeal({
                    name: mealRec.title,
                    calories: mealRec.calories || 0,
                    protein: mealRec.protein || 0,
                    carbs: mealRec.carbs || 0,
                    fat: mealRec.fat || 0,
                  })
                }
              >
                Thêm vào Journal
              </Button>
            </>
          ) : (
            <p className="text-sm text-gray-500">Không có gợi ý</p>
          )}
        </Card>

        <Card title="🏃‍♀️ Tập gì trong 30 phút?">
          {error && <div className="text-yellow-700 text-xs mb-2">Lỗi: {error}</div>}
          {loading ? (
            <div className="text-gray-500">Đang tải gợi ý...</div>
          ) : workoutRec ? (
            <>
              <p className="text-sm text-gray-700 mb-3">
                <b>{workoutRec.title}</b> — {workoutRec.description}
              </p>
              <Button
                onClick={() =>
                  addWorkout({
                    name: workoutRec.title,
                    caloriesBurned: workoutRec.calories || 0,
                    durationMin: workoutRec.durationMin || 30,
                  })
                }
              >
                Thêm vào Journal
              </Button>
            </>
          ) : (
            <p className="text-sm text-gray-500">Không có gợi ý</p>
          )}
        </Card>
      </div>
    </div>
  );
}
