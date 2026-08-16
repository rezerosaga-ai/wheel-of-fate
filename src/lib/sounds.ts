// ─── Wheel of Fate — Sound Engine ─────────────────────────────────────────────
// Pure Web Audio API — no dependencies, no files needed.
// Respects browser autoplay policy: sounds only after user gesture.

type AudioCtx = AudioContext & { _wofReady?: boolean };

let ctx: AudioCtx | null = null;

function getCtx(): AudioCtx | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    try {
      ctx = new (
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext
      )() as AudioCtx;
    } catch {
      return null;
    }
  }
  return ctx;
}

// Resume context after first user gesture
export function unlockAudio() {
  const c = getCtx();
  if (c && c.state === 'suspended') void c.resume();
}

// ─── Oscillator-based sound primitives ────────────────────────────────────────

function playTone(
  frequency: number,
  duration: number,
  type: OscillatorType = 'sine',
  volume = 0.25,
  delay = 0
) {
  const c = getCtx();
  if (!c) return;
  if (c.state === 'suspended') void c.resume();

  const osc = c.createOscillator();
  const gain = c.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(frequency, c.currentTime + delay);

  gain.gain.setValueAtTime(0, c.currentTime + delay);
  gain.gain.linearRampToValueAtTime(volume, c.currentTime + delay + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + delay + duration);

  osc.connect(gain);
  gain.connect(c.destination);
  osc.start(c.currentTime + delay);
  osc.stop(c.currentTime + delay + duration + 0.05);
}

function playChord(
  notes: number[],
  duration: number,
  type: OscillatorType = 'sine',
  volume = 0.15
) {
  notes.forEach((n, i) => playTone(n, duration, type, volume, i * 0.05));
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── BACKGROUND MUSIC ENGINE — نمط مرح وخفيف ─────────────────────────────────
// موسيقى خلفية بسيطة وخفيفة تشبه موسيقى ألعاب الحفلات (party quiz games)
// نغمات قصيرة إيقاعية بدون ضجيج — مستوحاة من أسلوب "chiptune kawaii"
// ═══════════════════════════════════════════════════════════════════════════════

interface MusicTrack {
  masterGain: GainNode;
  oscs: OscillatorNode[];
  stop: () => void;
  stopped: boolean;
}

let currentTrack: MusicTrack | null = null;
let musicVolume = 0.22;
let musicEnabled = true;
// R8: remember the last active theme so toggle() resumes the SAME mood
let lastTheme = 'default';

// ─── سلّم الموسيقى المرح (C major pentatonic) ────────────────────────────────
// الترددات: C4, D4, E4, G4, A4, C5, D5, E5
const HAPPY_SCALE = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25];

// ─── ألحان بسيطة لكل مزاج ────────────────────────────────────────────────────
type ThemeDef = { melody: number[]; tempo: number; bass: number };

const THEMES: Record<string, ThemeDef> = {
  default: {
    melody: [523.25, 587.33, 659.25, 523.25, 440.00, 523.25, 587.33, 440.00],
    tempo: 0.32,
    bass: 130.81, // C3
  },
  love: {
    melody: [392.00, 440.00, 523.25, 392.00, 440.00, 493.88, 523.25, 440.00],
    tempo: 0.38,
    bass: 196.00, // G3
  },
  laugh: {
    melody: [659.25, 587.33, 523.25, 659.25, 783.99, 659.25, 587.33, 523.25],
    tempo: 0.22,
    bass: 164.81, // E3
  },
  bold: {
    melody: [440.00, 493.88, 523.25, 587.33, 523.25, 440.00, 392.00, 440.00],
    tempo: 0.26,
    bass: 146.83, // D3
  },
  future: {
    melody: [523.25, 659.25, 587.33, 523.25, 440.00, 493.88, 523.25, 587.33],
    tempo: 0.40,
    bass: 130.81,
  },
  confession: {
    melody: [440.00, 392.00, 440.00, 493.88, 440.00, 392.00, 349.23, 392.00],
    tempo: 0.42,
    bass: 110.00, // A2
  },
  challenge: {
    melody: [329.63, 392.00, 440.00, 523.25, 440.00, 392.00, 329.63, 293.66],
    tempo: 0.25,
    bass: 164.81,
  },
  session_end: {
    melody: [523.25, 587.33, 659.25, 698.46, 659.25, 587.33, 523.25, 493.88],
    tempo: 0.44,
    bass: 130.81,
  },
};

