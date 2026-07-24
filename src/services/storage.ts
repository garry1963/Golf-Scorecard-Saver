import { Round, AppSettings, HolesCount, RoundsCount } from '../types';

const STORAGE_KEYS = {
  ROUNDS: 'golf_scorecard_rounds_v1',
  SETTINGS: 'golf_scorecard_settings_v1',
  RECENT_PLAYERS: 'golf_scorecard_recent_players',
  RECENT_COURSES: 'golf_scorecard_recent_courses',
};

export const DEFAULT_SETTINGS: AppSettings = {
  defaultNumRounds: 2,
  themeMode: 'light',
  autoSave: true,
  defaultPlayerName: '',
  defaultPar: 4,
  hapticEnabled: true,
};

// Initial sample rounds if storage is empty
const INITIAL_SAMPLE_ROUNDS: Round[] = [
  {
    id: 'sample-round-1',
    player_name: 'John Smith',
    course_name: 'Club Championship',
    date: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0],
    holes: 18,
    num_rounds: 4,
    round_number: 1,
    completed: true,
    total_score: 74,
    front_9_score: 37,
    back_9_score: 37,
    scores: {
      1: 4, 2: 4, 3: 3, 4: 5, 5: 4, 6: 4, 7: 5, 8: 3, 9: 5,
      10: 4, 11: 4, 12: 3, 13: 5, 14: 4, 15: 4, 16: 5, 17: 3, 18: 4
    },
    pars: {
      1: 4, 2: 4, 3: 3, 4: 5, 5: 4, 6: 4, 7: 5, 8: 3, 9: 4,
      10: 4, 11: 4, 12: 3, 13: 5, 14: 4, 15: 4, 16: 5, 17: 3, 18: 4
    },
    created_at: Date.now() - 86400000 * 2,
    updated_at: Date.now() - 86400000 * 2,
  },
  {
    id: 'sample-round-2',
    player_name: 'John Smith',
    course_name: 'Masters Tournament',
    date: new Date(Date.now() - 86400000 * 7).toISOString().split('T')[0],
    holes: 18,
    num_rounds: 2,
    round_number: 1,
    completed: false,
    total_score: 22,
    front_9_score: 22,
    back_9_score: 0,
    scores: {
      1: 4, 2: 5, 3: 4, 4: 4, 5: 5, 6: null, 7: null, 8: null, 9: null,
      10: null, 11: null, 12: null, 13: null, 14: null, 15: null, 16: null, 17: null, 18: null
    },
    pars: {
      1: 4, 2: 4, 3: 4, 4: 4, 5: 5, 6: 4, 7: 4, 8: 3, 9: 4,
      10: 4, 11: 4, 12: 3, 13: 5, 14: 4, 15: 4, 16: 5, 17: 3, 18: 4
    },
    created_at: Date.now() - 86400000 * 7,
    updated_at: Date.now() - 86400000 * 7,
  }
];

// Helper to calculate totals
export function calculateRoundTotals(scores: Record<number, number | null>, holes: number = 18): {
  total: number;
  front9: number;
  back9: number;
  playedHolesCount: number;
} {
  let total = 0;
  let front9 = 0;
  let back9 = 0;
  let playedHolesCount = 0;

  for (let h = 1; h <= holes; h++) {
    const s = scores[h];
    if (s !== null && s !== undefined && s > 0) {
      total += s;
      playedHolesCount++;
      if (h <= 9) {
        front9 += s;
      } else {
        back9 += s;
      }
    }
  }

  return { total, front9, back9, playedHolesCount };
}

// Storage operations
export function getStoredRounds(): Round[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ROUNDS);
    if (!raw) {
      // Seed initial rounds
      localStorage.setItem(STORAGE_KEYS.ROUNDS, JSON.stringify(INITIAL_SAMPLE_ROUNDS));
      return INITIAL_SAMPLE_ROUNDS;
    }
    const parsed: Round[] = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Error loading rounds from storage:', err);
    return INITIAL_SAMPLE_ROUNDS;
  }
}

export function saveRound(round: Round): Round {
  const rounds = getStoredRounds();
  const totals = calculateRoundTotals(round.scores, round.holes);
  
  const updatedRound: Round = {
    ...round,
    total_score: totals.total,
    front_9_score: totals.front9,
    back_9_score: totals.back9,
    completed: totals.playedHolesCount === round.holes,
    updated_at: Date.now(),
  };

  const existingIndex = rounds.findIndex((r) => r.id === updatedRound.id);
  if (existingIndex >= 0) {
    rounds[existingIndex] = updatedRound;
  } else {
    rounds.unshift(updatedRound);
  }

  try {
    localStorage.setItem(STORAGE_KEYS.ROUNDS, JSON.stringify(rounds));
    saveRecentPlayerAndCourse(updatedRound.player_name, updatedRound.course_name);
  } catch (err) {
    console.error('Error saving round:', err);
  }

  return updatedRound;
}

export function getRoundById(id: string): Round | null {
  const rounds = getStoredRounds();
  return rounds.find((r) => r.id === id) || null;
}

export function deleteRound(id: string): boolean {
  const rounds = getStoredRounds();
  const filtered = rounds.filter((r) => r.id !== id);
  try {
    localStorage.setItem(STORAGE_KEYS.ROUNDS, JSON.stringify(filtered));
    return true;
  } catch (err) {
    console.error('Error deleting round:', err);
    return false;
  }
}

