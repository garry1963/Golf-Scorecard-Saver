import React, { useState, useEffect } from 'react';
import { RoundsCount, ThemeMode, Tournament } from '../types';
import { User, Trophy, Play, ChevronDown, Plus, KeyRound, Lock, CheckCircle2 } from 'lucide-react';
import { getRecentPlayers, getStoredRounds } from '../services/storage';

interface NewRoundViewProps {
  defaultPlayerName?: string;
  defaultNumRounds?: RoundsCount;
  dbTournaments?: Tournament[];
  onStartRound: (playerName: string, tournamentName: string, numRounds: RoundsCount) => void;
  themeMode: ThemeMode;
  verifiedPlayerName?: string | null;
  onVerifyPinForPlayer?: (playerName: string) => void;
  userRole?: 'admin' | 'user';
  isApproved?: boolean;
}

export const NewRoundView: React.FC<NewRoundViewProps> = ({
  defaultPlayerName = '',
  defaultNumRounds = 2,
  dbTournaments = [],
  onStartRound,
  themeMode,
  verifiedPlayerName,
  onVerifyPinForPlayer,
  userRole,
  isApproved,
}) => {
  const [playerName, setPlayerName] = useState(defaultPlayerName || '');
  const [isCustomPlayer, setIsCustomPlayer] = useState<boolean>(false);
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>('');
  const [tournamentName, setTournamentName] = useState<string>('');
  const [numRounds, setNumRounds] = useState<RoundsCount>(defaultNumRounds || 2);
  const [error, setError] = useState<string | null>(null);

  const isSunlight = themeMode === 'sunlight';
  const isDark = themeMode === 'dark';
  const isAdmin = userRole === 'admin';

  // PIN Verification Check
  const isPinVerified = React.useMemo(() => {
    if (isAdmin) return true;
    if (!playerName || !playerName.trim()) return false;
    return (
      Boolean(verifiedPlayerName) &&
      verifiedPlayerName!.trim().toLowerCase() === playerName.trim().toLowerCase()
    );
  }, [isAdmin, verifiedPlayerName, playerName]);

  // Gather unique available players from default, recent history, and stored rounds
  const availablePlayers = React.useMemo(() => {
    const list: string[] = [];
    if (defaultPlayerName && defaultPlayerName.trim()) {
      list.push(defaultPlayerName.trim());
    }
    const recent = getRecentPlayers();
    recent.forEach((p) => {
      if (p && p.trim() && !list.includes(p.trim())) {
        list.push(p.trim());
      }
    });
    try {
      const stored = getStoredRounds();
      stored.forEach((r) => {
        if (r.player_name && r.player_name.trim() && !list.includes(r.player_name.trim())) {
          list.push(r.player_name.trim());
        }
      });
    } catch (e) {
      // ignore
    }
    return list;
  }, [defaultPlayerName]);

  // Set default player from availablePlayers if available and not custom
  useEffect(() => {
    if (availablePlayers.length > 0 && !playerName && !isCustomPlayer) {
      const firstPlayer = verifiedPlayerName || availablePlayers[0];
      setPlayerName(firstPlayer);
    }
  }, [availablePlayers, verifiedPlayerName]);

  // Sort tournaments by date in ascending order
  const sortedTournaments = React.useMemo(() => {
    return [...dbTournaments].sort((a, b) => {
      const dateA = a.date || '';
      const dateB = b.date || '';
      return dateA.localeCompare(dateB);
    });
  }, [dbTournaments]);

  const handleSelectTournament = (val: string) => {
    if (!isPinVerified) {
      if (playerName && onVerifyPinForPlayer) {
        onVerifyPinForPlayer(playerName.trim());
      } else {
        setError('Please select or enter a player name first.');
      }
      return;
    }
    setSelectedTournamentId(val);
    if (!val) {
      setTournamentName('');
    } else {
      const found = sortedTournaments.find((t) => t.id === val);
      setTournamentName(found ? found.name : '');
    }
  };

  const handlePlayerChange = (selectedName: string) => {
    setPlayerName(selectedName);
    setError(null);
    if (selectedName && selectedName.trim() && onVerifyPinForPlayer) {
      // Prompt PIN code for the selected player if not verified
      if (!isAdmin && (!verifiedPlayerName || verifiedPlayerName.trim().toLowerCase() !== selectedName.trim().toLowerCase())) {
        onVerifyPinForPlayer(selectedName.trim());
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) {
      setError('Please enter a player name.');
      return;
    }
    if (!isPinVerified) {
      setError('Please enter your 4-digit PIN code for ' + playerName + ' to proceed.');
      if (onVerifyPinForPlayer) {
        onVerifyPinForPlayer(playerName.trim());
      }
      return;
    }
    if (!tournamentName.trim()) {
      setError('Please select a tournament from the database.');
      return;
    }

    setError(null);
    onStartRound(playerName.trim(), tournamentName.trim(), numRounds);
  };

  return (
    <div className="flex-1 flex flex-col p-4 w-full gap-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight">New Tournament</h1>
        <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          Enter details to start a 18-hole tournament round.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-5">
        {/* Player Name Input / Dropdown Selection */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 text-emerald-600">
              <User className="w-4 h-4" />
              <span>Player Name</span>
            </label>

            {availablePlayers.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  if (isCustomPlayer) {
                    setIsCustomPlayer(false);
                    handlePlayerChange(availablePlayers[0] || '');
                  } else {
                    setIsCustomPlayer(true);
                    setPlayerName('');
                  }
                }}
                className="text-xs text-emerald-600 hover:underline font-semibold flex items-center gap-1"
              >
                {isCustomPlayer ? 'Select Saved Player' : '+ Enter New Name'}
              </button>
            )}
          </div>

          {!isCustomPlayer && availablePlayers.length > 0 ? (
            <div className="relative">
              <select
                value={availablePlayers.includes(playerName) ? playerName : '__custom__'}
                onChange={(e) => {
                  if (e.target.value === '__custom__') {
                    setIsCustomPlayer(true);
                    setPlayerName('');
                  } else {
                    setIsCustomPlayer(false);
                    handlePlayerChange(e.target.value);
                  }
                }}
                required
                className={`w-full px-4 py-3.5 pr-10 rounded-2xl text-base font-bold transition appearance-none focus:outline-none cursor-pointer ${
                  isSunlight
                    ? 'bg-yellow-100 border-2 border-black text-black focus:bg-white'
                    : isDark
                    ? 'bg-slate-900 border border-slate-800 text-slate-100 focus:border-emerald-500'
                    : 'bg-white border border-slate-300 text-slate-900 focus:border-emerald-600 shadow-sm'
                }`}
                id="select-player-dropdown"
              >
                {availablePlayers.map((p) => (
                  <option key={p} value={p} className={isDark ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>
                    {p} {verifiedPlayerName?.trim().toLowerCase() === p.trim().toLowerCase() ? '✓ (PIN Verified)' : ''}
                  </option>
                ))}
                <option value="__custom__" className={isDark ? 'bg-slate-900 text-amber-400' : 'bg-white text-emerald-700'}>
                  + Enter new player name...
                </option>
              </select>
              <ChevronDown className="w-5 h-5 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />
            </div>
          ) : (
            <input
              type="text"
              required
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              onBlur={() => {
                if (playerName.trim() && onVerifyPinForPlayer) {
                  if (!isAdmin && (!verifiedPlayerName || verifiedPlayerName.trim().toLowerCase() !== playerName.trim().toLowerCase())) {
                    onVerifyPinForPlayer(playerName.trim());
                  }
                }
              }}
              placeholder="Enter player name"
              className={`w-full px-4 py-3.5 rounded-2xl text-base font-bold transition focus:outline-none ${
                isSunlight
                  ? 'bg-yellow-100 border-2 border-black text-black placeholder-slate-500 focus:bg-white'
                  : isDark
                  ? 'bg-slate-900 border border-slate-800 text-slate-100 placeholder-slate-500 focus:border-emerald-500'
                  : 'bg-white border border-slate-300 text-slate-900 placeholder-slate-400 focus:border-emerald-600 shadow-sm'
              }`}
              id="input-player-name"
            />
          )}

          {/* PIN Verification Status Banner */}
          {playerName.trim() && (
            <div className="mt-1">
              {isPinVerified ? (
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 text-xs font-bold flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>PIN Verified for {playerName}</span>
                  </span>
                  <span className="text-[10px] opacity-75">Unlocked</span>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-medium flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>PIN Code required to select tournament for <strong>{playerName}</strong>.</span>
                  </div>
                  {onVerifyPinForPlayer && (
                    <button
                      type="button"
                      onClick={() => onVerifyPinForPlayer(playerName.trim())}
                      className="self-start px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition flex items-center gap-1.5"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>Enter / Create PIN Code</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Tournament Name Drop Down List from Database */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 text-emerald-600">
            <Trophy className="w-4 h-4" />
            <span>Tournament Name</span>
          </label>

          {sortedTournaments.length > 0 ? (
            <div className="relative">
              <select
                value={selectedTournamentId}
                onChange={(e) => handleSelectTournament(e.target.value)}
                onClick={() => {
                  if (!isPinVerified && playerName && onVerifyPinForPlayer) {
                    onVerifyPinForPlayer(playerName.trim());
                  }
                }}
                required
                disabled={!isPinVerified}
                className={`w-full px-4 py-3.5 pr-10 rounded-2xl text-base font-bold transition appearance-none focus:outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                  isSunlight
                    ? 'bg-yellow-100 border-2 border-black text-black focus:bg-white'
                    : isDark
                    ? 'bg-slate-900 border border-slate-800 text-slate-100 focus:border-emerald-500'
                    : 'bg-white border border-slate-300 text-slate-900 focus:border-emerald-600 shadow-sm'
                }`}
                id="select-tournament-dropdown"
              >
                <option value="" className={isDark ? 'bg-slate-900 text-slate-400' : 'bg-white text-slate-500'}>
                  {isPinVerified ? 'Select from Database' : '🔒 Enter PIN to Unlock Tournaments'}
                </option>
                {sortedTournaments.map((t) => (
                  <option key={t.id} value={t.id} className={isDark ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>
                    {t.name} {t.course_name ? `(${t.course_name})` : ''} {t.date ? `[${t.date}]` : ''}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-5 h-5 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />
            </div>
          ) : (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-600 text-xs font-bold space-y-1">
              <p>No tournaments stored in database.</p>
              <p className="text-[11px] opacity-80 font-normal">
                An administrator can add tournaments to the database via the Auth / Admin Portal.
              </p>
            </div>
          )}
        </div>

        {/* Number of Rounds Option (2 or 4 rounds) */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold uppercase tracking-wider text-emerald-600">
            Number of Rounds
          </label>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setNumRounds(2)}
              className={`flex items-center justify-center gap-2 py-4 px-4 rounded-2xl font-black text-base border-2 transition active:scale-95 min-h-[56px] ${
                numRounds === 2
                  ? isSunlight
                    ? 'bg-black text-white border-black shadow-lg'
                    : isDark
                    ? 'bg-emerald-950 border-emerald-500 text-emerald-400'
                    : 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/30'
                  : isSunlight
                  ? 'bg-yellow-100 border-black text-black'
                  : isDark
                  ? 'bg-slate-900 border-slate-800 text-slate-300'
                  : 'bg-white border-slate-200 text-slate-700'
              }`}
              id="radio-rounds-2"
            >
              <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                numRounds === 2 ? 'border-current bg-current' : 'border-slate-400'
              }`}>
                {numRounds === 2 && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
              </span>
              <span>2 Rounds</span>
            </button>

            <button
              type="button"
              onClick={() => setNumRounds(4)}
              className={`flex items-center justify-center gap-2 py-4 px-4 rounded-2xl font-black text-base border-2 transition active:scale-95 min-h-[56px] ${
                numRounds === 4
                  ? isSunlight
                    ? 'bg-black text-white border-black shadow-lg'
                    : isDark
                    ? 'bg-emerald-950 border-emerald-500 text-emerald-400'
                    : 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/30'
                  : isSunlight
                  ? 'bg-yellow-100 border-black text-black'
                  : isDark
                  ? 'bg-slate-900 border-slate-800 text-slate-300'
                  : 'bg-white border-slate-200 text-slate-700'
              }`}
              id="radio-rounds-4"
            >
              <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                numRounds === 4 ? 'border-current bg-current' : 'border-slate-400'
              }`}>
                {numRounds === 4 && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
              </span>
              <span>4 Rounds</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 font-bold text-xs">
            {error}
          </div>
        )}

        {/* Start Round Button */}
        <div className="mt-auto pt-4 pb-6">
          <button
            type="submit"
            className={`w-full py-4 px-6 rounded-2xl font-black text-lg tracking-wide shadow-xl flex items-center justify-center gap-2 transition active:scale-95 min-h-[60px] ${
              isSunlight
                ? 'bg-black text-white border-2 border-black hover:bg-slate-900'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30'
            }`}
            id="btn-start-round"
          >
            <Play className="w-6 h-6 fill-current" />
            <span>Start Round 1</span>
          </button>
        </div>
      </form>
    </div>
  );
};
