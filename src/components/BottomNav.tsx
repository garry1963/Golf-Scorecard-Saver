import React from 'react';
import { PlusCircle, HelpCircle, ClipboardList } from 'lucide-react';
import { ActiveTab, ThemeMode } from '../types';

interface BottomNavProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  themeMode: ThemeMode;
  hasUnfinishedRound?: boolean;
  isSignedWithPin?: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  themeMode,
  hasUnfinishedRound,
  isSignedWithPin = false,
}) => {
  const isSunlight = themeMode === 'sunlight';
  const isDark = themeMode === 'dark';

  const navClass = isSunlight
    ? 'bg-yellow-200 border-t-4 border-black text-black'
    : isDark
    ? 'bg-slate-900 border-t border-slate-800 text-slate-300'
    : 'bg-white border-t border-slate-200 text-slate-600 shadow-lg';

  const getItemClass = (tab: ActiveTab) => {
    const isActive = activeTab === tab;
    if (isSunlight) {
      return isActive
        ? 'text-black font-extrabold bg-yellow-400 border-2 border-black rounded-lg py-1'
        : 'text-black hover:bg-yellow-300 rounded-lg py-1';
    }
    if (isDark) {
      return isActive
        ? 'text-emerald-400 font-bold bg-emerald-950/60 rounded-xl py-1'
        : 'text-slate-400 hover:text-slate-200 py-1';
    }
    return isActive
      ? 'text-emerald-700 font-bold bg-emerald-50 rounded-xl py-1'
      : 'text-slate-500 hover:text-slate-900 py-1';
  };

  return (
    <nav className={`w-full grid ${isSignedWithPin ? 'grid-cols-3' : 'grid-cols-2'} gap-2 px-4 py-2 sticky bottom-0 z-30 ${navClass}`}>
      <button
        onClick={() => onTabChange('new_round')}
        className={`flex flex-col items-center justify-center transition active:scale-95 min-h-[52px] ${getItemClass(
          'new_round'
        )}`}
        id="nav-btn-new-round"
      >
        <div className="relative">
          <PlusCircle className="w-6 h-6 stroke-[2.2]" />
          {hasUnfinishedRound && (
            <span className="absolute -top-1 -right-1.5 w-3 h-3 bg-amber-500 rounded-full ring-2 ring-white animate-pulse" />
          )}
        </div>
        <span className="text-xs font-semibold mt-0.5 tracking-tight">New Round</span>
      </button>

      {/* Scorecards Button - Only visible when signed in with PIN code or Admin */}
      {isSignedWithPin && (
        <button
          onClick={() => onTabChange('scorecards')}
          className={`flex flex-col items-center justify-center transition active:scale-95 min-h-[52px] ${getItemClass(
            'scorecards'
          )}`}
          id="nav-btn-scorecards"
        >
          <ClipboardList className="w-6 h-6 stroke-[2.2]" />
          <span className="text-xs font-semibold mt-0.5 tracking-tight">Scorecards</span>
        </button>
      )}

      <button
        onClick={() => onTabChange('help')}
        className={`flex flex-col items-center justify-center transition active:scale-95 min-h-[52px] ${getItemClass(
          'help'
        )}`}
        id="nav-btn-user-help"
      >
        <HelpCircle className="w-6 h-6 stroke-[2.2]" />
        <span className="text-xs font-semibold mt-0.5 tracking-tight">User Help</span>
      </button>
    </nav>
  );
};

