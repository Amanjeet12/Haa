import { apiBaseUrl } from '../config/environment';
import { apiRequest } from './client';

export type AiAnalysisQuestion = {
  ai_analysis_question_id: number;
  question: string;
  question_type: 'single_choice' | 'multiple_choice' | 'text';
  options: string[];
  isRequired: boolean;
  display_order: number;
};

type QuestionsResponse = {
  success: number | string;
  msg: string;
  data: AiAnalysisQuestion[];
};

export async function getAiAnalysisQuestions(token: string) {
  const response = await apiRequest<QuestionsResponse>(
    `${apiBaseUrl}/customer/ai-analysis-questions`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (Number(response.success) !== 1 || !Array.isArray(response.data)) {
    throw new Error(response.msg || 'Unable to load questionnaire.');
  }
  return response.data.sort((a, b) => a.display_order - b.display_order);
}
