import React from 'react';
import { HelpCircle, UserCheck, Play, Shield, Sun, Trophy, CheckCircle2, FileText, Smartphone } from 'lucide-react';
import { ThemeMode } from '../types';

interface UserHelpViewProps {
  themeMode: ThemeMode;
  onClose?: () => void;
  onOpenAuthPortal?: () => void;
}

export const UserHelpView: React.FC<UserHelpViewProps> = ({
  themeMode,
  onClose,
  onOpenAuthPortal,
}) => {
  const isSunlight = themeMode === 'sunlight';
  const isDark = themeMode === 'dark';

  return (
    <div className="flex-1 flex flex-col p-4 w-full gap-5 max-w-2xl mx-auto animate-fadeIn">
      {/* Title Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-500/20">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
            <HelpCircle className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight">User Registration & Guide</h1>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              How to register, request access, and manage golf scorecards.
            </p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition active:scale-95 ${
              isSunlight
                ? 'bg-black text-white'
                : 'bg-emerald-600 text-white hover:bg-emerald-700'
            }`}
          >
            Done
          </button>
        )}
      </div>

      {/* Section 1: Registration & Access Request */}
      <div className={`p-4 rounded-2xl border space-y-3 ${
        isSunlight
          ? 'bg-yellow-100 border-black text-black'
          : isDark
          ? 'bg-slate-900 border-slate-800 text-slate-100'
          : 'bg-white border-slate-200 text-slate-900 shadow-sm'
      }`}>
        <div className="flex items-center gap-2 text-emerald-600 font-black text-sm uppercase tracking-wider">
          <UserCheck className="w-5 h-5" />
          <span>1. How to Register & Request Access</span>
        </div>

        <p className="text-xs leading-relaxed opacity-90">
          Public sign-ups are disabled for database security. Regular users must request account approval from an administrator:
        </p>

        <ol className="space-y-2 text-xs opacity-90 list-decimal list-inside pl-1">
          <li className="leading-snug">
            Click the <strong className="text-emerald-600">Auth / User Portal</strong> button in the top-right header.
          </li>
          <li className="leading-snug">
            Select the <strong className="text-emerald-600">Request Access</strong> tab.
          </li>
          <li className="leading-snug">
            Type your <strong className="text-emerald-600">Player Name</strong> and tap <strong>Submit Request to Admin</strong>.
          </li>
          <li className="leading-snug">
            Your request will be placed in the Firestore database pending queue. Once approved by the admin, you get full scorecard access!
          </li>
        </ol>

        {onOpenAuthPortal && (
          <button
            onClick={onOpenAuthPortal}
            className={`mt-2 w-full py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 ${
              isSunlight
                ? 'bg-black text-white'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Open Registration & Auth Portal</span>
          </button>
        )}
      </div>

      {/* Section 2: Playing a Tournament */}
      <div className={`p-4 rounded-2xl border space-y-3 ${
        isSunlight
          ? 'bg-yellow-100 border-black text-black'
          : isDark
          ? 'bg-slate-900 border-slate-800 text-slate-100'
          : 'bg-white border-slate-200 text-slate-900 shadow-sm'
      }`}>
        <div className="flex items-center gap-2 text-emerald-600 font-black text-sm uppercase tracking-wider">
          <Trophy className="w-5 h-5" />
          <span>2. Starting & Playing a Tournament</span>
        </div>

        <ul className="space-y-2 text-xs opacity-90 list-disc list-inside pl-1">
          <li>
            <strong>Select Tournament:</strong> Choose a pre-saved tournament from the database dropdown (automatically sorted by date in ascending order).
          </li>
          <li>
            <strong>Choose Rounds:</strong> Pick between a 2-round or 4-round tournament setup.
          </li>
          <li>
            <strong>Recording Scores:</strong> Navigate hole-by-hole (1 through 18) to record total strokes.
          </li>
          <li>
            <strong>Entering Subsequent Rounds Later:</strong> After completing your first round, you can enter Round 2, 3, or 4 at any later date or time. Simply start a <strong>New Round</strong>, select the same <strong>Player Name</strong> and <strong>Tournament Name</strong> from the dropdown, and complete the next round. All rounds for the same player and tournament are automatically grouped and calculated together on the <strong>Scorecards</strong> screen.
          </li>
        </ul>
      </div>

      {/* Section 3: PIN Code Protection & Scorecard Privacy */}
      <div className={`p-4 rounded-2xl border space-y-3 ${
        isSunlight
          ? 'bg-yellow-100 border-black text-black'
          : isDark
          ? 'bg-slate-900 border-slate-800 text-slate-100'
          : 'bg-white border-slate-200 text-slate-900 shadow-sm'
      }`}>
        <div className="flex items-center gap-2 text-emerald-600 font-black text-sm uppercase tracking-wider">
          <Shield className="w-5 h-5" />
          <span>3. PIN Code Protection & Scorecard Privacy</span>
        </div>

        <ul className="space-y-2 text-xs opacity-90 list-disc list-inside pl-1">
          <li>
            <strong>Creating & Entering PIN Code:</strong> When an approved user selects their Player Name from the dropdown, they must enter or create a 4-digit PIN code. This PIN verifies your identity and unlocks tournament selection.
          </li>
          <li>
            <strong>Restricted Scorecard Viewing & Editing:</strong> Privacy rules restrict scorecard viewing and editing so users can <strong>only see and edit scorecards matching their Player Name</strong>.
          </li>
          <li>
            <strong>Pending / Guest Users:</strong> Unapproved guest or pending users have no access to scorecards.
          </li>
          <li>
            <strong>Administrator Access & User Deletion:</strong> Administrators have master access to view, edit, or delete all scorecards across all players. Additionally, Administrators can delete any registered user account along with all of their associated scorecards, PIN codes, and permissions from the <strong>All Users</strong> tab in the Admin Portal.
          </li>
          <li>
            <strong>Bottom Scorecards Button:</strong> Once you sign in with your 4-digit PIN code (or sign in as Administrator), a <strong>Scorecards</strong> button becomes visible at the bottom of the home screen for direct access to your scorecards.
          </li>
        </ul>
      </div>

      {/* Section 4: Scorecards & Settings */}
      <div className={`p-4 rounded-2xl border space-y-3 ${
        isSunlight
          ? 'bg-yellow-100 border-black text-black'
          : isDark
          ? 'bg-slate-900 border-slate-800 text-slate-100'
          : 'bg-white border-slate-200 text-slate-900 shadow-sm'
      }`}>
        <div className="flex items-center gap-2 text-emerald-600 font-black text-sm uppercase tracking-wider">
          <FileText className="w-5 h-5" />
          <span>4. Scorecards & App Settings</span>
        </div>

        <p className="text-xs leading-relaxed opacity-90">
          All scorecards and application settings (default player names, auto-save, CSV exports) are managed securely in the <strong>User & Admin Portal</strong> via the top bar.
        </p>
      </div>

      {/* Section 5: Sunlight Mode */}
      <div className={`p-4 rounded-2xl border space-y-3 ${
        isSunlight
          ? 'bg-yellow-100 border-black text-black'
          : isDark
          ? 'bg-slate-900 border-slate-800 text-slate-100'
          : 'bg-white border-slate-200 text-slate-900 shadow-sm'
      }`}>
        <div className="flex items-center gap-2 text-emerald-600 font-black text-sm uppercase tracking-wider">
          <Sun className="w-5 h-5" />
          <span>5. Outdoor Sunlight Mode</span>
        </div>

        <p className="text-xs leading-relaxed opacity-90">
          Tap the theme button in the top header to switch between <strong>Light</strong>, <strong>Dark</strong>, and high-contrast <strong>Sunlight Mode</strong> designed specifically for optimal outdoor visibility under direct bright sunlight on the golf course.
        </p>
      </div>
    </div>
  );
};
