'use client';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { wheelTick, wheelWhoosh, wheelLand, wheelWobbleTick } from '@/lib/sounds';

export const WHEEL_CATEGORIES = [
  { id: 'love',         label: 'الحب',        emoji: '❤️', color: '#F4A8B8' },
  { id: 'relationship', label: 'علاقتنا',      emoji: '🫂', color: '#F9C8D3' },
  { id: 'personality',  label: 'الشخصية',      emoji: '🧠', color: '#A8C5E8' },
  { id: 'confessions',  label: 'اعترافات',     emoji: '🪞', color: '#C9B8E8' },
  { id: 'bold',         label: 'الجريئة',      emoji: '🔥', color: '#E8926A' },
  { id: 'future',       label: 'المستقبل',     emoji: '💭', color: '#B8D8C8' },
  { id: 'laugh',        label: 'الضحك',        emoji: '😂', color: '#F9D080' },
  { id: 'situations',   label: 'المواقف',      emoji: '🎭', color: '#E8D4A0' },
];

// ─── Easing functions (matching spinthewheel.io physics) ──────────────────────
// Rapid acceleration → long deceleration (cubic ease-out with initial punch)
function easeOutQuint(t: number): number {
  return 1 - Math.pow(1 - t, 5);
}

// Elastic overshoot at the very end for that satisfying "snap"
function easeOutBack(t: number, overshoot = 1.4): number {
  const c1 = overshoot;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

// Blend: mostly easeOutQuint, tiny overshoot at end
function wheelEase(t: number): number {
  if (t < 0.85) {
    return easeOutQuint(t / 0.85) * 0.88;
  }
  // last 15% — elastic snap
  const local = (t - 0.85) / 0.15;
  return 0.88 + easeOutBack(local, 0.25) * 0.12;
}

// ─── Particle system ───────────────────────────────────────────────────────────
interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  alpha: number; size: number; color: string;
  life: number; maxLife: number;
}

interface SpinWheelProps {
  spinning: boolean;
  targetCategory?: string | null;
  onSpinEnd?: (category: string) => void;
  size?: number;
  showLabel?: boolean;
}

