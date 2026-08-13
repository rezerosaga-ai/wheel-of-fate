/**
 * Player stats & achievements — shared between HomeScreen and SessionEnd.
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

export function getPlayerStats(): PlayerStats {
  if (typeof window === 'undefined') return defaultStats();
  try {
    const raw = localStorage.getItem('wof-stats');
    return raw ? (JSON.parse(raw) as PlayerStats) : defaultStats();
  } catch {
    return defaultStats();
  }
}

export function recordSession(lovePoints: number): PlayerStats {
  const stats = getPlayerStats();
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();

  stats.totalSessions++;
  stats.totalLovePoints += lovePoints;

  if (stats.lastPlayedDate === today) {
    // already played today — no streak change
  } else if (stats.lastPlayedDate === yesterday) {
    stats.currentStreak++;
  } else {
    stats.currentStreak = 1;
  }
  stats.lastPlayedDate = today;
  stats.longestStreak = Math.max(stats.longestStreak, stats.currentStreak);

  // Achievements check
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

  try {
    localStorage.setItem('wof-stats', JSON.stringify(stats));
  } catch { /* storage quota */ }

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
