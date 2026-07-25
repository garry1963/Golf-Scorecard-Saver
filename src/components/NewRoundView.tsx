import React, { useState, useEffect } from 'react';
import { RoundsCount, ThemeMode, Tournament } from '../types';
import { User, Trophy, Play, ChevronDown, Plus } from 'lucide-react';
import { getRecentPlayers } from '../services/storage';

interface NewRoundViewProps {
  defaultPlayerName?: string;
  defaultNumRounds?: RoundsCount;
  dbTournaments?: Tournament[];
  onStartRound: (playerName: string, tournamentName: string, numRounds: RoundsCount) => void;
  themeMode: ThemeMode;
}

export const NewRoundView: React.FC<NewRoundViewProps> = ({
  defaultPlayerName = '',
  defaultNumRounds = 2,
  dbTournaments = [],
  onStartRound,
  themeMode,
}) => {
  const [playerName, setPlayerName] = useState(defaultPlayerName || '');
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>('');
  const [tournamentName, setTournamentName] = useState<string>('');
  const [isCustomTournament, setIsCustomTournament] = useState<boolean>(false);
  const [numRounds, setNumRounds] = useState<RoundsCount>(defaultNumRounds || 2);
  const [error, setError] = useState<string | null>(null);

  const recentPlayers = getRecentPlayers();

  const isSunlight = themeMode === 'sunlight';
  const isDark = themeMode === 'dark';

  // Sort tournaments by date in ascending order
  const sortedTournaments = React.useMemo(() => {
    return [...dbTournaments].sort((a, b) => {
      const dateA = a.date || '';
      const dateB = b.date || '';
      return dateA.localeCompare(dateB);
    });
  }, [dbTournaments]);

  // Set default tournament from sortedTournaments if available
  useEffect(() => {
    if (sortedTournaments.length > 0 && !selectedTournamentId && !isCustomTournament) {
      setSelectedTournamentId(sortedTournaments[0].id);
      setTournamentName(sortedTournaments[0].name);
    } else if (dbTournaments.length === 0 && !isCustomTournament) {
      setIsCustomTournament(true);
      setTournamentName('Club Championship');
    }
  }, [sortedTournaments]);

  const handleSelectTournament = (val: string) => {
    if (val === '__custom__') {
      setIsCustomTournament(true);
      setSelectedTournamentId('__custom__');
      setTournamentName('');
    } else {
      setIsCustomTournament(false);
      setSelectedTournamentId(val);
      const found = sortedTournaments.find((t) => t.id === val);
      if (found) {
        setTournamentName(found.name);
      } else {
        setTournamentName(val);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) {
      setError('Please enter a player name.');
      return;
    }
    if (!tournamentName.trim()) {
      setError('Please select or enter a tournament name.');
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
        {/* Player Name Input */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 text-emerald-600">
            <User className="w-4 h-4" />
            <span>Player Name</span>
          </label>

          <input
            type="text"
            required
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
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

          {/* Quick Player Suggestions */}
          {recentPlayers.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {recentPlayers.map((p) => (
                <button
                  type="button"
                  key={p}
                  onClick={() => setPlayerName(p)}
                  className={`text-xs px-2.5 py-1 rounded-full font-medium transition active:scale-95 ${
                    playerName === p
                      ? isSunlight
                        ? 'bg-black text-white font-bold'
                        : 'bg-emerald-600 text-white font-bold'
                      : isDark
                      ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Tournament Name Drop Down List from Database */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 text-emerald-600">
              <Trophy className="w-4 h-4" />
              <span>Tournament Name</span>
            </label>

            {sortedTournaments.length > 0 && (
              <button
                type="button"
                onClick={() => handleSelectTournament(isCustomTournament ? (sortedTournaments[0]?.id || '') : '__custom__')}
                className="text-xs text-emerald-600 hover:underline font-semibold flex items-center gap-1"
              >
                {isCustomTournament ? 'Select from Database' : '+ Enter Custom Name'}
              </button>
            )}
          </div>

          {!isCustomTournament && sortedTournaments.length > 0 ? (
            <div className="relative">
              <select
                value={selectedTournamentId}
                onChange={(e) => handleSelectTournament(e.target.value)}
                required
                className={`w-full px-4 py-3.5 pr-10 rounded-2xl text-base font-bold transition appearance-none focus:outline-none cursor-pointer ${
                  isSunlight
                    ? 'bg-yellow-100 border-2 border-black text-black focus:bg-white'
                    : isDark
                    ? 'bg-slate-900 border border-slate-800 text-slate-100 focus:border-emerald-500'
                    : 'bg-white border border-slate-300 text-slate-900 focus:border-emerald-600 shadow-sm'
                }`}
                id="select-tournament-dropdown"
              >
                {sortedTournaments.map((t) => (
                  <option key={t.id} value={t.id} className={isDark ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>
                    {t.name} {t.course_name ? `(${t.course_name})` : ''} {t.date ? `[${t.date}]` : ''}
                  </option>
                ))}
                <option value="__custom__" className={isDark ? 'bg-slate-900 text-amber-400' : 'bg-white text-emerald-700'}>
                  + Enter unlisted tournament...
                </option>
              </select>
              <ChevronDown className="w-5 h-5 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />
            </div>
          ) : (
            <input
              type="text"
              required
              value={tournamentName}
              onChange={(e) => setTournamentName(e.target.value)}
              placeholder="e.g. Club Championship"
              className={`w-full px-4 py-3.5 rounded-2xl text-base font-bold transition focus:outline-none ${
                isSunlight
                  ? 'bg-yellow-100 border-2 border-black text-black placeholder-slate-500 focus:bg-white'
                  : isDark
                  ? 'bg-slate-900 border border-slate-800 text-slate-100 placeholder-slate-500 focus:border-emerald-500'
                  : 'bg-white border border-slate-300 text-slate-900 placeholder-slate-400 focus:border-emerald-600 shadow-sm'
              }`}
              id="input-tournament-name"
            />
          )}

          {dbTournaments.length === 0 && (
            <p className="text-[11px] opacity-60 italic">
              No pre-saved tournaments in database yet. Admins can add tournaments in the Admin Portal.
            </p>
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