function startMusicTrack(themeName: string): MusicTrack | null {
  const cMaybe = getCtx();
  if (!cMaybe) return null;
  if (cMaybe.state === 'suspended') void cMaybe.resume();
  const c: AudioContext = cMaybe;

  const theme = THEMES[themeName] ?? THEMES.default;
  const { melody, tempo, bass } = theme;

  // ── Master gain (fade in smoothly) ──────────────────────────────────────────
  const masterGain = c.createGain();
  masterGain.gain.setValueAtTime(0, c.currentTime);
  masterGain.gain.linearRampToValueAtTime(musicVolume, c.currentTime + 1.2);
  masterGain.connect(c.destination);

  // ── Low-pass filter لنعومة الصوت ────────────────────────────────────────────
  const lpf = c.createBiquadFilter();
  lpf.type = 'lowpass';
  lpf.frequency.value = 2400;
  lpf.connect(masterGain);

  const oscs: OscillatorNode[] = [];
  let arpTimer: ReturnType<typeof setTimeout> | null = null;
  let bassTimer: ReturnType<typeof setTimeout> | null = null;
  let stopped = false;

  // ── إيقاع باس خفيف (نبضة كل مقياسين) ────────────────────────────────────────
  let bassStep = 0;
  function scheduleBass() {
    if (stopped) return;
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = 'triangle';
    osc.frequency.value = bass * (bassStep % 2 === 0 ? 1 : 1.5);
    bassStep++;
    g.gain.setValueAtTime(0, c.currentTime);
    g.gain.linearRampToValueAtTime(0.06, c.currentTime + 0.03);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + tempo * 1.5);
    osc.connect(g);
    g.connect(lpf);
    osc.start(c.currentTime);
    osc.stop(c.currentTime + tempo * 1.6);
    bassTimer = setTimeout(scheduleBass, tempo * 2 * 1000);
  }
  bassTimer = setTimeout(scheduleBass, tempo * 1000);

  // ── لحن رئيسي — نغمات قصيرة ومرحة ──────────────────────────────────────────
  let step = 0;
  function scheduleMelody() {
    if (stopped) return;
    const note = melody[step % melody.length];
    step++;

    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = 'square';
    osc.frequency.value = note;

    // نعوّم الموجة المربعة بـ detune بسيط للصوت الكاواي
    osc.detune.value = (Math.random() - 0.5) * 8;

    const vol = 0.08 + Math.random() * 0.03;
    const dur = tempo * (0.55 + Math.random() * 0.15);

    g.gain.setValueAtTime(0, c.currentTime);
    g.gain.linearRampToValueAtTime(vol, c.currentTime + 0.015);
    g.gain.setValueAtTime(vol, c.currentTime + dur * 0.5);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);

    osc.connect(g);
    g.connect(lpf);
    osc.start(c.currentTime);
    osc.stop(c.currentTime + dur + 0.02);
    oscs.push(osc);

    // أحياناً نضيف نغمة octave رفيعة للمرح (1 من كل 4 نغمات)
    if (step % 4 === 0) {
      const osc2 = c.createOscillator();
      const g2 = c.createGain();
      osc2.type = 'sine';
      osc2.frequency.value = note * 2;
      g2.gain.setValueAtTime(0, c.currentTime + 0.01);
      g2.gain.linearRampToValueAtTime(vol * 0.4, c.currentTime + 0.03);
      g2.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur * 0.7);
      osc2.connect(g2);
      g2.connect(lpf);
      osc2.start(c.currentTime + 0.01);
      osc2.stop(c.currentTime + dur);
      oscs.push(osc2);
    }

    arpTimer = setTimeout(scheduleMelody, tempo * 1000);
  }
  arpTimer = setTimeout(scheduleMelody, 200);

  return {
    masterGain,
    oscs,
    stop: () => {
      stopped = true;
      if (arpTimer) clearTimeout(arpTimer);
      if (bassTimer) clearTimeout(bassTimer);
    },
    stopped: false,
  };
}

function stopCurrentTrack(fadeMs = 900) {
  if (!currentTrack) return;
  const track = currentTrack;
  currentTrack = null;
  track.stopped = true;
  track.stop();

  const c = getCtx();
  if (!c) return;

  track.masterGain.gain.cancelScheduledValues(c.currentTime);
  track.masterGain.gain.setValueAtTime(track.masterGain.gain.value, c.currentTime);
  track.masterGain.gain.linearRampToValueAtTime(0, c.currentTime + fadeMs / 1000);

  setTimeout(() => {
    track.oscs.forEach((osc) => {
      try { osc.stop(); } catch { /* already stopped */ }
    });
  }, fadeMs + 100);
}

