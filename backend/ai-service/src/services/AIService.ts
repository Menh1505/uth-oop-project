import OpenAI from 'openai';
import { aiConfig } from '../config/config.js';
import logger from '../config/logger.js';
import { IUser, IUserGoal, IAICoachRequest, IAICoachResponse } from '../types/index.js';

export class AIService {
  private static openai: OpenAI;

  static initialize() {
    if (!aiConfig.openaiApiKey) {
      throw new Error('OPENAI_API_KEY is required');
    }

    this.openai = new OpenAI({
      apiKey: aiConfig.openaiApiKey,
    });

    logger.info('AI Service initialized with OpenAI');
  }

  static buildNutritionCoachPrompt(user: IUser, userGoals: IUserGoal[], question?: string): string {
    const userInfo = this.formatUserInfo(user);
    const goalsInfo = this.formatUserGoals(userGoals);
    
    const systemPrompt = `
Bạn là một huấn luyện viên dinh dưỡng chuyên nghiệp và thân thiện. Nhiệm vụ của bạn là đưa ra lời khuyên dinh dưỡng cá nhân hóa dựa trên thông tin người dùng.

THÔNG TIN NGƯỜI DÙNG:
${userInfo}

MỤC TIÊU CỦA NGƯỜI DÙNG:
${goalsInfo}

HƯỚNG DẪN TRẢ LỜI:
- Trả lời bằng tiếng Việt
- Đưa ra lời khuyên thiết thực và có thể thực hiện
- Tập trung vào dinh dưỡng phù hợp với mục tiêu và thông số cơ thể
- Đề xuất thực phẩm cụ thể và kế hoạch ăn uống
- Giải thích lý do tại sao những lời khuyên này phù hợp
- Giữ cho lời khuyên ngắn gọn nhưng đầy đủ thông tin (200-400 từ)
- Có thể đề xuất các bước tiếp theo hoặc theo dõi tiến độ

${question ? `CÂUHỎI CỤ THỂ: ${question}` : 'Hãy đưa ra lời khuyên dinh dưỡng tổng quát phù hợp với thông tin và mục tiêu của người dùng.'}
`;

    return systemPrompt;
  }

  private static formatUserInfo(user: IUser): string {
    const info = [];
    
    info.push(`- Tên: ${user.name}`);
    if (user.age) info.push(`- Tuổi: ${user.age} tuổi`);
    if (user.gender) info.push(`- Giới tính: ${user.gender}`);
    if (user.weight) info.push(`- Cân nặng: ${user.weight} kg`);
    if (user.height) info.push(`- Chiều cao: ${user.height} cm`);
    if (user.fitness_goal) info.push(`- Mục tiêu thể hình: ${user.fitness_goal}`);
    if (user.preferred_diet) info.push(`- Chế độ ăn ưa thích: ${user.preferred_diet}`);
    info.push(`- Gói đăng ký: ${user.subscription_status}`);

    // Tính BMI nếu có đủ thông tin
    if (user.weight && user.height) {
      const bmi = user.weight / Math.pow(user.height / 100, 2);
      info.push(`- BMI: ${bmi.toFixed(1)}`);
    }

    return info.join('\n');
  }

  private static formatUserGoals(userGoals: IUserGoal[]): string {
    if (!userGoals || userGoals.length === 0) {
      return 'Không có mục tiêu cụ thể được thiết lập';
    }

    return userGoals.map(goal => {
      const progress = `${goal.progress_percentage.toFixed(1)}%`;
      const currentValue = goal.current_value || 0;
      const targetValue = goal.target_value;
      
      return `- ${goal.goal.title}: ${goal.goal.description}
  Mục tiêu: ${targetValue} ${goal.goal.target_metric}
  Hiện tại: ${currentValue} ${goal.goal.target_metric}
  Tiến độ: ${progress}
  Trạng thái: ${goal.status}
  Thời gian: ${goal.start_date} đến ${goal.end_date}`;
    }).join('\n\n');
  }

  static async generateNutritionAdvice(request: IAICoachRequest): Promise<IAICoachResponse> {
    try {
      const prompt = this.buildNutritionCoachPrompt(
        request.user,
        request.userGoals,
        request.question
      );

      logger.info('Generating AI nutrition advice', { 
        userId: request.user.user_id,
        goalsCount: request.userGoals.length,
        hasQuestion: !!request.question
      });

      const response = await this.openai.chat.completions.create({
        model: aiConfig.openaiModel,
        messages: [
          {
            role: 'system',
            content: prompt
          }
        ],
        max_tokens: aiConfig.maxTokens,
        temperature: aiConfig.temperature,
      });

      const advice = response.choices[0]?.message?.content;

      if (!advice) {
        throw new Error('No response generated from AI');
      }

      logger.info('AI nutrition advice generated successfully', { 
        userId: request.user.user_id,
        responseLength: advice.length,
        tokensUsed: response.usage?.total_tokens
      });

      return {
        success: true,
        message: 'Nutrition advice generated successfully',
        advice: advice.trim(),
        recommendations: this.extractRecommendations(advice)
      };

    } catch (error: any) {
      logger.error('Failed to generate nutrition advice', { 
        error: error.message,
        userId: request.user.user_id 
      });

      return {
        success: false,
        message: 'Failed to generate nutrition advice',
        error: error.message
      };
    }
  }

  private static extractRecommendations(advice: string): string[] {
    // Simple extraction of bullet points or numbered items
    const lines = advice.split('\n');
    const recommendations: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.match(/^[-*•]\s/) || trimmed.match(/^\d+\.\s/)) {
        recommendations.push(trimmed.replace(/^[-*•]\s/, '').replace(/^\d+\.\s/, ''));
      }
    }

    return recommendations.slice(0, 5); // Limit to 5 recommendations
  }

  static async healthCheck(): Promise<boolean> {
    try {
      // Simple health check by making a minimal API call
      await this.openai.models.list();
      return true;
    } catch (error) {
      logger.error('AI Service health check failed', { error });
      return false;
    }
  }
}