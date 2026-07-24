import React, { useState } from 'react';
import { Round, ThemeMode } from '../types';
import confetti from 'canvas-confetti';
import {
  ArrowLeft,
  Edit,
  Save,
  Trash2,
  Share2,
  CheckCircle,
  Copy,
  Sparkles,
  User,
  Flag,
  Calendar,
} from 'lucide-react';

interface RoundSummaryViewProps {
  round: Round;
  onEditHole: (holeNumber: number) => void;
  onSaveRound: (round: Round) => void;
  onFinishRound: (roundId: string) => void;
  onDeleteRound: (roundId: string) => void;
  onBackToScorecards: () => void;
  themeMode: ThemeMode;
}

export const RoundSummaryView: React.FC<RoundSummaryViewProps> = ({
  round,
  onEditHole,
  onSaveRound,
  onFinishRound,
  onDeleteRound,
  onBackToScorecards,
  themeMode,
}) => {
  const [copied, setCopied] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isSunlight = themeMode === 'sunlight';
  const isDark = themeMode === 'dark';

  const playedHolesCount = Object.values(round.scores).filter((s): s is number => typeof s === 'number' && s > 0).length;
  const isFullyPlayed = playedHolesCount === round.holes;

  const handleTriggerFinish = () => {
    onFinishRound(round.id);
    // Fire confetti celebration
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (e) {
      console.log('Confetti error:', e);
    }
  };

  const handleCopySummary = () => {
    const text = `⛳ Golf Scorecard: ${round.course_name}\n👤 Player: ${round.player_name}\n📅 Date: ${round.date}\n🏆 Total Score: ${round.total_score} (${round.holes} Holes)\n${
      round.holes === 18 ? `Front 9: ${round.front_9_score} | Back 9: ${round.back_9_score}\n` : ''
    }`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col p-4 w-full gap-4 pb-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between pt-1">
        <button
          onClick={onBackToScorecards}
          className="flex items-center gap-1 text-xs font-bold px-3 py-2 rounded-xl hover:bg-slate-500/10 transition"
          id="btn-summary-back"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Scorecards</span>
        </button>

        <h1 className="text-lg font-black tracking-tight">Round Summary</h1>

        <button
          onClick={handleCopySummary}
          title="Share/Copy scorecard"
          className="flex items-center gap-1 text-xs font-bold px-3 py-2 rounded-xl bg-emerald-600/10 text-emerald-600 hover:bg-emerald-600/20 transition"
          id="btn-share-summary"
        >
          <Share2 className="w-4 h-4" />
          <span>{copied ? 'Copied!' : 'Share'}</span>
        </button>
      </div>

      {/* Main Info Card Header */}
      <div className={`p-4 rounded-2xl flex flex-col gap-3 shadow-sm ${
        isSunlight
          ? 'bg-yellow-200 border-2 border-black text-black'
          : isDark
          ? 'bg-slate-900 border border-slate-800 text-slate-100'
          : 'bg-white border border-slate-200 text-slate-900 shadow-md'
      }`}>
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-black">{round.course_name}</h2>
              {round.round_number && round.num_rounds && (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-bold">
                  Round {round.round_number} of {round.num_rounds}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs font-semibold opacity-80">
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-emerald-600" />
                <span>{round.player_name}</span>
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                <span>{round.date}</span>
              </span>
            </div>
          </div>

          <div className="text-right">
            <div className="text-3xl font-black text-emerald-600 leading-none">
              {round.total_score}
            </div>
            <div className="text-[10px] font-bold uppercase tracking-wider mt-0.5 opacity-70">
              Total Score
            </div>
          </div>
        </div>

        {/* Nines Totals Display */}
        <div className={`grid ${round.holes === 18 ? 'grid-cols-3' : 'grid-cols-2'} gap-2 text-center py-2 px-3 rounded-xl font-mono text-xs font-bold ${
          isSunlight
            ? 'bg-yellow-300 border border-black'
            : isDark
            ? 'bg-slate-800 text-slate-200'
            : 'bg-slate-100 text-slate-800'
        }`}>
          {round.holes === 18 && (
            <>
              <div>
                <span className="opacity-60 block text-[10px]">FRONT 9</span>
                <span className="text-sm font-black">{round.front_9_score}</span>
              </div>
              <div>
                <span className="opacity-60 block text-[10px]">BACK 9</span>
                <span className="text-sm font-black">{round.back_9_score}</span>
              </div>
            </>
          )}
          <div>
            <span className="opacity-60 block text-[10px]">OVERALL</span>
            <span className="text-sm font-black text-emerald-600">{round.total_score}</span>
          </div>
        </div>
      </div>

      {/* Hole-by-Hole Scores Grid Table */}
      <div className="flex-1 flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-emerald-600 px-1">
          <span>Hole Scores ({round.holes} Holes)</span>
          <span className="text-[11px] font-normal text-slate-500">Tap hole row to edit</span>
        </div>

        <div className={`rounded-2xl overflow-hidden border shadow-sm ${
          isSunlight
            ? 'bg-yellow-100 border-2 border-black text-black'
            : isDark
            ? 'bg-slate-900 border-slate-800 text-slate-100'
            : 'bg-white border-slate-200 text-slate-900'
        }`}>
          <div className="grid grid-cols-3 px-3 py-2 text-[11px] font-black uppercase border-b border-slate-500/20 opacity-70 bg-slate-500/5">
            <span>Hole</span>
            <span>Score</span>
            <span className="text-right">Action</span>
          </div>

          <div className="divide-y divide-slate-500/10 max-h-[300px] overflow-y-auto">
            {Array.from({ length: round.holes }, (_, i) => i + 1).map((hNum) => {
              const score = round.scores[hNum];
              const isPlayed = score !== null && score > 0;

              return (
                <div
                  key={hNum}
                  onClick={() => onEditHole(hNum)}
                  className={`grid grid-cols-3 px-3 py-2.5 text-xs items-center cursor-pointer transition hover:bg-emerald-500/10 ${
                    !isPlayed ? 'opacity-50' : ''
                  }`}
                  id={`row-hole-${hNum}`}
                >
                  <span className="font-bold flex items-center gap-1">
                    <span>Hole {hNum}</span>
                  </span>

                  <span className={`font-mono font-black text-sm ${
                    isPlayed ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400'
                  }`}>
                    {isPlayed ? score : '–'}
                  </span>

                  <div className="text-right">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditHole(hNum);
                      }}
                      className="px-2 py-1 rounded-lg text-[11px] font-bold bg-slate-500/10 hover:bg-slate-500/20 transition"
                    >
                      <Edit className="w-3 h-3 inline mr-1" />
                      Edit
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Action Buttons */}
      <div className="flex flex-col gap-2 pt-2">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onEditHole(1)}
            className={`py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 border transition active:scale-95 min-h-[48px] ${
              isSunlight
                ? 'bg-yellow-200 border-black text-black hover:bg-yellow-300'
                : isDark
                ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
                : 'bg-slate-100 border-slate-300 text-slate-800 hover:bg-slate-200'
            }`}
            id="btn-summary-edit-scores"
          >
            <Edit className="w-4 h-4" />
            <span>Edit Scores</span>
          </button>

          {!round.completed ? (
            <button
              onClick={handleTriggerFinish}
              className={`py-3 px-4 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 shadow transition active:scale-95 min-h-[48px] ${
                isSunlight
                  ? 'bg-black text-white border-2 border-black'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30'
              }`}
              id="btn-summary-finish-round"
            >
              <Sparkles className="w-4 h-4 text-yellow-300" />
              <span>Finish Round</span>
            </button>
          ) : (
            <button
              onClick={() => onSaveRound(round)}
              className={`py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow transition active:scale-95 min-h-[48px] ${
                isSunlight
                  ? 'bg-black text-white'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
              id="btn-summary-save"
            >
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
          )}
        </div>

        {/* Delete button option */}
        {confirmDelete ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onDeleteRound(round.id)}
              className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-bold text-xs shadow min-h-[44px]"
            >
              Yes, Delete Round
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="px-4 py-2.5 rounded-xl bg-slate-500/20 text-xs font-bold min-h-[44px]"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="py-2 text-xs font-bold text-red-500 hover:text-red-600 flex items-center justify-center gap-1 transition"
            id="btn-summary-delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Round</span>
          </button>
        )}
      </div>
    </div>
  );
};