export function duplicateRound(id: string): Round | null {
  const original = getRoundById(id);
  if (!original) return null;

  const now = new Date();
  const newId = 'round-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
  
  // Empty scores for a fresh new round on the same course
  const emptyScores: Record<number, number | null> = {};
  for (let i = 1; i <= original.holes; i++) {
    emptyScores[i] = null;
  }

  const duplicated: Round = {
    ...original,
    id: newId,
    date: now.toISOString().split('T')[0],
    completed: false,
    total_score: 0,
    front_9_score: 0,
    back_9_score: 0,
    scores: emptyScores,
    created_at: now.getTime(),
    updated_at: now.getTime(),
  };

  return saveRound(duplicated);
}

// Settings storage
export function getStoredSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch (err) {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings): AppSettings {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (err) {
    console.error('Error saving settings:', err);
  }
  return settings;
}

// Recent player & course autosuggestion helpers
export function getRecentPlayers(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.RECENT_PLAYERS);
    return raw ? JSON.parse(raw) : ['John Smith', 'Tiger Woods', 'Rory McIlroy'];
  } catch (err) {
    return ['John Smith'];
  }
}

export function getRecentCourses(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.RECENT_COURSES);
    return raw ? JSON.parse(raw) : ['Club Championship', 'Masters Tournament', 'PGA Championship', 'Open Championship'];
  } catch (err) {
    return ['Club Championship'];
  }
}

function saveRecentPlayerAndCourse(player: string, course: string) {
  if (player.trim()) {
    const players = getRecentPlayers().filter((p) => p.toLowerCase() !== player.trim().toLowerCase());
    players.unshift(player.trim());
    localStorage.setItem(STORAGE_KEYS.RECENT_PLAYERS, JSON.stringify(players.slice(0, 10)));
  }
  if (course.trim()) {
    const courses = getRecentCourses().filter((c) => c.toLowerCase() !== course.trim().toLowerCase());
    courses.unshift(course.trim());
    localStorage.setItem(STORAGE_KEYS.RECENT_COURSES, JSON.stringify(courses.slice(0, 10)));
  }
}

// CSV Export & Import
export function exportRoundsToCSV(): string {
  const rounds = getStoredRounds();
  const headers = ['ID', 'Date', 'Player', 'Course', 'Holes', 'Completed', 'Total Score', 'Front 9', 'Back 9', 'Hole Scores'];
  
  const rows = rounds.map((r) => {
    const holeScoresStr = Array.from({ length: r.holes }, (_, i) => `${i + 1}:${r.scores[i + 1] ?? '-'}`).join(';');
    return [
      `"${r.id}"`,
      `"${r.date}"`,
      `"${r.player_name.replace(/"/g, '""')}"`,
      `"${r.course_name.replace(/"/g, '""')}"`,
      r.holes,
      r.completed ? 'Yes' : 'No',
      r.total_score,
      r.front_9_score,
      r.back_9_score,
      `"${holeScoresStr}"`,
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

export function importRoundsFromCSV(csvText: string): { success: boolean; count: number; error?: string } {
  try {
    const lines = csvText.trim().split(/\r?\n/);
    if (lines.length < 2) {
      return { success: false, count: 0, error: 'CSV file appears empty or missing headers.' };
    }

    const rounds = getStoredRounds();
    let importedCount = 0;

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Basic regex parser for quoted CSV
      const parts = line.match(/(?:^|,)(?:"([^"]*)"|([^,]*))/g)?.map(p => p.replace(/^,?"?|"$/g, '')) || [];
      if (parts.length >= 7) {
        const date = parts[1] || new Date().toISOString().split('T')[0];
        const playerName = parts[2] || 'Player';
        const courseName = parts[3] || 'Golf Course';
        const holes = parseInt(parts[4], 10) === 9 ? 9 : 18;
        const totalScore = parseInt(parts[6], 10) || 0;
        
        const scores: Record<number, number | null> = {};
        for (let h = 1; h <= holes; h++) scores[h] = null;

        if (parts[9]) {
          const pairs = parts[9].split(';');
          pairs.forEach((p) => {
            const [hNum, hVal] = p.split(':');
            const h = parseInt(hNum, 10);
            if (h >= 1 && h <= holes && hVal !== '-' && hVal !== '' && !isNaN(parseInt(hVal, 10))) {
              scores[h] = parseInt(hVal, 10);
            }
          });
        }

        const totals = calculateRoundTotals(scores, holes);

        const newRound: Round = {
          id: 'imp-' + Date.now() + '-' + i,
          player_name: playerName,
          course_name: courseName,
          date: date,
          holes: holes as HolesCount,
          completed: totals.playedHolesCount === holes,
          total_score: totals.total || totalScore,
          front_9_score: totals.front9,
          back_9_score: totals.back9,
          scores: scores,
          created_at: Date.now(),
          updated_at: Date.now(),
        };

        rounds.unshift(newRound);
        importedCount++;
      }
    }

    if (importedCount > 0) {
      localStorage.setItem(STORAGE_KEYS.ROUNDS, JSON.stringify(rounds));
      return { success: true, count: importedCount };
    } else {
      return { success: false, count: 0, error: 'No valid round rows found in CSV.' };
    }
  } catch (err: any) {
    return { success: false, count: 0, error: err?.message || 'Failed to parse CSV file.' };
  }
}

export function clearAllData(): void {
  localStorage.removeItem(STORAGE_KEYS.ROUNDS);
  localStorage.removeItem(STORAGE_KEYS.SETTINGS);
  localStorage.removeItem(STORAGE_KEYS.RECENT_PLAYERS);
  localStorage.removeItem(STORAGE_KEYS.RECENT_COURSES);
}
