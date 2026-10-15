import { apiBaseUrl } from '../config/environment';
import { apiRequest } from './client';

export type ReportFinding = {
  marker: string;
  value: number | string;
  unit: string;
  reference_range: string;
  status: string;
  explanation: string;
};

export type ReportTrend = {
  marker: string;
  unit: string;
  points: Array<{
    date: string;
    value: number;
    status: string;
    booking_id: number;
  }>;
  latest_value: number | null;
  previous_value: number | null;
  change: number | null;
};

export type ReportAnalysis = {
  report_analysis_id: number;
  booking_id: number;
  report_date: string;
  source_pdf_urls: string[];
  status: string;
  analyzed_at: string;
  analysis: {
    headline: string;
    summary: string;
    findings: ReportFinding[];
    recommendations: string[];
    questions_for_clinician: string[];
    urgent_attention: string[];
    disclaimer: string;
  };
  trends: ReportTrend[];
};

type UploadResponse = {
  success?: number | string;
  msg?: string;
  url?: string;
  location?: string;
  fileUrl?: string;
  data?: string | { url?: string; location?: string; fileUrl?: string };
};

export async function uploadReportPdf(
  token: string,
  file: { uri: string; name: string },
) {
  const body = new FormData();
  body.append('file', {
    uri: file.uri,
    type: 'application/pdf',
    name: file.name,
  } as unknown as Blob);
  const response = await apiRequest<UploadResponse>(`${apiBaseUrl}/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body,
    timeoutMs: 60_000,
  });
  if (response.success !== undefined && Number(response.success) !== 1) {
    throw new Error(response.msg || 'Unable to upload PDF.');
  }
  const nested = typeof response.data === 'object' ? response.data : undefined;
  const url =
    (typeof response.data === 'string' ? response.data : undefined) ??
    nested?.url ??
    nested?.location ??
    nested?.fileUrl ??
    response.url ??
    response.location ??
    response.fileUrl;
  if (!url) throw new Error(response.msg || 'PDF upload did not return a URL.');
  return url;
}

export async function analyzeReport(
  token: string,
  bookingId: number,
  input: {
    pdf_urls?: string[];
    questionnaire_answers: Array<{
      ai_analysis_question_id: number;
      answer: string | string[];
    }>;
  },
) {
  const response = await apiRequest<{
    success: number | string;
    msg: string;
    data: ReportAnalysis;
  }>(`${apiBaseUrl}/customer/report-analyses/${bookingId}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      consent_to_ai_processing: true,
      force: false,
      ...(input.pdf_urls?.length ? { pdf_urls: input.pdf_urls } : {}),
      questionnaire_answers: input.questionnaire_answers,
    }),
    timeoutMs: 120_000,
  });
  if (Number(response.success) !== 1 || !response.data?.analysis) {
    throw new Error(response.msg || 'Unable to analyze report.');
  }
  return response.data;
}