export default function SpinWheel({
  spinning,
  targetCategory,
  onSpinEnd,
  size = 280,
  showLabel = true,
}: SpinWheelProps) {
  const canvasRef       = useRef<HTMLCanvasElement>(null);
  const animRef         = useRef<number>(0);
  const angleRef        = useRef<number>(0);
  const phaseRef        = useRef<'idle' | 'spinning' | 'landing' | 'done'>('idle');
  const spinStartRef    = useRef<number>(0);
  const spinFromRef     = useRef<number>(0);
  const spinToRef       = useRef<number>(0);
  const particlesRef    = useRef<Particle[]>([]);
  const needleSwayRef   = useRef<number>(0);    // needle wobble offset
  const lastSectorRef   = useRef<number>(-1);   // for tick sound tracking
  const idlePulseRef    = useRef<number>(0);    // idle breathing animation
  const onSpinEndRef    = useRef(onSpinEnd);
  const targetCatRef    = useRef(targetCategory);
  const lastWobbleTickRef = useRef<number>(0);  // timestamp of last wobble tick sound

  const SPIN_DURATION   = 3200;   // ms — feels weighty like spinthewheel.io
  const LANDING_FRAMES  = 18;     // frames of wobble after landing
  const landingFrameRef = useRef(0);

  const [resultCat, setResultCat] = useState<typeof WHEEL_CATEGORIES[0] | null>(null);
  const [showBurst, setShowBurst] = useState(false);

  const numSlices  = WHEEL_CATEGORIES.length;
  const sliceAngle = (2 * Math.PI) / numSlices;

  // Keep refs in sync without triggering re-render loops
  useEffect(() => { onSpinEndRef.current = onSpinEnd; }, [onSpinEnd]);
  useEffect(() => { targetCatRef.current = targetCategory; }, [targetCategory]);

  // ─── Determine current sector index from angle ──────────────────────────────
  function sectorAtAngle(angle: number): number {
    const norm = ((angle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    // needle at top = -π/2 in canvas coords; map to sector
    const adj = ((-angle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    return Math.floor(adj / sliceAngle) % numSlices;
  }

  // ─── Spawn burst particles at needle tip ────────────────────────────────────
  function spawnBurst(cx: number, cy: number, r: number, color: string) {
    const count = 28;
    const tipX  = cx;
    const tipY  = cy - r - 10;
    for (let i = 0; i < count; i++) {
      const angle = (Math.random() * Math.PI * 2);
      const speed = 1.5 + Math.random() * 3.5;
      particlesRef.current.push({
        x: tipX, y: tipY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5,
        alpha: 1, size: 2.5 + Math.random() * 3,
        color,
        life: 0, maxLife: 35 + Math.floor(Math.random() * 25),
      });
    }
    setShowBurst(true);
    setTimeout(() => setShowBurst(false), 1000);
  }

  // ─── Draw function ───────────────────────────────────────────────────────────
  const draw = useCallback((angle: number, needleSway = 0, idlePulse = 0) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const W   = canvas.width  / dpr;
    const H   = canvas.height / dpr;
    const cx  = W / 2;
    const cy  = H / 2;
    const r   = cx - 7 + idlePulse * 1.5;  // subtle idle breathing

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    // ── Outer glow ring ───────────────────────────────────────────────────────
    const isSpinningNow = phaseRef.current === 'spinning' || phaseRef.current === 'landing';
    ctx.save();
    ctx.shadowColor  = isSpinningNow ? 'rgba(232,143,160,0.7)' : 'rgba(217,108,131,0.25)';
    ctx.shadowBlur   = isSpinningNow ? 28 : 14;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, 2 * Math.PI);
    ctx.fillStyle = 'white';
    ctx.fill();
    ctx.restore();

    // ── Outer border ──────────────────────────────────────────────────────────
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, 2 * Math.PI);
    ctx.strokeStyle = isSpinningNow ? 'rgba(232,143,160,0.85)' : 'rgba(232,143,160,0.45)';
    ctx.lineWidth   = isSpinningNow ? 5 : 3.5;
    ctx.stroke();

    // ── Slices ─────────────────────────────────────────────────────────────────
    // UX-V02: RTL layout — categories advance counter-clockwise around the wheel
    // (first category sits just left of the needle, then the next CCW). Canvas arc()
    // with endA < startA draws counter-clockwise, matching sectorAtAngle math.
    WHEEL_CATEGORIES.forEach((cat, i) => {
      const startA = angle - Math.PI / 2 - i * sliceAngle;
      const endA   = startA - sliceAngle;
      const midA   = startA - sliceAngle / 2;

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r - 2, startA, endA);
      ctx.closePath();
      ctx.fillStyle = cat.color;
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.9)';
      ctx.lineWidth   = 2;
      ctx.stroke();

      // Emoji
      const emojiR = r * 0.74;
      ctx.save();
      ctx.translate(cx + emojiR * Math.cos(midA), cy + emojiR * Math.sin(midA));
      ctx.font = `${Math.floor(r * 0.135)}px serif`;
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(cat.emoji, 0, 0);
      ctx.restore();

      // Label — UX-005 FIX: rotate so Arabic text reads from outside → center
      // along the radial direction (never upside-down on the lower half).
      const labelR = r * 0.46;
      ctx.save();
      ctx.translate(cx + labelR * Math.cos(midA), cy + labelR * Math.sin(midA));
      // Rotating by (midA - π/2) aligns the +x axis with the outward radial,
      // so fillText draws bottom→top, readable from the rim inward.
      ctx.rotate(midA - Math.PI / 2);
      ctx.font         = `700 ${Math.floor(r * 0.08)}px Cairo, sans-serif`;
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle    = '#3D3035';
      ctx.fillText(cat.label, 0, 0);
      ctx.restore();
    });

    // ── Center hub ─────────────────────────────────────────────────────────────
    const cR = r * 0.16;
    ctx.beginPath();
    ctx.arc(cx, cy, cR, 0, 2 * Math.PI);
    const hubGrad = ctx.createRadialGradient(cx - cR * 0.3, cy - cR * 0.3, 0, cx, cy, cR);
    hubGrad.addColorStop(0, '#FFFFFF');
    hubGrad.addColorStop(0.4, '#FFE8EE');
    hubGrad.addColorStop(1, '#F4B6C2');
    ctx.fillStyle = hubGrad;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 3;
    ctx.stroke();
    // Hub emoji
    ctx.font         = `${Math.floor(cR * 1.25)}px serif`;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🎡', cx, cy);

    // ── Particles ──────────────────────────────────────────────────────────────
    particlesRef.current = particlesRef.current.filter((p) => p.life < p.maxLife);
    particlesRef.current.forEach((p) => {
      p.x    += p.vx;
      p.y    += p.vy;
      p.vy   += 0.12;    // gravity
      p.vx   *= 0.96;
      p.alpha = 1 - p.life / p.maxLife;
      p.life++;

      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle   = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, 2 * Math.PI);
      ctx.fill();
      ctx.restore();
    });

    // ── Needle (drawn after particles, stays on top) ──────────────────────────
    const needleX  = cx + needleSway;
    const needleY  = cy - r + 8;
    const nW = 12;
    const nH = 28;
    ctx.save();
    ctx.translate(needleX, cy - r - nH * 0.5);
    ctx.rotate(needleSway * 0.04);
    // Needle body
    ctx.beginPath();
    ctx.moveTo(-nW / 2, nH);
    ctx.lineTo(nW / 2, nH);
    ctx.lineTo(0, 0);
    ctx.closePath();
    const needleGrad = ctx.createLinearGradient(-nW / 2, 0, nW / 2, 0);
    needleGrad.addColorStop(0, '#E05575');
    needleGrad.addColorStop(0.5, '#FF7B9C');
    needleGrad.addColorStop(1, '#C84060');
    ctx.fillStyle = needleGrad;
    ctx.shadowColor = 'rgba(217,108,131,0.5)';
    ctx.shadowBlur  = 8;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth   = 1.5;
    ctx.stroke();
    // Needle base circle
    ctx.beginPath();
    ctx.arc(0, nH, 5, 0, 2 * Math.PI);
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowBlur = 0;
    ctx.fill();
    ctx.strokeStyle = 'rgba(217,108,131,0.6)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
  }, [numSlices, sliceAngle]);

  // ─── Animation loop ──────────────────────────────────────────────────────────
  useEffect(() => {
    let raf: number;

    function loop(now: number) {
      const phase = phaseRef.current;
      idlePulseRef.current = Math.sin(now * 0.001) * 0.5;  // slow breathing

      if (phase === 'idle') {
        angleRef.current += 0.0015;   // gentle idle rotation
        needleSwayRef.current *= 0.92;  // dampen any residual sway
        draw(angleRef.current, needleSwayRef.current, idlePulseRef.current);

      } else if (phase === 'spinning') {
        const elapsed  = now - spinStartRef.current;
        const progress = Math.min(elapsed / SPIN_DURATION, 1);
        const eased    = wheelEase(progress);
        const current  = spinFromRef.current + (spinToRef.current - spinFromRef.current) * eased;
        angleRef.current = current;

        // Needle sway proportional to angular velocity (fast spin = big sway)
        const velocity = (1 - progress) * 8;
        needleSwayRef.current = Math.sin(now * 0.04) * velocity;

        // Sector tick detection → play tick sound
        const sector = sectorAtAngle(current);
        if (sector !== lastSectorRef.current) {
          lastSectorRef.current = sector;
          // normalizedSpeed: 1 = full speed, 0 = stopped
          // eased progress goes 0→1, velocity peaks early then fades
          const rawSpeed = 1 - easeOutQuint(Math.min(progress / 0.7, 1));
          wheelTick(rawSpeed);
        }

        draw(current, needleSwayRef.current, 0);

        if (progress >= 1) {
          phaseRef.current    = 'landing';
          landingFrameRef.current = 0;
          // Resolve result
          const rawIdx = WHEEL_CATEGORIES.findIndex((c) => c.id === targetCatRef.current);
          const cat    = WHEEL_CATEGORIES[rawIdx === -1 ? 0 : rawIdx];
          setResultCat(cat);
          // Spawn burst at needle position
          const canvas = canvasRef.current;
          if (canvas) {
            const dpr = window.devicePixelRatio || 1;
            const cx  = (canvas.width  / dpr) / 2;
            const cy  = (canvas.height / dpr) / 2;
            const rr  = cx - 7;
            spawnBurst(cx, cy, rr, cat.color);
          }
          // Landing sound — clunk + fanfare
          wheelLand(cat.color);
          onSpinEndRef.current?.(cat.id);
        }

      } else if (phase === 'landing') {
        // Post-landing needle wobble: decaying oscillation
        landingFrameRef.current++;
        const f   = landingFrameRef.current;
        const decay = Math.exp(-f * 0.18);
        const prevSway = needleSwayRef.current;
        needleSwayRef.current = Math.sin(f * 0.7) * 12 * decay;

        // صوت نقرة عند كل تقاطع مع المركز (إشارة تغيير الاتجاه)
        if (prevSway * needleSwayRef.current < 0 && decay > 0.05) {
          // الإبرة عبرت المركز — نقرة خفيفة
          if (now - lastWobbleTickRef.current > 80) {
            wheelWobbleTick();
            lastWobbleTickRef.current = now;
          }
        }

        draw(angleRef.current, needleSwayRef.current, 0);
        if (f >= LANDING_FRAMES) {
          phaseRef.current       = 'done';
          needleSwayRef.current  = 0;
        }

      } else {
        // done — just idle draw
        draw(angleRef.current, 0, idlePulseRef.current * 0.3);
      }

      raf = requestAnimationFrame(loop);
    }

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draw]);

  // ─── React to spinning prop ───────────────────────────────────────────────────
  useEffect(() => {
    if (spinning && targetCategory) {
      // صوت الانطلاق
      wheelWhoosh();

      const targetIdx  = WHEEL_CATEGORIES.findIndex((c) => c.id === targetCategory);
      const safeIdx    = targetIdx === -1 ? 0 : targetIdx;
      // Random between 5–8 full rotations for drama
      const fullSpins  = (5 + Math.floor(Math.random() * 4)) * 2 * Math.PI;
      // Aim for middle of target slice, add tiny random offset within slice
      const sliceOffset = (Math.random() - 0.5) * sliceAngle * 0.5;
      const destAngle   = -(safeIdx * sliceAngle + sliceAngle / 2 + sliceOffset);
      // Travel at least fullSpins from current
      const from       = angleRef.current;
      const travelDist = fullSpins + ((destAngle - (from % (2 * Math.PI)) + 4 * Math.PI) % (2 * Math.PI));

      spinFromRef.current  = from;
      spinToRef.current    = from + travelDist;
      spinStartRef.current = performance.now();
      phaseRef.current     = 'spinning';
      lastSectorRef.current = -1;
      particlesRef.current  = [];
      setResultCat(null);
    } else if (!spinning) {
      if (phaseRef.current !== 'done' && phaseRef.current !== 'landing') {
        phaseRef.current = 'idle';
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spinning, targetCategory]);

  // ─── HiDPI canvas sizing ──────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr         = window.devicePixelRatio || 1;
    canvas.width       = size * dpr;
    canvas.height      = size * dpr;
    canvas.style.width  = `${size}px`;
    canvas.style.height = `${size}px`;
    draw(angleRef.current, 0, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size, draw]);

  const isActivelySpinning = phaseRef.current === 'spinning' || phaseRef.current === 'landing';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      {/* Wheel canvas — needle is now drawn inside canvas for perfect alignment */}
      <div style={{
        position: 'relative',
        width: size,
        height: size,
        transition: 'filter 500ms ease',
        filter: isActivelySpinning
          ? 'drop-shadow(0 0 24px rgba(232,143,160,0.75))'
          : 'drop-shadow(0 6px 20px rgba(61,48,53,0.12))',
      }}>
        <canvas
          ref={canvasRef}
          style={{ display: 'block', borderRadius: '50%' }}
        />

        {/* Outer ring pulse when spinning */}
        {isActivelySpinning && (
          <div style={{
            position: 'absolute', inset: -6,
            borderRadius: '50%',
            border: '3px solid rgba(232,143,160,0.4)',
            animation: 'spin-ring-pulse 0.8s ease-in-out infinite',
            pointerEvents: 'none',
          }} />
        )}
      </div>

      {/* Result badge — appears after spin with spring animation */}
      {showLabel && resultCat && (phaseRef.current === 'done' || phaseRef.current === 'landing') && (
        <div
          key={resultCat.id}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            background: `linear-gradient(135deg, ${resultCat.color}33, ${resultCat.color}66)`,
            border: `2.5px solid ${resultCat.color}`,
            borderRadius: 999,
            padding: '10px 26px',
            fontWeight: 800, fontSize: 17,
            color: 'var(--wof-text)',
            boxShadow: `0 6px 24px ${resultCat.color}55, 0 2px 0 rgba(255,255,255,0.5) inset`,
            animation: 'result-badge-in 450ms cubic-bezier(0.34,1.56,0.64,1) both',
          }}
        >
          <span style={{ fontSize: 22 }}>{resultCat.emoji}</span>
          <span>{resultCat.label}</span>
          <span style={{ fontSize: 16 }}>✨</span>
        </div>
      )}

      <style>{`
        @keyframes spin-ring-pulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50%       { opacity: 0.8; transform: scale(1.025); }
        }
        @keyframes result-badge-in {
          0%   { opacity: 0; transform: scale(0.5) translateY(10px); }
          70%  { transform: scale(1.08) translateY(-2px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}

export { WHEEL_CATEGORIES as CATEGORIES };
