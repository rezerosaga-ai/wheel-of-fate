// QA Harness — Real-HTTP Client Simulator
// يمر عبر نفس مسارات HTTP التي يستخدمها العملاء الحقيقيون (REST + polling + SSE)
// لا يستدعي دوال game-logic الداخلية إطلاقًا. منفصل تمامًا عن منطق الإنتاج.
import { EventEmitter } from 'events';

export interface ActionPayload {
  type: string;
  playerId: string;
  [key: string]: unknown;
}

export class QAClient extends EventEmitter {
  constructor(
    public readonly name: string,
    public readonly playerId: string,
    private base: string,
  ) {
    super();
  }

  // ── Room lifecycle ────────────────────────────────────────────────────────
  async createRoom(playerName: string) {
    const res = await fetch(`${this.base}/api/room/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId: this.playerId, playerName }),
    });
    return { status: res.status, body: (await res.json()) as Record<string, unknown> };
  }

  async joinRoom(code: string, playerName: string) {
    const res = await fetch(`${this.base}/api/room/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, playerId: this.playerId, playerName }),
    });
    return { status: res.status, body: (await res.json()) as Record<string, unknown> };
  }

  // ── Actions ───────────────────────────────────────────────────────────────
  async action(payload: ActionPayload) {
    const code = (payload as { code?: string }).code;
    if (!code) throw new Error(`action() requires code in payload for ${this.name}`);
    const res = await fetch(`${this.base}/api/room/${code}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, playerId: this.playerId }),
    });
    return { status: res.status, body: (await res.json()) as Record<string, unknown> };
  }

  // ── State polling (مثل polling الحقيقي 800ms-3s) ──────────────────────────
  async fetchState(code: string) {
    const res = await fetch(`${this.base}/api/room/${code}/state?playerId=${this.playerId}`);
    return { status: res.status, body: (await res.json()) as Record<string, unknown> };
  }

  // ── SSE stream listener (للإشعارات اللحظية) ───────────────────────────────
  private sseAbort: AbortController | null = null;
  listenStream(code: string) {
    this.stopStream();
    const ac = new AbortController();
    this.sseAbort = ac;
    void this.streamLoop(`${this.base}/api/room/${code}/stream?playerId=${this.playerId}`, ac.signal);
  }
  private async streamLoop(url: string, signal: AbortSignal) {
    try {
      const res = await fetch(url, { headers: { Accept: 'text/event-stream' }, signal });
      if (!res.body) return;
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const parts = buf.split('\n\n');
        buf = parts.pop() ?? '';
        for (const raw of parts) {
          const dataLine = raw.split('\n').map((l) => l.replace(/^data:/, '').trim()).join('\n');
          if (raw.includes('event: state')) this.emit('state-pushed', dataLine);
          else this.emit('stream', dataLine);
        }
      }
    } catch {
      this.emit('stream-error');
    }
  }
  stopStream() {
    this.sseAbort?.abort();
    this.sseAbort = null;
  }

  // ── Chat ──────────────────────────────────────────────────────────────────
  async chat(code: string, content: string, messageType = 'text') {
    const res = await fetch(`${this.base}/api/room/${code}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        playerId: this.playerId,
        playerName: this.name,
        content,
        messageType,
      }),
    });
    return { status: res.status, body: (await res.json()) as Record<string, unknown> };
  }

  // ── Reflection ────────────────────────────────────────────────────────────
  async reflect(code: string, content: string) {
    const res = await fetch(`${this.base}/api/room/${code}/reflect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId: this.playerId, content }),
    });
    return { status: res.status, body: (await res.json()) as Record<string, unknown> };
  }

  // ── Adaptive follow-up (GET /api/room/[code]/reflect?playerId=...) ──────────
  async adaptiveQuestions(code: string) {
    const res = await fetch(`${this.base}/api/room/${code}/reflect?playerId=${this.playerId}`);
    return { status: res.status, body: (await res.json()) as Record<string, unknown> };
  }

  // ── Reconnect / refresh simulation ────────────────────────────────────────
  // refresh: إعادة تحميل الحالة من الصفر (مثل إعادة فتح الصفحة)
  async refresh(code: string) {
    this.stopStream();
    return this.fetchState(code);
  }
  // reconnect: انقطاع الشبكة ثم استعادة (نفس fetch لكن نحاكي غيابًا 15 ثانية)
  async simulateDisconnect() {
    this.stopStream();
  }
  async reconnect(code: string) {
    this.listenStream(code);
    return this.fetchState(code);
  }
}

export function uid(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