// ─── Public BGM API ───────────────────────────────────────────────────────────
export const BGM = {
  play(theme: string = 'default') {
    if (!musicEnabled) return;
    const c = getCtx();
    if (!c) return;
    if (c.state === 'suspended') void c.resume();
    lastTheme = theme;
    stopCurrentTrack(700);
    setTimeout(() => {
      if (!musicEnabled) return;
      currentTrack = startMusicTrack(theme);
    }, currentTrack ? 600 : 0);
  },

  stop(fadeMs = 900) {
    stopCurrentTrack(fadeMs);
  },

  // R8 FIX: toggle resumes the LAST active theme instead of always resetting to default
  toggle(): boolean {
    musicEnabled = !musicEnabled;
    if (!musicEnabled) {
      stopCurrentTrack(400);
    } else {
      BGM.play(lastTheme);
    }
    return musicEnabled;
  },

  /** Read-only view of the active theme (for UI indicators). */
  currentTheme(): string {
    return lastTheme;
  },

  setVolume(v: number) {
    musicVolume = Math.max(0, Math.min(1, v));
    const c = getCtx();
    if (currentTrack && c) {
      currentTrack.masterGain.gain.cancelScheduledValues(c.currentTime);
      currentTrack.masterGain.gain.linearRampToValueAtTime(musicVolume, c.currentTime + 0.3);
    }
  },

  isEnabled: () => musicEnabled,
};

// ─── Noise burst helper (للنقرات والـ whoosh) ────────────────────────────────
function playNoise(
  durationSec: number,
  volume = 0.12,
  filterFreq = 800,
  filterQ = 1,
  delay = 0
) {
  const c = getCtx();
  if (!c) return;
  const bufSize = Math.ceil(c.sampleRate * durationSec);
  const buf = c.createBuffer(1, bufSize, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1);

  const src = c.createBufferSource();
  src.buffer = buf;

  const bpf = c.createBiquadFilter();
  bpf.type = 'bandpass';
  bpf.frequency.value = filterFreq;
  bpf.Q.value = filterQ;

  const gain = c.createGain();
  gain.gain.setValueAtTime(0, c.currentTime + delay);
  gain.gain.linearRampToValueAtTime(volume, c.currentTime + delay + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + delay + durationSec);

  src.connect(bpf);
  bpf.connect(gain);
  gain.connect(c.destination);
  src.start(c.currentTime + delay);
  src.stop(c.currentTime + delay + durationSec + 0.01);
}

// ─── Wheel tick — نقرة الإبرة على حافة كل شريحة ─────────────────────────────
// vol: 0-1 — يتراجع مع تباطؤ العجلة
// pitch: يتناقص مع تباطؤ العجلة (سريع = عالي، بطيء = منخفض)
export function wheelTick(normalizedSpeed: number) {
  const c = getCtx();
  if (!c) return;
  if (c.state === 'suspended') return;   // لا نُجبر resume هنا — tick متكرر

  const speed  = Math.max(0, Math.min(1, normalizedSpeed));
  const vol    = 0.06 + speed * 0.18;
  const pitch  = 300 + speed * 900;     // 300 Hz بطيء → 1200 Hz سريع
  const dur    = 0.025 + (1 - speed) * 0.04;

  // نقرة: نبضة noise قصيرة جداً
  playNoise(dur, vol * 0.7, pitch, 2.5);
  // + نغمة قصيرة جداً لإضافة النقاء
  playTone(pitch * 0.5, dur * 0.8, 'triangle', vol * 0.35);
}

// ─── Spin whoosh — صوت الانطلاق ───────────────────────────────────────────────
export function wheelWhoosh() {
  const c = getCtx();
  if (!c) return;
  if (c.state === 'suspended') void c.resume();

  // صوت صفير صاعد (pitch sweep up)
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(80, c.currentTime);
  osc.frequency.exponentialRampToValueAtTime(420, c.currentTime + 0.35);
  gain.gain.setValueAtTime(0, c.currentTime);
  gain.gain.linearRampToValueAtTime(0.10, c.currentTime + 0.04);
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.38);
  osc.connect(gain);
  gain.connect(c.destination);
  osc.start(c.currentTime);
  osc.stop(c.currentTime + 0.4);

  // + طبقة هواء (noise مفلتر)
  playNoise(0.32, 0.07, 500, 0.8);
}

// ─── Landing clunk — صوت التوقف المُرضي ──────────────────────────────────────
export function wheelLand(categoryColor?: string) {
  const c = getCtx();
  if (!c) return;
  if (c.state === 'suspended') void c.resume();

  // نبضة ضرب قصيرة
  playNoise(0.08, 0.22, 200, 1.2);
  playTone(140, 0.18, 'triangle', 0.14);

  // تأثير "snap" صغير بعده مباشرة
  setTimeout(() => {
    playTone(280, 0.06, 'triangle', 0.08);
  }, 30);

  // وتر احتفالي بناءً على اللون / حالة عامة
  setTimeout(() => {
    void categoryColor; // نستخدم وتر واحد موحّد
    playChord([523.25, 659.25, 783.99], 0.55, 'sine', 0.15);
    setTimeout(() => playTone(1046.5, 0.3, 'sine', 0.11), 160);
  }, 120);
}

