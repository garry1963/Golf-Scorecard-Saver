import React, { useState } from 'react';
import { Round, ThemeMode } from '../types';
import { ArrowLeft, Copy, Trash2, Calendar, User, Flag, CheckCircle2 } from 'lucide-react';

interface ViewRoundViewProps {
  round: Round;
  onDuplicateRound: (roundId: string) => void;
  onDeleteRound: (roundId: string) => void;
  onBackToScorecards: () => void;
  themeMode: ThemeMode;
}

export const ViewRoundView: React.FC<ViewRoundViewProps> = ({
  round,
  onDuplicateRound,
  onDeleteRound,
  onBackToScorecards,
  themeMode,
}) => {
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isSunlight = themeMode === 'sunlight';
  const isDark = themeMode === 'dark';

  return (
    <div className="flex-1 flex flex-col p-4 w-full gap-4 pb-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between pt-1">
        <button
          onClick={onBackToScorecards}
          className="flex items-center gap-1 text-xs font-bold px-3 py-2 rounded-xl hover:bg-slate-500/10 transition"
          id="btn-view-back"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Scorecards</span>
        </button>

        <h1 className="text-base font-black tracking-tight">Saved Round</h1>

        <div className="w-16" />
      </div>

      {/* Main Scorecard Report Header */}
      <div className={`p-4 rounded-2xl flex flex-col gap-3 shadow-md ${
        isSunlight
          ? 'bg-yellow-200 border-2 border-black text-black'
          : isDark
          ? 'bg-slate-900 border border-slate-800 text-slate-100'
          : 'bg-white border border-slate-200 text-slate-900'
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
            <div className="flex flex-col gap-1 mt-1 text-xs font-semibold opacity-85">
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-emerald-600" />
                <span>Player: {round.player_name}</span>
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                <span>Date: {round.date}</span>
              </span>
            </div>
          </div>

          <div className="text-right bg-emerald-600 text-white px-3.5 py-2 rounded-2xl shadow-sm">
            <div className="text-3xl font-black leading-none">{round.total_score}</div>
            <div className="text-[10px] font-bold uppercase tracking-wider mt-0.5 opacity-90">
              Total Score
            </div>
          </div>
        </div>

        {/* Nines Summary */}
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
            <span className="opacity-60 block text-[10px]">TOTAL</span>
            <span className="text-sm font-black text-emerald-600">{round.total_score}</span>
          </div>
        </div>
      </div>

      {/* Hole-by-Hole Grid Table */}
      <div className="flex-1 flex flex-col gap-2">
        <div className="text-xs font-bold uppercase tracking-wider text-emerald-600 px-1">
          Hole Scores Breakdown
        </div>

        <div className={`rounded-2xl overflow-hidden border shadow-sm ${
          isSunlight
            ? 'bg-yellow-100 border-2 border-black text-black'
            : isDark
            ? 'bg-slate-900 border-slate-800 text-slate-100'
            : 'bg-white border-slate-200 text-slate-900'
        }`}>
          <div className="grid grid-cols-2 px-4 py-2 text-[11px] font-black uppercase border-b border-slate-500/20 opacity-70 bg-slate-500/5">
            <span>Hole</span>
            <span className="text-right">Score</span>
          </div>

          <div className="divide-y divide-slate-500/10 max-h-[320px] overflow-y-auto">
            {Array.from({ length: round.holes }, (_, i) => i + 1).map((hNum) => {
              const score = round.scores[hNum];
              const isPlayed = score !== null && score > 0;

              return (
                <div
                  key={hNum}
                  className="grid grid-cols-2 px-4 py-2.5 text-xs items-center"
                >
                  <span className="font-bold">Hole {hNum}</span>
                  <span className="text-right font-mono font-black text-sm text-emerald-600">
                    {isPlayed ? score : '–'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Read-Only Actions (Duplicate / Delete) */}
      <div className="flex flex-col gap-2 pt-2">
        <button
          onClick={() => onDuplicateRound(round.id)}
          className={`w-full py-3.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border transition active:scale-95 min-h-[50px] ${
            isSunlight
              ? 'bg-black text-white border-black'
              : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
          }`}
          id="btn-view-duplicate"
        >
          <Copy className="w-4 h-4" />
          <span>Duplicate Round (Replay Course)</span>
        </button>

        {confirmDelete ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onDeleteRound(round.id)}
              className="flex-1 py-3 rounded-xl bg-red-600 text-white font-bold text-xs shadow min-h-[44px]"
            >
              Yes, Delete Round
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="px-4 py-3 rounded-xl bg-slate-500/20 text-xs font-bold min-h-[44px]"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="py-2 text-xs font-bold text-red-500 hover:text-red-600 flex items-center justify-center gap-1 transition"
            id="btn-view-delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Round</span>
          </button>
        )}
      </div>
    </div>
  );
};
