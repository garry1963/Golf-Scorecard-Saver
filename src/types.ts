export type HolesCount = 18;
export type RoundsCount = 2 | 4;

export interface ScoreEntry {
  hole_number: number;
  score: number | null; // null if not played yet
  par?: number; // e.g. 3, 4, 5 (default 4 if not set)
}

export interface Round {
  id: string;
  player_name: string;
  course_name: string; // Represents Tournament Name
  date: string; // ISO string or YYYY-MM-DD
  holes: number; // Always 18
  completed: boolean;
  total_score: number;
  front_9_score: number;
  back_9_score: number;
  scores: Record<number, number | null>; // hole_number -> score
  pars?: Record<number, number>; // hole_number -> par
  created_at: number;
  updated_at: number;
  num_rounds?: number; // 2 or 4
  round_number?: number; // 1, 2, 3, or 4
  tournament_id?: string;
  userId?: string;
}

export type ThemeMode = 'light' | 'dark' | 'sunlight';

export interface AppSettings {
  defaultNumRounds: RoundsCount;
  themeMode: ThemeMode;
  autoSave: boolean;
  defaultPlayerName: string;
  defaultPar: number;
  hapticEnabled: boolean;
}

export type ActiveTab = 'scorecards' | 'new_round' | 'settings';

export type ScreenState = 
  | { type: 'tabs'; tab: ActiveTab }
  | { type: 'score_entry'; roundId: string; holeNumber: number }
  | { type: 'round_summary'; roundId: string }
  | { type: 'view_round'; roundId: string };
