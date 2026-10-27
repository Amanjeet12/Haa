type SessionExpiryListener = () => void;

let listener: SessionExpiryListener | null = null;

export function subscribeToSessionExpiry(nextListener: SessionExpiryListener) {
  listener = nextListener;
  return () => {
    if (listener === nextListener) listener = null;
  };
}

export function notifySessionExpired(status: number, payload: unknown) {
  if (status !== 403 || !payload || typeof payload !== 'object') return;
  const message = (payload as { msg?: unknown; message?: unknown }).msg ??
    (payload as { message?: unknown }).message;
  if (typeof message === 'string' && /session expired/i.test(message)) {
    listener?.();
  }
}
