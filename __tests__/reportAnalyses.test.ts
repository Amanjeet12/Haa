import { analyzeReport, uploadReportPdf } from '../src/api/reportAnalyses';
import { apiRequest } from '../src/api/client';

jest.mock('../src/api/client', () => ({ apiRequest: jest.fn() }));

const request = apiRequest as jest.Mock;

beforeEach(() => request.mockReset());

test('submits questionnaire answers without PDF URLs when none were selected', async () => {
  request.mockResolvedValue({ success: 1, msg: 'ok', data: { analysis: {} } });
  await analyzeReport('token', 228, {
    questionnaire_answers: [
      { ai_analysis_question_id: 1, answer: 'Yes' },
      { ai_analysis_question_id: 2, answer: ['Fatigue', 'Sleep changes'] },
    ],
  });
  const [url, options] = request.mock.calls[0];
  expect(url).toContain('/customer/report-analyses/228');
  expect(options.method).toBe('POST');
  expect(JSON.parse(options.body)).toEqual({
    consent_to_ai_processing: true,
    force: false,
    questionnaire_answers: [
      { ai_analysis_question_id: 1, answer: 'Yes' },
      { ai_analysis_question_id: 2, answer: ['Fatigue', 'Sleep changes'] },
    ],
  });
});

test('includes uploaded PDF URLs when supplied', async () => {
  request.mockResolvedValue({ success: 1, msg: 'ok', data: { analysis: {} } });
  await analyzeReport('token', 228, {
    pdf_urls: ['https://example.com/report.pdf'],
    questionnaire_answers: [{ ai_analysis_question_id: 3, answer: 'Tired' }],
  });
  expect(JSON.parse(request.mock.calls[0][1].body).pdf_urls).toEqual([
    'https://example.com/report.pdf',
  ]);
});

test('submits PDF-only analysis without a booking ID', async () => {
  request.mockResolvedValue({ success: 1, msg: 'ok', data: { analysis: {} } });
  await analyzeReport('token', undefined, {
    family_member_id: 19,
    report_date: '2026-10-24',
    pdf_urls: ['https://example.com/report.pdf'],
    questionnaire_answers: [{ ai_analysis_question_id: 1, answer: 'Yes' }],
  });
  const [url, options] = request.mock.calls[0];
  expect(url).toMatch(/\/customer\/report-analyses$/);
  expect(JSON.parse(options.body)).toEqual({
    consent_to_ai_processing: true,
    family_member_id: 19,
    report_date: '2026-10-24',
    pdf_urls: ['https://example.com/report.pdf'],
    questionnaire_answers: [{ ai_analysis_question_id: 1, answer: 'Yes' }],
  });
});

test('uploads a PDF as multipart form data and returns its URL', async () => {
  request.mockResolvedValue({
    success: 1,
    data: { url: 'https://example.com/report.pdf' },
  });
  await expect(
    uploadReportPdf('token', { uri: 'content://report', name: 'report.pdf' }),
  ).resolves.toBe('https://example.com/report.pdf');
  expect(request.mock.calls[0][0]).toMatch(/\/upload$/);
  expect(request.mock.calls[0][1].body).toBeInstanceOf(FormData);
});
