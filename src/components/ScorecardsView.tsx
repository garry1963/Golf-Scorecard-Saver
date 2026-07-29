import React, { useState } from 'react';
import { Round, ThemeMode } from '../types';
import {
  Search,
  Calendar,
  User,
  Flag,
  Play,
  Eye,
  Trash2,
  Copy,
  Plus,
  CheckCircle2,
  Clock,
  ArrowUpDown,
  Lock,
  KeyRound,
  Shield,
  ShieldAlert,
} from 'lucide-react';

interface ScorecardsViewProps {
  rounds: Round[];
  onContinueRound: (roundId: string) => void;
  onViewRound: (roundId: string) => void;
  onDeleteRound: (roundId: string) => void;
  onDuplicateRound: (roundId: string) => void;
  onNewRoundClick: () => void;
  themeMode: ThemeMode;
  userRole?: 'admin' | 'user';
  isApproved?: boolean;
  verifiedPlayerName?: string | null;
  onOpenPinModal?: () => void;
  onRequestAccess?: () => void;
}

type SortField = 'date' | 'course' | 'player';

export const ScorecardsView: React.FC<ScorecardsViewProps> = ({
  rounds,
  onContinueRound,
  onViewRound,
  onDeleteRound,
  onDuplicateRound,
  onNewRoundClick,
  themeMode,
  userRole,
  isApproved,
  verifiedPlayerName,
  onOpenPinModal,
  onRequestAccess,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortField>('date');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const isSunlight = themeMode === 'sunlight';
  const isDark = themeMode === 'dark';
  const isAdmin = userRole === 'admin';

  // Privacy Rule Filtering:
  // Admin sees ALL scorecards. Approved users with verified PIN code only see scorecards matching their Player Name.
  const userRounds = React.useMemo(() => {
    if (isAdmin) {
      return rounds;
    }
    if (isApproved && verifiedPlayerName) {
      const cleanVerified = verifiedPlayerName.trim().toLowerCase();
      return rounds.filter((r) => (r.player_name || '').trim().toLowerCase() === cleanVerified);
    }
    return [];
  }, [rounds, isAdmin, isApproved, verifiedPlayerName]);

  // Filter & Sort
  const filteredRounds = userRounds
    .filter((r) => {
      const term = searchTerm.toLowerCase().trim();
      if (!term) return true;
      return (
        r.course_name.toLowerCase().includes(term) ||
        r.player_name.toLowerCase().includes(term) ||
        r.date.includes(term)
      );
    })
    .sort((a, b) => {
      if (sortBy === 'course') {
        return a.course_name.localeCompare(b.course_name);
      }
      if (sortBy === 'player') {
        return a.player_name.localeCompare(b.player_name);
      }
      // date descending
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

  // Render Access Restricted screen for Guest / Pending / Unverified Users
  if (!isAdmin && (!isApproved || !verifiedPlayerName)) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center gap-4">
        <div className="w-16 h-16 rounded-3xl bg-amber-500/15 flex items-center justify-center text-amber-500 mb-1">
          <Lock className="w-8 h-8 stroke-[2.2]" />
        </div>

        <div>
          <h2 className="text-xl font-black tracking-tight">Scorecard Privacy & Access Restricted</h2>
          <p className="text-xs opacity-75 mt-1 max-w-sm mx-auto leading-relaxed">
            {!isApproved
              ? 'Pending / Guest users do not have access to view or edit scorecards. Once an administrator approves your account, you can set up your 4-digit PIN code to access your scorecards.'
              : 'Please enter your 4-digit PIN code for your Player Name to unlock and view your personal scorecards.'}
          </p>
        </div>

        {!isApproved && onRequestAccess && (
          <button
            onClick={onRequestAccess}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-xs shadow-lg transition active:scale-95 bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-600/20"
          >
            <User className="w-4 h-4" />
            <span>Request Access from Admin</span>
          </button>
        )}

        {isApproved && onOpenPinModal && (
          <button
            onClick={onOpenPinModal}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-sm shadow-lg transition active:scale-95 ${
              isSunlight
                ? 'bg-black text-white hover:bg-slate-900 border-2 border-black'
                : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-600/20'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>Enter 4-Digit PIN Code</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col p-4 w-full gap-4">
      {/* Top Header */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
            <span>Scorecards</span>
          </h1>
          <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} flex items-center gap-1.5 mt-0.5`}>
            {isAdmin ? (
              <span className="text-purple-500 font-bold flex items-center gap-1">
                <Shield className="w-3 h-3" /> Admin Mode: Viewing All Scorecards ({userRounds.length})
              </span>
            ) : (
              <span className="text-emerald-600 font-bold flex items-center gap-1">
                <User className="w-3 h-3" /> {verifiedPlayerName}'s Scorecards ({userRounds.length})
              </span>
            )}
          </p>
        </div>

        <button
          onClick={onNewRoundClick}
          className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl font-bold text-sm shadow-md transition active:scale-95 ${
            isSunlight
              ? 'bg-black text-white hover:bg-slate-900 border-2 border-black'
              : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
          }`}
          id="btn-quick-new-round"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>New Round</span>
        </button>
      </div>

      {/* Search & Sort Controls */}
      <div className="flex flex-col gap-2">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search tournament or player..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm font-medium transition focus:outline-none ${
              isSunlight
                ? 'bg-yellow-100 border-2 border-black text-black placeholder-slate-600 focus:bg-white'
                : isDark
                ? 'bg-slate-900 border border-slate-800 text-slate-100 placeholder-slate-500 focus:border-emerald-500'
                : 'bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:border-emerald-600 shadow-sm'
            }`}
            id="input-search-scorecards"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600 font-bold px-1.5 py-0.5 rounded"
            >
              Clear
            </button>
          )}
        </div>

        <div className="flex items-center justify-between px-1 text-xs font-semibold">
          <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Sort by:</span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setSortBy('date')}
              className={`px-2.5 py-1 rounded-lg transition ${
                sortBy === 'date'
                  ? isSunlight
                    ? 'bg-black text-white font-bold'
                    : 'bg-emerald-600 text-white font-bold'
                  : isDark
                  ? 'bg-slate-800 text-slate-300'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              Date
            </button>
            <button
              onClick={() => setSortBy('course')}
              className={`px-2.5 py-1 rounded-lg transition ${
                sortBy === 'course'
                  ? isSunlight
                    ? 'bg-black text-white font-bold'
                    : 'bg-emerald-600 text-white font-bold'
                  : isDark
                  ? 'bg-slate-800 text-slate-300'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              Tournament
            </button>
            <button
              onClick={() => setSortBy('player')}
              className={`px-2.5 py-1 rounded-lg transition ${
                sortBy === 'player'
                  ? isSunlight
                    ? 'bg-black text-white font-bold'
                    : 'bg-emerald-600 text-white font-bold'
                  : isDark
                  ? 'bg-slate-800 text-slate-300'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              Player
            </button>
          </div>
        </div>
      </div>

      {/* Scorecards List */}
      <div className="flex-1 flex flex-col gap-3 pb-6">
        {filteredRounds.length === 0 ? (
          <div className={`my-auto py-12 px-4 rounded-2xl text-center flex flex-col items-center justify-center gap-3 ${
            isSunlight
              ? 'bg-yellow-100 border-2 border-black'
              : isDark
              ? 'bg-slate-900 border border-slate-800'
              : 'bg-white border border-slate-200 shadow-sm'
          }`}>
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600">
              <Flag className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base">
                {searchTerm ? 'No matching rounds found' : 'No saved scorecards yet'}
              </h3>
              <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {searchTerm
                  ? 'Try a different course or player search term.'
                  : 'Start a new round to log your hole-by-hole scores!'}
              </p>
            </div>
            {!searchTerm && (
              <button
                onClick={onNewRoundClick}
                className="mt-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow hover:bg-emerald-700 transition"
              >
                Start First Round
              </button>
            )}
          </div>
        ) : (
          filteredRounds.map((round) => {
            const playedCount = Object.values(round.scores).filter((s): s is number => typeof s === 'number' && s > 0).length;
            const isUnfinished = !round.completed;

            return (
              <div
                key={round.id}
                className={`p-4 rounded-2xl flex flex-col gap-3 transition shadow-sm ${
                  isSunlight
                    ? 'bg-yellow-100 border-2 border-black text-black'
                    : isDark
                    ? 'bg-slate-900 border border-slate-800 text-slate-100 hover:border-slate-700'
                    : 'bg-white border border-slate-200 text-slate-900 hover:border-emerald-300'
                }`}
                id={`card-round-${round.id}`}
              >
                {/* Tournament Name & Total Score Row */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center flex-wrap gap-1.5">
                      <h2 className="text-lg font-black tracking-tight truncate leading-snug">
                        {round.course_name}
                      </h2>
                      {round.round_number && round.num_rounds && (
                        <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 font-bold shrink-0">
                          R{round.round_number} of {round.num_rounds}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 mt-1 text-xs font-semibold">
                      <span className="flex items-center gap-1 opacity-80">
                        <User className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="truncate max-w-[120px]">{round.player_name}</span>
                      </span>

                      <span className="flex items-center gap-1 opacity-80">
                        <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{round.date}</span>
                      </span>
                    </div>
                  </div>

                  {/* Total Score Badge */}
                  <div className="flex flex-col items-end shrink-0">
                    <div className={`px-3 py-1 rounded-xl text-center min-w-[64px] ${
                      isSunlight
                        ? 'bg-black text-white font-black'
                        : isDark
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                    }`}>
                      <div className="text-2xl font-black leading-none">{round.total_score || '-'}</div>
                      <div className="text-[10px] font-bold uppercase tracking-wider mt-0.5 opacity-90">
                        Total
                      </div>
                    </div>
                  </div>
                </div>

                {/* Progress / Nine Breakdown Row */}
                <div className={`flex items-center justify-between text-xs py-1.5 px-3 rounded-xl ${
                  isSunlight
                    ? 'bg-yellow-200 border border-black'
                    : isDark
                    ? 'bg-slate-800/80 text-slate-300'
                    : 'bg-slate-100 text-slate-700'
                }`}>
                  <div className="flex items-center gap-2">
                    {isUnfinished ? (
                      <span className="flex items-center gap-1 font-bold text-amber-600">
                        <Clock className="w-3.5 h-3.5" />
                        <span>In Progress ({playedCount}/{round.holes} Holes)</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 font-bold text-emerald-600">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Completed ({round.holes} Holes)</span>
                      </span>
                    )}
                  </div>

                  {round.holes === 18 && (
                    <div className="flex items-center gap-2 font-mono font-bold">
                      <span>F9: {round.front_9_score}</span>
                      <span>|</span>
                      <span>B9: {round.back_9_score}</span>
                    </div>
                  )}
                </div>

                {/* Card Action Buttons (Large Touch Targets) */}
                <div className="grid grid-cols-3 gap-2 pt-1">
                  {isUnfinished ? (
                    <button
                      onClick={() => onContinueRound(round.id)}
                      className={`col-span-2 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold shadow transition active:scale-95 min-h-[44px] ${
                        isSunlight
                          ? 'bg-black text-white hover:bg-slate-800'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      }`}
                      id={`btn-continue-${round.id}`}
                    >
                      <Play className="w-4 h-4 fill-current" />
                      <span>Continue</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => onViewRound(round.id)}
                      className={`col-span-2 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold border transition active:scale-95 min-h-[44px] ${
                        isSunlight
                          ? 'bg-yellow-200 border-black text-black hover:bg-yellow-300'
                          : isDark
                          ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-100'
                          : 'bg-slate-100 border-slate-300 hover:bg-slate-200 text-slate-900'
                      }`}
                      id={`btn-view-${round.id}`}
                    >
                      <Eye className="w-4 h-4" />
                      <span>View Scorecard</span>
                    </button>
                  )}

                  {/* Duplicate / Delete Options */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onDuplicateRound(round.id)}
                      title="Duplicate this course round setup"
                      className={`flex-1 flex items-center justify-center py-2.5 rounded-xl border text-xs font-bold transition active:scale-95 min-h-[44px] ${
                        isSunlight
                          ? 'border-black bg-yellow-200 hover:bg-yellow-300'
                          : isDark
                          ? 'border-slate-800 bg-slate-800 text-slate-300 hover:bg-slate-700'
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <Copy className="w-4 h-4" />
                    </button>

                    {deletingId === round.id ? (
                      <button
                        onClick={() => {
                          onDeleteRound(round.id);
                          setDeletingId(null);
                        }}
                        className="px-2.5 py-2.5 rounded-xl bg-red-600 text-white text-xs font-bold animate-pulse min-h-[44px]"
                      >
                        Confirm?
                      </button>
                    ) : (
                      <button
                        onClick={() => setDeletingId(round.id)}
                        title="Delete round"
                        className={`px-3 py-2.5 rounded-xl border text-xs font-bold transition active:scale-95 min-h-[44px] ${
                          isSunlight
                            ? 'border-black bg-yellow-200 text-red-700 hover:bg-red-200'
                            : isDark
                            ? 'border-slate-800 bg-slate-800 text-red-400 hover:bg-red-950/40'
                            : 'border-slate-200 bg-slate-50 text-red-600 hover:bg-red-50'
                        }`}
                        id={`btn-delete-${round.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
