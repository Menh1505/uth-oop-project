import type { DailyHealthSummary, MacroBreakdown } from "../types/responses.js";

export function formatInsights(daily: DailyHealthSummary[], macro: MacroBreakdown): string[] {
  if (!daily.length) return [];
  const insights: string[] = [];
  const averageBalance = average(daily.map((d) => d.calorieBalance));
  if (averageBalance < 0) {
    insights.push(`Bạn đang thâm hụt trung bình ${Math.abs(Math.round(averageBalance))} kcal trong giai đoạn này.`);
  } else if (averageBalance > 0) {
    insights.push(`Bạn đang dư thừa trung bình ${Math.abs(Math.round(averageBalance))} kcal trong giai đoạn này.`);
  }

  if (macro.proteinPercentage < 20) {
    insights.push("Tỷ lệ protein của bạn thấp hơn khuyến nghị, hãy cân nhắc bổ sung thêm protein.");
  }

  const avgMeals = average(daily.map((d) => d.mealsLoggedCount));
  if (avgMeals < 3) {
    insights.push("Bạn chưa ghi đủ 3 bữa/ngày, hãy hoàn thành để duy trì streak.");
  }

  const latest = daily[daily.length - 1];
  if (latest.healthScore < 60) {
    insights.push("Điểm sức khỏe gần nhất khá thấp, hãy cân bằng lại kế hoạch ăn uống & tập luyện.");
  }

  return insights;
}

function average(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}
