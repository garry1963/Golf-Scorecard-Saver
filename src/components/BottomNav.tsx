import React from 'react';
import { ClipboardList, PlusCircle, Settings as SettingsIcon } from 'lucide-react';
import { ActiveTab, ThemeMode } from '../types';

interface BottomNavProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  themeMode: ThemeMode;
  hasUnfinishedRound?: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  themeMode,
  hasUnfinishedRound,
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
    <nav className={`w-full grid grid-cols-3 gap-1 px-3 py-2 sticky bottom-0 z-30 ${navClass}`}>
      <button
        onClick={() => onTabChange('scorecards')}
        className={`flex flex-col items-center justify-center transition active:scale-95 min-h-[52px] ${getItemClass(
          'scorecards'
        )}`}
        id="nav-btn-scorecards"
      >
        <div className="relative">
          <ClipboardList className="w-6 h-6 stroke-[2.2]" />
          {hasUnfinishedRound && (
            <span className="absolute -top-1 -right-1.5 w-3 h-3 bg-amber-500 rounded-full ring-2 ring-white animate-pulse" />
          )}
        </div>
        <span className="text-xs font-semibold mt-0.5 tracking-tight">Scorecards</span>
      </button>

      <button
        onClick={() => onTabChange('new_round')}
        className={`flex flex-col items-center justify-center transition active:scale-95 min-h-[52px] ${getItemClass(
          'new_round'
        )}`}
        id="nav-btn-new-round"
      >
        <PlusCircle className="w-6 h-6 stroke-[2.2]" />
        <span className="text-xs font-semibold mt-0.5 tracking-tight">New Round</span>
      </button>

      <button
        onClick={() => onTabChange('settings')}
        className={`flex flex-col items-center justify-center transition active:scale-95 min-h-[52px] ${getItemClass(
          'settings'
        )}`}
        id="nav-btn-settings"
      >
        <SettingsIcon className="w-6 h-6 stroke-[2.2]" />
        <span className="text-xs font-semibold mt-0.5 tracking-tight">Settings</span>
      </button>
    </nav>
  );
};
