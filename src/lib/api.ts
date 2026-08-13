// ─── API Client ─────────────────────────────────────────────────────────────────

export interface ApiResult<T> {
  data?: T;
  error?: string;
}

async function post<T>(url: string, body: unknown): Promise<ApiResult<T>> {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const json = await res.json() as T & { error?: string };
    if (!res.ok) {
      return { error: (json as { error?: string }).error ?? 'حدث خطأ' };
    }
    return { data: json };
  } catch {
    return { error: 'تعذّر الاتصال بالخادم' };
  }
}

export const api = {
  createRoom: (playerId: string, playerName: string) =>
    post<{ room: unknown; code: string }>('/api/room/create', { playerId, playerName }),

  joinRoom: (code: string, playerId: string, playerName: string) =>
    post<{ room: unknown; playerId: string; role: string }>('/api/room/join', {
      code,
      playerId,
      playerName,
    }),

  sendAction: (roomCode: string, action: unknown) =>
    post<{ success: boolean; message?: string; gameState?: unknown }>(
      `/api/room/${roomCode}/action`,
      action
    ),

  sendChat: (roomCode: string, playerId: string, playerName: string, content: string) =>
    post<{ message: unknown }>(`/api/room/${roomCode}/chat`, {
      playerId,
      playerName,
      content,
    }),

  saveReflection: (roomCode: string, playerId: string, content: string) =>
    post<{ reflectionId: number; saved: boolean; analysis?: string }>(`/api/room/${roomCode}/reflect`, {
      playerId,
      content,
    }),

  getState: (roomCode: string, playerId: string) =>
    fetch(`/api/room/${roomCode}/state?playerId=${encodeURIComponent(playerId)}`)
      .then((r) => r.json())
      .catch(() => null),
};

// Generate a browser-persistent player ID
export function getOrCreatePlayerId(): string {
  if (typeof window === 'undefined') return '';
  const stored = localStorage.getItem('wof_player_id');
  if (stored) return stored;
  const id = `p_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  localStorage.setItem('wof_player_id', id);
  return id;
}
