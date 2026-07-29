import React, { useState, useEffect, useRef } from 'react';
import { Round, ThemeMode } from '../types';
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  List,
  Save,
  RotateCcw,
  Sparkles,
  ArrowLeft,
  Flag,
  User,
} from 'lucide-react';

interface ScoreEntryViewProps {
  round: Round;
  siblingRounds?: Round[];
  onSelectRound?: (roundId: string) => void;
  initialHoleNumber?: number;
  onUpdateScore: (holeNumber: number, newScore: number | null, par?: number) => void;
  onFinishRoundClick: () => void;
  onBackToScorecards: () => void;
  onOpenSummary: () => void;
  themeMode: ThemeMode;
  autoSaveEnabled?: boolean;
}

export const ScoreEntryView: React.FC<ScoreEntryViewProps> = ({
  round,
  siblingRounds = [],
  onSelectRound,
  initialHoleNumber = 1,
  onUpdateScore,
  onFinishRoundClick,
  onBackToScorecards,
  onOpenSummary,
  themeMode,
  autoSaveEnabled = true,
}) => {
  const [currentHole, setCurrentHole] = useState<number>(initialHoleNumber);
  const [saveIndicator, setSaveIndicator] = useState<boolean>(false);
  const progressScrollRef = useRef<HTMLDivElement>(null);

  const isSunlight = themeMode === 'sunlight';
  const isDark = themeMode === 'dark';

  const currentScore = round.scores[currentHole] ?? null;
  const currentPar = round.pars?.[currentHole] ?? 4;

  // Auto-scroll progress bar when hole changes
  useEffect(() => {
    if (progressScrollRef.current) {
      const activePill = progressScrollRef.current.querySelector(`#hole-pill-${currentHole}`);
      if (activePill) {
        activePill.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [currentHole]);

  // Handle score change with auto-save feedback
  const handleSetScore = (score: number | null) => {
    onUpdateScore(currentHole, score, currentPar);
    triggerSaveToast();
  };

  const handleIncrement = () => {
    const nextVal = currentScore === null ? currentPar : currentScore + 1;
    handleSetScore(nextVal);
  };

  const handleDecrement = () => {
    if (currentScore === null) {
      handleSetScore(currentPar);
    } else if (currentScore > 1) {
      handleSetScore(currentScore - 1);
    } else {
      handleSetScore(null);
    }
  };

  const triggerSaveToast = () => {
    setSaveIndicator(true);
    setTimeout(() => setSaveIndicator(false), 1200);
  };

  const handleParChange = (newPar: number) => {
    onUpdateScore(currentHole, currentScore, newPar);
    triggerSaveToast();
  };

  // Running total calculation
  const playedScores = Object.entries(round.scores).filter(([_, s]) => typeof s === 'number' && (s as number) > 0);
  const totalPlayedCount = playedScores.length;
  
  // Calculate relative to par for completed holes
  let runningParDiff = 0;
  for (let h = 1; h <= round.holes; h++) {
    const s = round.scores[h];
    const p = round.pars?.[h] ?? 4;
    if (s !== null && s !== undefined && s > 0) {
      runningParDiff += (s - p);
    }
  }

  const formatParDiff = (diff: number) => {
    if (diff === 0) return 'E (Par)';
    if (diff > 0) return `+${diff}`;
    return `${diff}`;
  };

  const quickScores = [2, 3, 4, 5, 6, 7, 8, 9];

  return (
    <div className="flex-1 flex flex-col justify-between w-full h-full pb-4">
      {/* Top Header Bar */}
      <div className={`px-4 py-3 border-b flex items-center justify-between z-10 ${
        isSunlight
          ? 'bg-yellow-200 border-black text-black'
          : isDark
          ? 'bg-slate-900 border-slate-800 text-slate-100'
          : 'bg-white border-slate-200 text-slate-900 shadow-sm'
      }`}>
        <button
          onClick={onBackToScorecards}
          className="flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-xl hover:bg-slate-500/10 transition active:scale-95"
          id="btn-back-scorecards"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Exit</span>
        </button>

        {/* Tournament Info Summary */}
        <div className="text-center px-2 min-w-0">
          <div className="text-xs font-black truncate max-w-[170px]">
            {round.course_name}
            {round.round_number && round.num_rounds ? ` (R${round.round_number}/${round.num_rounds})` : ''}
          </div>
          <div className="text-[11px] font-semibold opacity-75 truncate max-w-[170px]">
            {round.player_name} • Total: <span className="font-bold text-emerald-600">{round.total_score}</span>
          </div>
        </div>

        <button
          onClick={onOpenSummary}
          className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-xl transition active:scale-95 ${
            isSunlight
              ? 'bg-black text-white'
              : 'bg-emerald-600/10 text-emerald-600 hover:bg-emerald-600/20'
          }`}
          id="btn-open-summary"
        >
          <List className="w-4 h-4" />
          <span>Card</span>
        </button>
      </div>

      {/* Round Switcher Bar if Multiple Tournament Rounds */}
      {siblingRounds.length > 1 && onSelectRound && (
        <div className={`px-3 py-1.5 border-b flex items-center justify-center gap-2 ${
          isSunlight
            ? 'bg-yellow-300 border-black'
            : isDark
            ? 'bg-slate-900/60 border-slate-800'
            : 'bg-slate-50 border-slate-200'
        }`}>
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mr-1">Rounds:</span>
          {siblingRounds.map((r) => {
            const isCurrentRound = r.id === round.id;
            const rNum = r.round_number || 1;
            return (
              <button
                key={r.id}
                onClick={() => onSelectRound(r.id)}
                className={`px-3 py-1 rounded-lg text-xs font-black transition active:scale-95 flex items-center gap-1 ${
                  isCurrentRound
                    ? isSunlight
                      ? 'bg-black text-white'
                      : 'bg-emerald-600 text-white shadow-sm'
                    : isDark
                    ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span>Round {rNum}</span>
                {r.completed && <span className="text-[10px]">✓</span>}
              </button>
            );
          })}
        </div>
      )}

      {/* Hole Progress Bar Across Top */}
      <div className={`px-3 py-2.5 border-b shadow-inner ${
        isSunlight
          ? 'bg-yellow-100 border-black'
          : isDark
          ? 'bg-slate-900/90 border-slate-800'
          : 'bg-slate-100/90 border-slate-200'
      }`}>
        <div
          ref={progressScrollRef}
          className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 px-1 scroll-smooth"
        >
          {Array.from({ length: round.holes }, (_, i) => i + 1).map((hNum) => {
            const hScore = round.scores[hNum];
            const isCompleted = hScore !== null && hScore > 0;
            const isCurrent = hNum === currentHole;

            return (
              <button
                key={hNum}
                id={`hole-pill-${hNum}`}
                onClick={() => setCurrentHole(hNum)}
                className={`flex flex-col items-center justify-center shrink-0 w-11 h-13 rounded-xl transition-all active:scale-95 ${
                  isCurrent
                    ? isSunlight
                      ? 'bg-black text-white ring-4 ring-yellow-400 scale-105 font-black shadow-md'
                      : isDark
                      ? 'bg-emerald-500 text-slate-950 ring-2 ring-emerald-300 font-black scale-105 shadow-md shadow-emerald-500/20'
                      : 'bg-emerald-600 text-white ring-2 ring-emerald-400 font-black scale-105 shadow-md shadow-emerald-600/30'
                    : isCompleted
                    ? isSunlight
                      ? 'bg-yellow-300 border-2 border-black text-black font-bold'
                      : isDark
                      ? 'bg-emerald-950/80 border border-emerald-800 text-emerald-400 font-bold'
                      : 'bg-emerald-100 border border-emerald-300 text-emerald-800 font-bold'
                    : isSunlight
                    ? 'bg-yellow-200 text-slate-700'
                    : isDark
                    ? 'bg-slate-800 text-slate-400'
                    : 'bg-white border border-slate-200 text-slate-500'
                }`}
              >
                <span className="text-[10px] font-bold uppercase tracking-wider">H{hNum}</span>
                <span className="text-sm font-black leading-none mt-0.5">
                  {hScore !== null && hScore > 0 ? hScore : '–'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Score Area */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-2 my-auto gap-4">
        {/* Hole & Par Display */}
        <div className="flex flex-col items-center text-center">
          <div className="flex items-center gap-2">
            <span className={`text-2xl font-black uppercase tracking-tight ${
              isSunlight ? 'text-black' : isDark ? 'text-slate-100' : 'text-slate-900'
            }`}>
              Hole {currentHole}
            </span>
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-extrabold ${
              isSunlight
                ? 'bg-black text-white'
                : 'bg-emerald-600 text-white'
            }`}>
              of {round.holes}
            </span>
          </div>
        </div>

        {/* Large Score Counter Display + Touch Buttons */}
        <div className="flex items-center justify-center gap-3 w-full max-w-xs my-1">
          {/* Minus Button (Large 64px x 64px) */}
          <button
            onClick={handleDecrement}
            disabled={currentScore === null}
            className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl font-black transition active:scale-90 shadow-md ${
              currentScore === null
                ? 'opacity-40 cursor-not-allowed bg-slate-300 text-slate-500'
                : isSunlight
                ? 'bg-black text-white hover:bg-slate-800 border-2 border-black'
                : isDark
                ? 'bg-slate-800 text-slate-100 hover:bg-slate-700 border border-slate-700'
                : 'bg-slate-200 text-slate-900 hover:bg-slate-300'
            }`}
            id="btn-score-minus"
          >
            –
          </button>

          {/* Center Giant Score Box */}
          <div className={`w-32 h-32 rounded-3xl flex flex-col items-center justify-center border-4 shadow-xl transition-all ${
            isSunlight
              ? 'bg-yellow-200 border-black text-black'
              : isDark
              ? 'bg-slate-900 border-emerald-500/80 text-emerald-400'
              : 'bg-emerald-50 border-emerald-600 text-emerald-900'
          }`}>
            <span className="text-xs font-bold uppercase tracking-widest opacity-60">Score</span>
            <span className="text-6xl font-black tracking-tight leading-none my-1">
              {currentScore !== null ? currentScore : '–'}
            </span>
          </div>

          {/* Plus Button (Large 64px x 64px) */}
          <button
            onClick={handleIncrement}
            className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl font-black transition active:scale-90 shadow-md ${
              isSunlight
                ? 'bg-black text-white hover:bg-slate-800 border-2 border-black'
                : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-600/30'
            }`}
            id="btn-score-plus"
          >
            +
          </button>
        </div>

        {/* Quick Score Tap Grid (2, 3, 4, 5, 6, 7, 8, 9) */}
        <div className="w-full max-w-xs flex flex-col gap-1.5">
          <div className="text-[11px] font-bold text-center text-slate-500 uppercase tracking-wider">
            Quick Tap
          </div>

          <div className="grid grid-cols-4 gap-2">
            {quickScores.map((scoreVal) => {
              const isSelected = currentScore === scoreVal;
              return (
                <button
                  key={scoreVal}
                  onClick={() => handleSetScore(scoreVal)}
                  className={`py-3 rounded-xl font-extrabold text-lg transition active:scale-95 shadow-sm ${
                    isSelected
                      ? isSunlight
                        ? 'bg-black text-white ring-2 ring-black font-black scale-105'
                        : 'bg-emerald-600 text-white ring-2 ring-emerald-400 font-black scale-105'
                      : isSunlight
                      ? 'bg-yellow-200 border border-black text-black hover:bg-yellow-300'
                      : isDark
                      ? 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                      : 'bg-white border border-slate-200 text-slate-800 hover:bg-emerald-50'
                  }`}
                  id={`btn-quick-score-${scoreVal}`}
                >
                  {scoreVal}
                </button>
              );
            })}
          </div>

          {/* Clear Score Button */}
          {currentScore !== null && (
            <button
              onClick={() => handleSetScore(null)}
              className="mt-1 text-xs text-slate-400 hover:text-red-500 font-bold py-1 text-center flex items-center justify-center gap-1 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear hole score</span>
            </button>
          )}
        </div>
      </div>

      {/* Save Toast Indicator */}
      <div className="h-6 flex items-center justify-center">
        {saveIndicator && (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-600 text-white text-[11px] font-bold shadow-md animate-bounce">
            <CheckCircle2 className="w-3 h-3" />
            <span>Auto-saved ✓</span>
          </span>
        )}
      </div>

      {/* Bottom Nav Controls (Previous Hole / Next Hole / Finish Round) */}
      <div className={`p-3 border-t grid grid-cols-2 gap-3 mt-auto ${
        isSunlight
          ? 'bg-yellow-200 border-black'
          : isDark
          ? 'bg-slate-900 border-slate-800'
          : 'bg-white border-slate-200 shadow-lg'
      }`}>
        <button
          onClick={() => setCurrentHole((h) => Math.max(1, h - 1))}
          disabled={currentHole === 1}
          className={`py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-1.5 transition active:scale-95 min-h-[50px] ${
            currentHole === 1
              ? 'opacity-40 cursor-not-allowed bg-slate-200 text-slate-500'
              : isSunlight
              ? 'bg-yellow-100 border-2 border-black text-black hover:bg-yellow-300'
              : isDark
              ? 'bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700'
              : 'bg-slate-100 border border-slate-300 text-slate-800 hover:bg-slate-200'
          }`}
          id="btn-prev-hole"
        >
          <ChevronLeft className="w-5 h-5" />
          <span>Previous Hole</span>
        </button>

        {currentHole < round.holes ? (
          <button
            onClick={() => setCurrentHole((h) => Math.min(round.holes, h + 1))}
            className={`py-3 px-4 rounded-xl font-black text-sm flex items-center justify-center gap-1.5 shadow-md transition active:scale-95 min-h-[50px] ${
              isSunlight
                ? 'bg-black text-white hover:bg-slate-800 border-2 border-black'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30'
            }`}
            id="btn-next-hole"
          >
            <span>Next Hole</span>
            <ChevronRight className="w-5 h-5" />
          </button>
        ) : (
          <button
            onClick={onFinishRoundClick}
            className={`py-3 px-4 rounded-xl font-black text-sm flex items-center justify-center gap-1.5 shadow-md transition active:scale-95 min-h-[50px] ${
              isSunlight
                ? 'bg-black text-white border-2 border-black hover:bg-slate-800'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30 animate-pulse'
            }`}
            id="btn-finish-round"
          >
            <Sparkles className="w-4 h-4 text-yellow-300" />
            <span>Finish Round</span>
          </button>
        )}
      </div>
    </div>
  );
};
