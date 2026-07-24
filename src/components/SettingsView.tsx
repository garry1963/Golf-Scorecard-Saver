import React, { useRef, useState } from 'react';
import { AppSettings, RoundsCount, ThemeMode } from '../types';
import {
  Sun,
  Moon,
  Sparkles,
  Download,
  Upload,
  Trash2,
  CheckCircle2,
  User,
  Zap,
} from 'lucide-react';

interface SettingsViewProps {
  settings: AppSettings;
  onSaveSettings: (newSettings: AppSettings) => void;
  onExportCSV: () => void;
  onImportCSV: (file: File) => void;
  onClearAllData: () => void;
  themeMode: ThemeMode;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onSaveSettings,
  onExportCSV,
  onImportCSV,
  onClearAllData,
  themeMode,
}) => {
  const [defaultNumRounds, setDefaultNumRounds] = useState<RoundsCount>(settings.defaultNumRounds || 2);
  const [currentTheme, setCurrentTheme] = useState<ThemeMode>(settings.themeMode);
  const [autoSave, setAutoSave] = useState<boolean>(settings.autoSave);
  const [defaultPlayerName, setDefaultPlayerName] = useState<string>(settings.defaultPlayerName || '');
  const [confirmClear, setConfirmClear] = useState<boolean>(false);
  const [savedMsg, setSavedMsg] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const isSunlight = themeMode === 'sunlight';
  const isDark = themeMode === 'dark';

  const handleApplySettings = (updated: Partial<AppSettings>) => {
    const newSettings: AppSettings = {
      ...settings,
      defaultNumRounds,
      themeMode: currentTheme,
      autoSave,
      defaultPlayerName,
      ...updated,
    };
    onSaveSettings(newSettings);
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 1500);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportCSV(file);
      e.target.value = '';
    }
  };

  return (
    <div className="flex-1 flex flex-col p-4 w-full gap-5 pb-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight">Settings</h1>
        <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          Preferences & Data Management
        </p>
      </div>

      <div className="flex-1 flex flex-col gap-4">
        {/* Section 1: Preferences */}
        <div className={`p-4 rounded-2xl flex flex-col gap-4 border shadow-sm ${
          isSunlight
            ? 'bg-yellow-100 border-2 border-black text-black'
            : isDark
            ? 'bg-slate-900 border-slate-800 text-slate-100'
            : 'bg-white border-slate-200 text-slate-900'
        }`}>
          <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-600">
            Tournament Preferences
          </h2>

          {/* Default Number of Rounds */}
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="text-sm font-bold">Default Tournament Length</div>
              <div className="text-xs opacity-75">18 holes per round</div>
            </div>

            <div className="flex items-center gap-1 bg-slate-500/10 p-1 rounded-xl">
              <button
                onClick={() => {
                  setDefaultNumRounds(2);
                  handleApplySettings({ defaultNumRounds: 2 });
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition ${
                  defaultNumRounds === 2
                    ? isSunlight
                      ? 'bg-black text-white'
                      : 'bg-emerald-600 text-white'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                id="btn-settings-rounds-2"
              >
                2 Rounds
              </button>
              <button
                onClick={() => {
                  setDefaultNumRounds(4);
                  handleApplySettings({ defaultNumRounds: 4 });
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition ${
                  defaultNumRounds === 4
                    ? isSunlight
                      ? 'bg-black text-white'
                      : 'bg-emerald-600 text-white'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                id="btn-settings-rounds-4"
              >
                4 Rounds
              </button>
            </div>
          </div>

          {/* Default Player Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold flex items-center gap-1 text-slate-700 dark:text-slate-300">
              <User className="w-3.5 h-3.5 text-emerald-600" />
              <span>Default Player Name</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={defaultPlayerName}
                onChange={(e) => setDefaultPlayerName(e.target.value)}
                placeholder="e.g. John Smith"
                className={`flex-1 px-3 py-2 rounded-xl text-xs font-bold border transition focus:outline-none ${
                  isSunlight
                    ? 'bg-yellow-200 border-black text-black'
                    : isDark
                    ? 'bg-slate-800 border-slate-700 text-slate-100'
                    : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
                id="input-default-player"
              />
              <button
                onClick={() => handleApplySettings({ defaultPlayerName })}
                className="px-3 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow hover:bg-emerald-700 transition"
              >
                Save
              </button>
            </div>
          </div>

          {/* Auto Save Toggle */}
          <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-500/10">
            <div>
              <div className="text-sm font-bold flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-emerald-600" />
                <span>Instant Auto Save</span>
              </div>
              <div className="text-xs opacity-75">Save score changes instantly on tap</div>
            </div>

            <button
              onClick={() => {
                const nextVal = !autoSave;
                setAutoSave(nextVal);
                handleApplySettings({ autoSave: nextVal });
              }}
              className={`w-12 h-7 rounded-full transition-colors relative p-1 ${
                autoSave ? 'bg-emerald-600' : 'bg-slate-400'
              }`}
              id="btn-toggle-autosave"
            >
              <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                autoSave ? 'translate-x-5' : 'translate-x-0'
              }`} />
            </button>
          </div>
        </div>

        {/* Section 2: Display & Appearance */}
        <div className={`p-4 rounded-2xl flex flex-col gap-3 border shadow-sm ${
          isSunlight
            ? 'bg-yellow-100 border-2 border-black text-black'
            : isDark
            ? 'bg-slate-900 border-slate-800 text-slate-100'
            : 'bg-white border-slate-200 text-slate-900'
        }`}>
          <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-600">
            Display Mode
          </h2>

          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => {
                setCurrentTheme('light');
                handleApplySettings({ themeMode: 'light' });
              }}
              className={`p-3 rounded-xl flex flex-col items-center justify-center gap-1 border transition active:scale-95 ${
                currentTheme === 'light'
                  ? 'bg-emerald-600 text-white border-emerald-600 font-bold shadow'
                  : 'bg-slate-100 text-slate-800 border-slate-200 hover:bg-slate-200'
              }`}
              id="btn-theme-light"
            >
              <Sparkles className="w-5 h-5" />
              <span className="text-xs font-bold">Light</span>
            </button>

            <button
              onClick={() => {
                setCurrentTheme('dark');
                handleApplySettings({ themeMode: 'dark' });
              }}
              className={`p-3 rounded-xl flex flex-col items-center justify-center gap-1 border transition active:scale-95 ${
                currentTheme === 'dark'
                  ? 'bg-slate-900 text-emerald-400 border-emerald-500 font-bold shadow'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
              id="btn-theme-dark"
            >
              <Moon className="w-5 h-5" />
              <span className="text-xs font-bold">Dark</span>
            </button>

            <button
              onClick={() => {
                setCurrentTheme('sunlight');
                handleApplySettings({ themeMode: 'sunlight' });
              }}
              className={`p-3 rounded-xl flex flex-col items-center justify-center gap-1 border-2 transition active:scale-95 ${
                currentTheme === 'sunlight'
                  ? 'bg-yellow-300 text-black border-black font-black shadow-md'
                  : 'bg-yellow-100 text-black border-black hover:bg-yellow-200'
              }`}
              id="btn-theme-sunlight"
            >
              <Sun className="w-5 h-5 text-amber-600" />
              <span className="text-xs font-black">Sunlight</span>
            </button>
          </div>
        </div>

        {/* Section 3: Data Export / Import */}
        <div className={`p-4 rounded-2xl flex flex-col gap-3 border shadow-sm ${
          isSunlight
            ? 'bg-yellow-100 border-2 border-black text-black'
            : isDark
            ? 'bg-slate-900 border-slate-800 text-slate-100'
            : 'bg-white border-slate-200 text-slate-900'
        }`}>
          <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-600">
            Data Backup
          </h2>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onExportCSV}
              className={`py-3 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition active:scale-95 min-h-[48px] ${
                isSunlight
                  ? 'bg-yellow-200 border-black text-black hover:bg-yellow-300'
                  : isDark
                  ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
                  : 'bg-slate-100 border-slate-300 text-slate-800 hover:bg-slate-200'
              }`}
              id="btn-export-csv"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className={`py-3 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition active:scale-95 min-h-[48px] ${
                isSunlight
                  ? 'bg-yellow-200 border-black text-black hover:bg-yellow-300'
                  : isDark
                  ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
                  : 'bg-slate-100 border-slate-300 text-slate-800 hover:bg-slate-200'
              }`}
              id="btn-import-csv"
            >
              <Upload className="w-4 h-4 text-emerald-600" />
              <span>Import CSV</span>
            </button>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".csv"
              className="hidden"
            />
          </div>
        </div>

        {/* Clear All Data */}
        <div className="pt-2 mt-auto">
          {confirmClear ? (
            <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/30 flex flex-col gap-2">
              <span className="text-xs font-bold text-red-600 text-center">
                Are you sure? This will delete all saved scorecards!
              </span>
              <div className="flex gap-2">
                <button
                  onClick={onClearAllData}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-black text-xs shadow"
                >
                  Confirm Delete All
                </button>
                <button
                  onClick={() => setConfirmClear(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-500/20 text-xs font-bold"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setConfirmClear(true)}
              className="w-full py-3 rounded-xl text-xs font-bold text-red-500 hover:text-red-600 flex items-center justify-center gap-1.5 transition"
              id="btn-clear-all-data"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear All Data</span>
            </button>
          )}
        </div>
      </div>

      {savedMsg && (
        <div className="fixed bottom-16 left-1/2 -translate-x-1/2 px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-full shadow-lg flex items-center gap-1 animate-fade-in">
          <CheckCircle2 className="w-4 h-4" />
          <span>Settings saved!</span>
        </div>
      )}
    </div>
  );
};
