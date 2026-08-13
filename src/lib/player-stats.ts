/**
 * Player stats & achievements
 * المرحلة 2: يخزّن في DB أولاً، ويستخدم localStorage كـ cache + fallback
 */

export interface PlayerStats {
  totalSessions: number;
  currentStreak: number;
  longestStreak: number;
  lastPlayedDate: string;
  totalLovePoints: number;
  achievements: string[];
}

function defaultStats(): PlayerStats {
  return {
    totalSessions: 0,
    currentStreak: 0,
    longestStreak: 0,
    lastPlayedDate: '',
    totalLovePoints: 0,
    achievements: [],
  };
}

// ─── Local cache helpers ─────────────────────────────────────────────────────
export function getPlayerStats(): PlayerStats {
  if (typeof window === 'undefined') return defaultStats();
  try {
    const raw = localStorage.getItem('wof-stats');
    return raw ? (JSON.parse(raw) as PlayerStats) : defaultStats();
  } catch {
    return defaultStats();
  }
}

function saveLocalStats(stats: PlayerStats) {
  try {
    localStorage.setItem('wof-stats', JSON.stringify(stats));
  } catch { /* storage quota */ }
}

// ─── DB sync — call after each session ──────────────────────────────────────
export async function recordSessionDB(playerId: string, lovePoints: number): Promise<{
  stats: PlayerStats;
  newAchievements: string[];
}> {
  try {
    const res = await fetch('/api/user/stats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId, lovePoints }),
    });
    if (res.ok) {
      const data = await res.json() as { stats: PlayerStats; newAchievements: string[] };
      saveLocalStats(data.stats);
      return data;
    }
  } catch { /* network error — fall back */ }

  // Fallback: compute locally
  const local = recordSession(lovePoints);
  return { stats: local, newAchievements: [] };
}

// ─── Load stats from DB (on app open) ────────────────────────────────────────
export async function loadStatsFromDB(playerId: string): Promise<PlayerStats> {
  try {
    const res = await fetch(`/api/user/stats?playerId=${encodeURIComponent(playerId)}`);
    if (res.ok) {
      const data = await res.json() as { stats: PlayerStats | null };
      if (data.stats) {
        saveLocalStats(data.stats);
        return data.stats;
      }
    }
  } catch { /* ignore */ }
  return getPlayerStats();
}

// ─── Local-only fallback (for SSR / no network) ──────────────────────────────
export function recordSession(lovePoints: number): PlayerStats {
  const stats = getPlayerStats();
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();

  stats.totalSessions++;
  stats.totalLovePoints += lovePoints;

  if (stats.lastPlayedDate === today) {
    // already played today
  } else if (stats.lastPlayedDate === yesterday) {
    stats.currentStreak++;
  } else {
    stats.currentStreak = 1;
  }
  stats.lastPlayedDate = today;
  stats.longestStreak = Math.max(stats.longestStreak, stats.currentStreak);

  const earned: string[] = [];
  if (stats.totalSessions === 1)   earned.push('first_session');
  if (stats.totalSessions === 5)   earned.push('five_sessions');
  if (stats.totalSessions === 10)  earned.push('ten_sessions');
  if (stats.currentStreak === 3)   earned.push('streak_3');
  if (stats.currentStreak === 7)   earned.push('streak_7');
  if (stats.totalLovePoints >= 50)  earned.push('love_50');
  if (stats.totalLovePoints >= 100) earned.push('love_100');
  earned.forEach((a) => {
    if (!stats.achievements.includes(a)) stats.achievements.push(a);
  });

  saveLocalStats(stats);
  return stats;
}

export const ACHIEVEMENT_META: Record<string, { emoji: string; label: string }> = {
  first_session:  { emoji: '🌱', label: 'البداية الجميلة' },
  five_sessions:  { emoji: '🌸', label: '5 جلسات معاً' },
  ten_sessions:   { emoji: '💎', label: '10 جلسات معاً' },
  streak_3:       { emoji: '🔥', label: '3 أيام متتالية' },
  streak_7:       { emoji: '⭐', label: 'أسبوع كامل' },
  love_50:        { emoji: '❤️', label: '50 لحظة حب' },
  love_100:       { emoji: '💝', label: '100 لحظة حب' },
};
