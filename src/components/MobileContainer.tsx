import React, { useState } from 'react';
import { Smartphone, Sun, Moon, Sparkles, Monitor, Shield, UserCheck, ShieldAlert, LogOut } from 'lucide-react';
import { ThemeMode } from '../types';

interface MobileContainerProps {
  children: React.ReactNode;
  themeMode: ThemeMode;
  onThemeChange: (mode: ThemeMode) => void;
  activeRoundTitle?: string;
  onOpenAdminModal?: () => void;
  userRole?: 'admin' | 'user';
  isApproved?: boolean;
  verifiedPlayerName?: string | null;
  onSignOut?: () => void;
}

export const MobileContainer: React.FC<MobileContainerProps> = ({
  children,
  themeMode,
  onThemeChange,
  activeRoundTitle,
  onOpenAdminModal,
  userRole,
  isApproved,
  verifiedPlayerName,
  onSignOut,
}) => {
  const [isPhoneFrame, setIsPhoneFrame] = useState<boolean>(true);

  // Theme styling mapping
  const getThemeClasses = () => {
    switch (themeMode) {
      case 'dark':
        return 'bg-slate-950 text-slate-100 dark-theme';
      case 'sunlight':
        return 'bg-yellow-50 text-black border-4 border-black font-semibold sunlight-theme';
      case 'light':
      default:
        return 'bg-slate-50 text-slate-900 light-theme';
    }
  };

  return (
    <div className={`min-h-screen flex flex-col items-center justify-start transition-colors duration-200 ${
      themeMode === 'dark' ? 'bg-slate-900 text-slate-100' : 'bg-emerald-950/10 text-slate-900'
    }`}>
      {/* Top Desktop Helper Header bar */}
      <header className="w-full max-w-md px-4 py-2.5 flex items-center justify-between text-xs font-medium border-b border-emerald-800/10 bg-emerald-900 text-emerald-100 shadow-sm z-30">
        <div className="flex items-center gap-1.5 font-bold tracking-wide">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>GOLF SCORECARD</span>
          {activeRoundTitle && (
            <span className="truncate max-w-[100px] opacity-80 font-normal">
              • {activeRoundTitle}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {/* Admin / Auth Portal Trigger */}
          {onOpenAdminModal && (
            <button
              onClick={onOpenAdminModal}
              title="Firebase Admin & Auth Portal"
              className={`flex items-center gap-1 px-2 py-1 rounded transition active:scale-95 text-[11px] font-bold ${
                userRole === 'admin'
                  ? 'bg-purple-600 text-white'
                  : isApproved
                  ? 'bg-emerald-700 text-white'
                  : 'bg-amber-600 text-white'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>{userRole === 'admin' ? 'Admin' : isApproved ? 'User' : 'Auth'}</span>
            </button>
          )}

          {/* Quick Sign Out Button */}
          {onSignOut && (userRole === 'admin' || isApproved || verifiedPlayerName) && (
            <button
              onClick={onSignOut}
              title="Sign Out of Account"
              className="flex items-center gap-1 px-2 py-1 rounded bg-rose-600/90 hover:bg-rose-600 text-white transition active:scale-95 text-[11px] font-bold shadow-sm cursor-pointer"
              id="btn-header-signout"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          )}

          {/* Theme Quick Switcher */}
          <button
            onClick={() => {
              if (themeMode === 'light') onThemeChange('dark');
              else if (themeMode === 'dark') onThemeChange('sunlight');
              else onThemeChange('light');
            }}
            title={`Current theme: ${themeMode.toUpperCase()} (Click to toggle)`}
            className="flex items-center gap-1 px-2 py-1 rounded bg-emerald-800/60 hover:bg-emerald-800 text-emerald-100 transition active:scale-95 text-[11px]"
          >
            {themeMode === 'sunlight' && <Sun className="w-3.5 h-3.5 text-yellow-300" />}
            {themeMode === 'dark' && <Moon className="w-3.5 h-3.5 text-slate-200" />}
            {themeMode === 'light' && <Sparkles className="w-3.5 h-3.5 text-emerald-300" />}
            <span className="capitalize">{themeMode}</span>
          </button>

          {/* Desktop/Phone frame toggle button */}
          <button
            onClick={() => setIsPhoneFrame(!isPhoneFrame)}
            title="Toggle phone viewport view"
            className="p-1 rounded hover:bg-emerald-800/60 text-emerald-200 transition"
          >
            {isPhoneFrame ? <Monitor className="w-3.5 h-3.5" /> : <Smartphone className="w-3.5 h-3.5" />}
          </button>
        </div>
      </header>

      {/* Main App Canvas */}
      <main className={`w-full flex-1 flex flex-col justify-start items-center p-0 md:py-4 ${
        isPhoneFrame ? 'max-w-[440px]' : 'max-w-2xl'
      }`}>
        <div className={`w-full flex-1 flex flex-col relative overflow-hidden shadow-2xl transition-all ${getThemeClasses()} ${
          isPhoneFrame 
            ? 'md:rounded-[36px] md:border-[10px] md:border-slate-800 min-h-[780px] max-h-[880px]' 
            : 'md:rounded-2xl min-h-screen'
        }`}>
          {/* Top Speaker Notch for Phone View on desktop */}
          {isPhoneFrame && (
            <div className="hidden md:flex justify-center items-center pt-2 pb-1 bg-transparent z-40">
              <div className="w-24 h-4 bg-slate-800 rounded-full flex items-center justify-center gap-2 px-3">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-700" />
                <div className="w-10 h-1 bg-slate-700 rounded-full" />
              </div>
            </div>
          )}

          {/* Render inner view content */}
          <div className="flex-1 flex flex-col overflow-y-auto relative w-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};
