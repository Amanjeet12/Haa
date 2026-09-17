import { Platform } from 'react-native';

import { apiBaseUrl } from '../config/environment';
import { apiRequest } from './client';

export type SupportAttachment = {
  type: string;
  url: string;
  mime_type?: string;
  name?: string;
};

export type SupportMessage = {
  message_id: string;
  text: string;
  createdAt: string;
  sender_type: 'customer' | 'admin' | 'lab' | 'phlebo' | string;
  attachments: SupportAttachment[];
};

export type SupportTicket = {
  support_id: number;
  booking_order_id: number | null;
  type: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  photo: string | null;
  messages: SupportMessage[];
  createdAt: string;
  updatedAt: string;
};

type SupportListResponse = {
  success: number | string;
  msg?: string;
  data: SupportTicket[];
};

export type SupportRequestInput = {
  type: string;
  subject: string;
  description: string;
  priority: string;
  message: string;
  bookingOrderId?: string;
  photo?: { remoteUrl: string; type?: string; fileName?: string } | null;
};

type SupportMutationResponse = {
  success: number | string;
  msg?: string;
  data?: SupportTicket;
};

type UploadResponse = {
  success?: number | string;
  msg?: string;
  url?: string;
  location?: string;
  fileUrl?: string;
  data?: string | { url?: string; location?: string; fileUrl?: string };
};

export async function getSupportTickets(token: string) {
  const response = await apiRequest<SupportListResponse>(
    `${apiBaseUrl}/customer/support/all`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (Number(response.success) !== 1 || !Array.isArray(response.data)) {
    throw new Error(response.msg || 'Unable to load support requests.');
  }
  return response.data;
}

export async function createSupportTicket(
  token: string,
  input: SupportRequestInput,
) {
  const photo = input.photo;
  const payload: Record<string, unknown> = {
    type: input.type,
    subject: input.subject.trim(),
    description: input.description.trim(),
    priority: input.priority,
    photo: photo?.remoteUrl || null,
    text: input.message.trim(),
    attachments: photo?.remoteUrl
      ? [
          {
            type: 'image',
            url: photo.remoteUrl,
            mime_type: photo.type || 'image/jpeg',
            name: photo.fileName || 'support-image.jpg',
          },
        ]
      : [],
    meta: {
      source: 'customer_app',
      device: Platform.OS,
    },
  };
  if (input.bookingOrderId) {
    payload.booking_order_id = Number(input.bookingOrderId);
  }

  const response = await apiRequest<SupportMutationResponse>(
    `${apiBaseUrl}/customer/support/create`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    },
  );
  if (Number(response.success) !== 1) {
    throw new Error(response.msg || 'Unable to create support request.');
  }
  return response.data;
}

export async function replyToSupportTicket(
  token: string,
  supportId: number,
  text: string,
  photo?: { remoteUrl: string; type?: string; fileName?: string } | null,
) {
  const response = await apiRequest<SupportMutationResponse>(
    `${apiBaseUrl}/customer/support/reply/${supportId}`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        text: text.trim(),
        attachments: photo?.remoteUrl
          ? [
              {
                type: 'image',
                url: photo.remoteUrl,
                mime_type: photo.type || 'image/jpeg',
                name: photo.fileName || 'support-image.jpg',
              },
            ]
          : [],
      }),
    },
  );
  if (Number(response.success) !== 1) {
    throw new Error(response.msg || 'Unable to send reply.');
  }
  return response.data;
}

export async function uploadSupportPhoto(
  token: string,
  file: { uri: string; type?: string; fileName?: string },
) {
  const body = new FormData();
  body.append('file', {
    uri: file.uri,
    type: file.type ?? 'image/jpeg',
    name: file.fileName ?? `support-${Date.now()}.jpg`,
  } as unknown as Blob);
  const response = await apiRequest<UploadResponse>(`${apiBaseUrl}/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body,
    timeoutMs: 30_000,
  });
  const nested = typeof response.data === 'object' ? response.data : undefined;
  const url =
    (typeof response.data === 'string' ? response.data : undefined) ??
    nested?.url ??
    nested?.location ??
    nested?.fileUrl ??
    response.url ??
    response.location ??
    response.fileUrl;
  if (!url)
    throw new Error(response.msg || 'Image upload did not return a URL.');
  return url;
}