// ─── Needle wobble tick — نقرات خفيفة أثناء التذبذب بعد التوقف ──────────────
export function wheelWobbleTick() {
  const c = getCtx();
  if (!c || c.state === 'suspended') return;
  playNoise(0.018, 0.04, 600, 3);
}

// ─── Sound effects ────────────────────────────────────────────────────────────

export const SFX = {
  spinStart: () => {
    const c = getCtx();
    if (!c) return;
    if (c.state === 'suspended') void c.resume();
    // whoosh انطلاق
    wheelWhoosh();
  },

  spinEnd: () => {
    // وتر انتهاء مبهج — يستدعى من GameRoom
    // wheelLand() يستدعى مباشرة من SpinWheel للدقة الزمنية
    playChord([523.25, 659.25, 783.99], 0.5, 'sine', 0.18);
    setTimeout(() => playTone(1046.5, 0.35, 'sine', 0.14), 180);
  },

  questionReveal: () => {
    playTone(659.25, 0.08, 'square', 0.10);
    setTimeout(() => playTone(783.99, 0.08, 'square', 0.10), 70);
    setTimeout(() => playTone(1046.5, 0.25, 'sine', 0.13), 140);
  },

  answerSubmit: () => {
    playTone(659.25, 0.07, 'sine', 0.14);
    setTimeout(() => playTone(783.99, 0.18, 'sine', 0.11), 55);
  },

  reactLove:     () => playChord([523.25, 659.25, 783.99], 0.45, 'sine', 0.16),
  reactLaugh:    () => {
    playTone(783.99, 0.09, 'square', 0.18);
    setTimeout(() => playTone(880.00, 0.12, 'square', 0.15), 65);
    setTimeout(() => playTone(1046.5, 0.18, 'square', 0.12), 130);
  },
  reactDeep:     () => playChord([440.00, 523.25, 659.25], 0.7, 'sine', 0.13),
  reactTouching: () => playChord([493.88, 587.33, 740.00], 0.65, 'sine', 0.14),
  reactBold:     () => {
    playTone(440.00, 0.09, 'square', 0.09);
    setTimeout(() => playTone(587.33, 0.18, 'square', 0.11), 75);
  },
  reactStar:     () => {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) =>
      playTone(f, 0.18, 'sine', 0.13, i * 0.055)
    );
  },

  fateCard: () => {
    playTone(392.00, 0.25, 'sine', 0.10);
    setTimeout(() => playChord([493.88, 587.33, 740.00], 0.7, 'sine', 0.12), 180);
  },

  challengeIssued: () => {
    const c = getCtx();
    if (!c) return;
    if (c.state === 'suspended') void c.resume();
    // صوت تحدي حيوي — يصعد بدلاً من أن ينزل
    [329.63, 392.00, 440.00, 523.25, 659.25].forEach((f, i) =>
      playTone(f, 0.16, 'square', 0.07, i * 0.065)
    );
    setTimeout(() => playChord([523.25, 659.25, 783.99], 0.5, 'sine', 0.13), 380);
  },

  challengeAnswered: () => {
    playTone(523.25, 0.09, 'sine', 0.11);
    setTimeout(() => playTone(659.25, 0.09, 'sine', 0.11), 75);
    setTimeout(() => playTone(783.99, 0.22, 'sine', 0.13), 150);
  },

  challengeComplete: () => {
    [440.00, 523.25, 587.33, 659.25, 783.99].forEach((f, i) =>
      playTone(f, 0.28, 'sine', 0.11, i * 0.065)
    );
  },

  pointsGained: () => {
    playTone(1046.5, 0.07, 'sine', 0.16);
    setTimeout(() => playTone(1318.5, 0.13, 'sine', 0.13), 55);
  },

  roundEnd: () => {
    playChord([523.25, 659.25, 783.99, 1046.5], 0.9, 'sine', 0.11);
  },

  dontLaugh: () => {
    for (let i = 0; i < 5; i++) {
      playTone(659.25 + i * 40, 0.10, 'square', 0.13, i * 0.055);
    }
  },

  categoryAmbience: (_category: string) => {
    // نغمة مرحة بسيطة لكل فئة
    playChord([523.25, 659.25, 783.99], 0.6, 'sine', 0.10);
  },
};

// Auto-unlock on first touch/click
if (typeof window !== 'undefined') {
  const unlock = () => { unlockAudio(); };
  window.addEventListener('touchstart', unlock, { once: true, passive: true });
  window.addEventListener('click', unlock, { once: true });
}
