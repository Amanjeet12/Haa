import { appConfig } from '../config/app';

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly payload?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type RequestOptions = RequestInit & {
  timeoutMs?: number;
};

export async function apiRequest<T>(
  url: string,
  options: RequestOptions = {},
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    options.timeoutMs ?? appConfig.apiTimeoutMs,
  );

  try {
    if (__DEV__) {
      console.log('[API request]', {
        url,
        method: options.method ?? 'GET',
        body: options.body,
      });
    }

    const isFormData =
      typeof FormData !== 'undefined' && options.body instanceof FormData;
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...options.headers,
      },
    });

    const contentType = response.headers.get('content-type');
    const payload = contentType?.includes('application/json')
      ? await response.json()
      : await response.text();

    if (__DEV__) {
      console.log('[API response]', {
        url,
        status: response.status,
        ok: response.ok,
        body: payload,
      });
    }

    if (!response.ok) {
      throw new ApiError(
        'The request could not be completed.',
        response.status,
        payload,
      );
    }

    return payload as T;
  } catch (error) {
    if (__DEV__) {
      console.error('[API error]', { url, error });
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}
