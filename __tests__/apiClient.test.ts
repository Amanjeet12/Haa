import { apiRequest } from '../src/api/client';

test('shows the API response message for a failed report analysis request', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = jest.fn().mockResolvedValue({
    ok: false,
    status: 502,
    headers: { get: () => 'application/json' },
    json: async () => ({
      success: 0,
      msg: 'Unable to process PDF 1: Unable to download the report PDF',
    }),
  }) as typeof fetch;

  try {
    await expect(apiRequest('/customer/report-analyses')).rejects.toThrow(
      'Unable to process PDF 1: Unable to download the report PDF',
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});
