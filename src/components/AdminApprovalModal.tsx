import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  ShieldAlert,
  Check,
  X,
  UserCheck,
  Clock,
  Lock,
  LogOut,
  Shield,
  User,
  Users,
  Database,
  RefreshCw,
  Search,
  Trophy,
  Plus,
  Trash2,
  ClipboardList,
  Settings as SettingsIcon,
  HelpCircle,
} from 'lucide-react';
import { UserHelpView } from './UserHelpView';
import {
  getRecentPlayers,
  SAMPLE_PLAYER_NAMES,
  getRemovedPlayerNames,
  addRemovedPlayerName,
} from '../services/storage';
import {
  auth,
  loginAdmin,
  loginAdminWithGoogle,
  logoutUser,
  requestUserAccess,
  listenToPendingUsers,
  listenToAllUsers,
  approvePendingUser,
  rejectPendingUser,
  deleteUserAndData,
  saveTournamentToFirestore,
  deleteTournamentFromFirestore,
  listenToTournaments,
  UserProfile,
  PendingUser,
  fetchUserProfile,
} from '../lib/firebase';
import { ThemeMode, Round, Tournament, AppSettings } from '../types';
import { ScorecardsView } from './ScorecardsView';
import { SettingsView } from './SettingsView';

interface AdminApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserProfile: UserProfile | null;
  onProfileUpdated: (profile: UserProfile | null) => void;
  themeMode: ThemeMode;
  allRoundsCount?: number;

  // Scorecards props
  rounds?: Round[];
  onContinueRound?: (roundId: string) => void;
  onViewRound?: (roundId: string) => void;
  onDeleteRound?: (roundId: string) => void;
  onDuplicateRound?: (roundId: string) => void;
  onNewRoundClick?: () => void;

  // Settings props
  settings?: AppSettings;
  onSaveSettings?: (settings: AppSettings) => void;
  onExportCSV?: () => void;
  onImportCSV?: (file: File) => void;
  onClearAllData?: () => void;
  onDeleteUserAndData?: (user: UserProfile) => void;
  onRemovePlayerName?: (playerName: string) => void;
}

export const AdminApprovalModal: React.FC<AdminApprovalModalProps> = ({
  isOpen,
  onClose,
  currentUserProfile,
  onProfileUpdated,
  themeMode,
  allRoundsCount = 0,

  rounds = [],
  onContinueRound,
  onViewRound,
  onDeleteRound,
  onDuplicateRound,
  onNewRoundClick,

  settings,
  onSaveSettings,
  onExportCSV,
  onImportCSV,
  onClearAllData,
  onDeleteUserAndData,
  onRemovePlayerName,
}) => {
  const [activeTab, setActiveTab] = useState<'scorecards' | 'settings' | 'help' | 'pending' | 'users' | 'tournaments' | 'login' | 'request'>('login');
  const [adminEmail, setAdminEmail] = useState('admin@golfscorecards.com');
  const [adminPass, setAdminPass] = useState('');
  const [requestName, setRequestName] = useState('');
  const [pendingList, setPendingList] = useState<PendingUser[]>([]);
  const [allUsersList, setAllUsersList] = useState<UserProfile[]>([]);
  const [tournamentsList, setTournamentsList] = useState<Tournament[]>([]);
  const [newTournamentName, setNewTournamentName] = useState('');
  const [newCourseName, setNewCourseName] = useState('');
  const [newTournamentDate, setNewTournamentDate] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [requestSuccess, setRequestSuccess] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [tournamentError, setTournamentError] = useState<string | null>(null);

  const dropdownPlayerNames = React.useMemo(() => {
    const list: string[] = [];
    const removed = getRemovedPlayerNames().map((r) => r.toLowerCase());

    const addIfValid = (name?: string | null) => {
      if (!name) return;
      const clean = name.trim();
      const lower = clean.toLowerCase();
      if (
        clean &&
        !SAMPLE_PLAYER_NAMES.includes(lower) &&
        !removed.includes(lower) &&
        !list.some((item) => item.toLowerCase() === lower)
      ) {
        list.push(clean);
      }
    };

    allUsersList.forEach((u) => addIfValid(u.displayName));
    rounds.forEach((r) => addIfValid(r.player_name));
    getRecentPlayers().forEach((p) => addIfValid(p));

    return list;
  }, [allUsersList, rounds]);

  const handleAdminRemovePlayerName = (nameToRemove: string) => {
    if (
      window.confirm(
        `Admin Action: Are you sure you want to remove "${nameToRemove}" from the Player Name dropdown list?`
      )
    ) {
      addRemovedPlayerName(nameToRemove);
      if (onRemovePlayerName) {
        onRemovePlayerName(nameToRemove);
      }
    }
  };

  const isDark = themeMode === 'dark';
  const isSunlight = themeMode === 'sunlight';
  const isAdmin = currentUserProfile?.role === 'admin';

  useEffect(() => {
    if (!isAdmin && (activeTab === 'pending' || activeTab === 'users' || activeTab === 'tournaments')) {
      setActiveTab('login');
    }
  }, [isAdmin, activeTab]);

  useEffect(() => {
    if (isAdmin) {
      // Listen to pending users
      const unsubPending = listenToPendingUsers((list) => {
        setPendingList(list);
      });
      // Listen to all users
      const unsubUsers = listenToAllUsers((list) => {
        setAllUsersList(list);
      });
      // Listen to tournaments
      const unsubTournaments = listenToTournaments((list) => {
        setTournamentsList(list);
      });
      return () => {
        unsubPending();
        unsubUsers();
        unsubTournaments();
      };
    }
  }, [isAdmin]);

  if (!isOpen) return null;

  const handleGoogleAdminLogin = async () => {
    setLoginError(null);
    setLoading(true);
    try {
      const profile = await loginAdminWithGoogle();
      onProfileUpdated(profile);
      setActiveTab('pending');
    } catch (err: any) {
      console.error('Admin Google login failed:', err);
      setLoginError(err.message || 'Failed to sign in with Google.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoading(true);
    try {
      const profile = await loginAdmin(adminEmail, adminPass);
      onProfileUpdated(profile);
      setActiveTab('pending');
    } catch (err: any) {
      console.error('Admin login failed:', err);
      setLoginError(err.message || 'Failed to login as admin. Check email and password.');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestName.trim()) return;
    setLoading(true);
    try {
      const profile = await requestUserAccess(requestName.trim());
      onProfileUpdated(profile);
      setRequestSuccess(true);
    } catch (err: any) {
      console.error('Request access error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (uid: string) => {
    try {
      await approvePendingUser(uid);
    } catch (err) {
      console.error('Error approving user:', err);
    }
  };

  const handleReject = async (uid: string) => {
    try {
      await rejectPendingUser(uid);
    } catch (err) {
      console.error('Error rejecting user:', err);
    }
  };

  const handleDeleteUser = async (userToDelete: UserProfile) => {
    if (
      window.confirm(
        `Are you sure you want to delete user "${userToDelete.displayName}" and ALL associated scorecards, PIN code, and permissions?\n\nThis action cannot be undone.`
      )
    ) {
      try {
        setLoading(true);
        await deleteUserAndData(userToDelete);
        if (onDeleteUserAndData) {
          onDeleteUserAndData(userToDelete);
        }
      } catch (err) {
        console.error('Error deleting user:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleAddTournament = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTournamentName.trim()) return;
    setLoading(true);
    setTournamentError(null);
    try {
      const tourn: Tournament = {
        id: 'tourn-' + Date.now(),
        name: newTournamentName.trim(),
        course_name: newCourseName.trim() || '',
        date: newTournamentDate || new Date().toISOString().split('T')[0],
        created_at: Date.now(),
        userId: auth.currentUser?.uid || 'admin',
      };
      await saveTournamentToFirestore(tourn);
      setNewTournamentName('');
      setNewCourseName('');
      setNewTournamentDate('');
    } catch (err: any) {
      console.error('Error adding tournament:', err);
      setTournamentError(err?.message || 'Failed to save tournament to database.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTournament = async (id: string) => {
    try {
      await deleteTournamentFromFirestore(id);
    } catch (err) {
      console.error('Error deleting tournament:', err);
    }
  };

  const handleLogout = async () => {
    await logoutUser();
    onProfileUpdated(null);
    setActiveTab('request');
  };

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div
        className={`my-auto w-full max-w-2xl max-h-[88vh] overflow-y-auto rounded-3xl p-6 shadow-2xl transition-all border ${
          isSunlight
            ? 'bg-yellow-50 border-black text-black'
            : isDark
            ? 'bg-slate-900 border-slate-800 text-slate-100'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-4 mb-5 border-slate-500/20">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-600">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight">
                {isAdmin ? 'Admin Portal' : 'User & Admin Portal'}
              </h2>
              <p className="text-xs opacity-75">
                Scorecards, App Settings, Authentication & Administration
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-500/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Navigation Tabs */}
        <div className="flex gap-1.5 p-1 rounded-2xl bg-slate-500/10 mb-5 text-xs font-bold overflow-x-auto">
          <button
            onClick={() => setActiveTab('scorecards')}
            className={`py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeTab === 'scorecards'
                ? isSunlight
                  ? 'bg-black text-white'
                  : 'bg-emerald-600 text-white shadow-md'
                : 'opacity-70 hover:opacity-100'
            }`}
          >
            <ClipboardList className="w-3.5 h-3.5" />
            <span>Scorecards</span>
            {rounds.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-500/20 text-emerald-600 font-black">
                {rounds.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('login')}
            className={`py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeTab === 'login'
                ? isSunlight
                  ? 'bg-black text-white'
                  : 'bg-emerald-600 text-white shadow-md'
                : 'opacity-70 hover:opacity-100'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Sign In / Auth</span>
          </button>

          <button
            onClick={() => setActiveTab('request')}
            className={`py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeTab === 'request'
                ? isSunlight
                  ? 'bg-black text-white'
                  : 'bg-emerald-600 text-white shadow-md'
                : 'opacity-70 hover:opacity-100'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Request Access</span>
          </button>

          <button
            onClick={() => setActiveTab('help')}
            className={`py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeTab === 'help'
                ? isSunlight
                  ? 'bg-black text-white'
                  : 'bg-emerald-600 text-white shadow-md'
                : 'opacity-70 hover:opacity-100'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>User Help</span>
          </button>

          {isAdmin && (
            <>
              <button
                onClick={() => setActiveTab('settings')}
                className={`py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'settings'
                    ? isSunlight
                      ? 'bg-black text-white'
                      : 'bg-emerald-600 text-white shadow-md'
                    : 'opacity-70 hover:opacity-100'
                }`}
              >
                <SettingsIcon className="w-3.5 h-3.5" />
                <span>Settings</span>
              </button>
              <button
                onClick={() => setActiveTab('pending')}
                className={`py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'pending'
                    ? isSunlight
                      ? 'bg-black text-white'
                      : 'bg-emerald-600 text-white shadow-md'
                    : 'opacity-70 hover:opacity-100'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Pending</span>
                {pendingList.filter((p) => !p.approved).length > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-black font-black">
                    {pendingList.filter((p) => !p.approved).length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('users')}
                className={`py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'users'
                    ? isSunlight
                      ? 'bg-black text-white'
                      : 'bg-emerald-600 text-white shadow-md'
                    : 'opacity-70 hover:opacity-100'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>All Users</span>
              </button>

              <button
                onClick={() => setActiveTab('tournaments')}
                className={`py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'tournaments'
                    ? isSunlight
                      ? 'bg-black text-white'
                      : 'bg-emerald-600 text-white shadow-md'
                    : 'opacity-70 hover:opacity-100'
                }`}
              >
                <Trophy className="w-3.5 h-3.5" />
                <span>Tournaments</span>
                {tournamentsList.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-500/20 text-emerald-600 font-black">
                    {tournamentsList.length}
                  </span>
                )}
              </button>
            </>
          )}
        </div>

        {/* TAB 0A: Scorecards */}
        {activeTab === 'scorecards' && (
          <div className="space-y-4">
            <ScorecardsView
              rounds={rounds}
              onContinueRound={(id) => {
                onClose();
                if (onContinueRound) onContinueRound(id);
              }}
              onViewRound={(id) => {
                onClose();
                if (onViewRound) onViewRound(id);
              }}
              onDeleteRound={onDeleteRound || (() => {})}
              onDuplicateRound={onDuplicateRound || (() => {})}
              onNewRoundClick={() => {
                onClose();
                if (onNewRoundClick) onNewRoundClick();
              }}
              themeMode={themeMode}
            />
          </div>
        )}

        {/* TAB 0B: Settings (Admin Only) */}
        {activeTab === 'settings' && isAdmin && settings && (
          <div className="space-y-4">
            <SettingsView
              settings={settings}
              onSaveSettings={onSaveSettings || (() => {})}
              onExportCSV={onExportCSV || (() => {})}
              onImportCSV={onImportCSV || (() => {})}
              onClearAllData={onClearAllData || (() => {})}
              themeMode={themeMode}
            />
          </div>
        )}
        {activeTab === 'settings' && !isAdmin && (
          <div className="p-6 text-center space-y-3">
            <Lock className="w-10 h-10 text-amber-500 mx-auto" />
            <h3 className="text-base font-bold">Admin Portal Access Required</h3>
            <p className="text-xs opacity-75 max-w-sm mx-auto">
              Application Settings can only be accessed from within the Admin Portal by verified administrators.
            </p>
            <button
              onClick={() => setActiveTab('login')}
              className="mt-2 px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl cursor-pointer"
            >
              Sign In as Admin
            </button>
          </div>
        )}

        {/* TAB 0C: Help */}
        {activeTab === 'help' && (
          <div className="space-y-4">
            <UserHelpView
              themeMode={themeMode}
              onOpenAuthPortal={() => setActiveTab('request')}
            />
          </div>
        )}

        {/* TAB 1: Sign In / Auth */}
        {activeTab === 'login' && (
          <div className="space-y-4">
            {currentUserProfile ? (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-sm text-emerald-600 flex items-center gap-2">
                    <UserCheck className="w-5 h-5" />
                    <span>Currently Authenticated</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-600 text-white">
                    {currentUserProfile.role}
                  </span>
                </div>
                <div className="text-xs space-y-1">
                  <div>Name: <b>{currentUserProfile.displayName}</b></div>
                  <div>Email: <b>{currentUserProfile.email || 'N/A'}</b></div>
                  <div>Status: <b className="text-emerald-600">{currentUserProfile.approved ? 'Approved Access' : 'Pending Review'}</b></div>
                </div>
              </div>
            ) : (
              <p className="text-xs opacity-80 leading-relaxed">
                Sign in with your Google Account or Email as Administrator or registered user to access real-time scorecards and cloud features.
              </p>
            )}

            {loginError && (
              <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-bold">
                {loginError}
              </div>
            )}

            {/* Primary Google Sign In Button */}
            <button
              type="button"
              onClick={handleGoogleAdminLogin}
              disabled={loading}
              className={`w-full py-3.5 px-4 rounded-2xl font-black text-sm flex items-center justify-center gap-3 transition shadow-lg active:scale-95 border ${
                isSunlight
                  ? 'bg-black text-white hover:bg-slate-800 border-black'
                  : isDark
                  ? 'bg-white text-slate-900 hover:bg-slate-100 border-white'
                  : 'bg-slate-900 text-white hover:bg-slate-800 border-slate-900'
              }`}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.29v3.14C3.26 21.3 7.31 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.59H1.29C.47 8.22 0 10.06 0 12s.47 3.78 1.29 5.41l3.99-3.14z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.59l3.99 3.14c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>
                {loading
                  ? 'Signing in with Google...'
                  : currentUserProfile
                  ? 'Switch Account / Sign in with Google'
                  : 'Sign in with Google'}
              </span>
            </button>

            {/* Collapsible Email/Password option fallback */}
            <details className="mt-4 pt-2 border-t border-slate-500/20 text-xs">
              <summary className="cursor-pointer font-bold opacity-75 hover:opacity-100 select-none py-1">
                Sign in with Email / Password
              </summary>
              <form onSubmit={handleAdminLogin} className="space-y-3 mt-3">
                <input
                  type="email"
                  required
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="admin@golfscorecards.com"
                  className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold transition focus:outline-none ${
                    isSunlight
                      ? 'bg-yellow-100 border-2 border-black text-black'
                      : isDark
                      ? 'bg-slate-800 border border-slate-700 text-white focus:border-emerald-500'
                      : 'bg-slate-50 border border-slate-300 text-slate-900 focus:border-emerald-600'
                  }`}
                />
                <input
                  type="password"
                  required
                  value={adminPass}
                  onChange={(e) => setAdminPass(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold transition focus:outline-none ${
                    isSunlight
                      ? 'bg-yellow-100 border-2 border-black text-black'
                      : isDark
                      ? 'bg-slate-800 border border-slate-700 text-white focus:border-emerald-500'
                      : 'bg-slate-50 border border-slate-300 text-slate-900 focus:border-emerald-600'
                  }`}
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-700 text-white font-bold text-xs hover:bg-slate-800 transition"
                >
                  Login with Email
                </button>
              </form>
            </details>
          </div>
        )}

        {/* TAB 2: Request Access Form */}
        {activeTab === 'request' && (
          <div>
            {currentUserProfile?.approved ? (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 space-y-2 text-center">
                <Check className="w-8 h-8 mx-auto" />
                <div className="font-black text-base">Your Access Request is Approved!</div>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Welcome, <b>{currentUserProfile.displayName}</b>. You have full scorecards database access.
                </p>
              </div>
            ) : currentUserProfile && !currentUserProfile.approved ? (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-600 space-y-2 text-center">
                <Clock className="w-8 h-8 mx-auto animate-pulse" />
                <div className="font-black text-base">Access Request Pending Approval</div>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Your request for <b>{currentUserProfile.displayName}</b> has been saved to the Firestore
                  pending collection. An admin will review and approve your account.
                </p>
              </div>
            ) : (
              <form onSubmit={handleRequestAccess} className="space-y-4">
                <p className="text-xs opacity-80 leading-relaxed">
                  Public sign-up is disabled. Regular users must request approval. Enter your name below to register in the admin pending approval collection.
                </p>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                    Player Name
                  </label>
                  <input
                    type="text"
                    required
                    value={requestName}
                    onChange={(e) => setRequestName(e.target.value)}
                    placeholder="Enter player name"
                    className={`w-full px-4 py-3 rounded-2xl text-sm font-bold transition focus:outline-none ${
                      isSunlight
                        ? 'bg-yellow-100 border-2 border-black text-black'
                        : isDark
                        ? 'bg-slate-800 border border-slate-700 text-white focus:border-emerald-500'
                        : 'bg-slate-50 border border-slate-300 text-slate-900 focus:border-emerald-600'
                    }`}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 text-white font-black text-sm hover:bg-emerald-700 transition shadow-lg active:scale-95 disabled:opacity-50"
                >
                  {loading ? 'Submitting Request...' : 'Submit Request to Admin'}
                </button>
              </form>
            )}
          </div>
        )}

        {/* ADMIN VIEW 1: Pending Approval List */}
        {isAdmin && activeTab === 'pending' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500">
              <span>Pending Requests ({pendingList.filter((p) => !p.approved).length})</span>
              <span className="flex items-center gap-1 text-emerald-600">
                <Database className="w-3.5 h-3.5" />
                <span>{allRoundsCount} Scorecards in DB</span>
              </span>
            </div>

            {pendingList.filter((p) => !p.approved).length === 0 ? (
              <div className="text-center py-8 opacity-60 text-sm">
                <UserCheck className="w-10 h-10 mx-auto mb-2 opacity-40 text-emerald-500" />
                No pending user access requests at this time.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1">
                {pendingList
                  .filter((p) => !p.approved)
                  .map((p) => (
                    <div
                      key={p.uid}
                      className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
                        isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-sm flex items-center gap-1.5">
                          <User className="w-4 h-4 text-emerald-600" />
                          <span>{p.displayName}</span>
                        </div>
                        <div className="text-[11px] opacity-60 mt-0.5 font-mono">
                          Requested: {new Date(p.requestedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleApprove(p.uid)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition flex items-center gap-1 active:scale-95"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => handleReject(p.uid)}
                          className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-500/10 transition"
                          title="Reject request"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* ADMIN VIEW 2: All Approved Users */}
        {isAdmin && activeTab === 'users' && (
          <div className="space-y-3">
            <div className="text-xs font-bold text-slate-500">
              Registered Users & Roles ({allUsersList.length})
            </div>

            <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
              {allUsersList.map((u) => (
                <div
                  key={u.uid}
                  className={`p-3 rounded-2xl border flex items-center justify-between text-xs ${
                    isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 font-bold">
                      {u.displayName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold flex items-center gap-1.5">
                        <span>{u.displayName}</span>
                        {u.role === 'admin' && (
                          <span className="px-2 py-0.2 rounded-full text-[10px] bg-purple-500/20 text-purple-600 font-black uppercase">
                            Admin
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] opacity-60 font-mono">{u.email || u.uid.substring(0, 10)}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                        u.approved
                          ? 'bg-emerald-500/20 text-emerald-600'
                          : 'bg-amber-500/20 text-amber-600'
                      }`}
                    >
                      {u.approved ? 'Approved' : 'Pending'}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleDeleteUser(u)}
                      disabled={loading}
                      className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-500/10 hover:text-rose-600 transition active:scale-95 disabled:opacity-50"
                      title={`Delete user ${u.displayName} and all associated scorecards`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Player Name Dropdown List Management */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2.5">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                <span>Player Dropdown Names ({dropdownPlayerNames.length})</span>
                <span className="text-[10px] text-slate-400 font-normal">Remove individual names</span>
              </div>

              {dropdownPlayerNames.length === 0 ? (
                <div className="text-xs opacity-60 p-2 italic">No custom player names found in dropdown list.</div>
              ) : (
                <div className="space-y-1.5 max-h-[180px] overflow-y-auto pr-1">
                  {dropdownPlayerNames.map((name) => (
                    <div
                      key={name}
                      className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                        isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="font-bold flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAdminRemovePlayerName(name)}
                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 hover:text-rose-600 transition active:scale-95 flex items-center gap-1 text-[11px] font-semibold cursor-pointer"
                        title={`Remove ${name} from player dropdown list`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ADMIN VIEW 3: Manage Tournaments */}
        {isAdmin && activeTab === 'tournaments' && (
          <div className="space-y-4">
            {/* Add Tournament Form */}
            <form onSubmit={handleAddTournament} className="p-3.5 rounded-2xl border bg-emerald-500/5 border-emerald-500/20 space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-600 flex items-center gap-1.5">
                <Plus className="w-4 h-4" />
                <span>Enter New Tournament</span>
              </div>

              {tournamentError && (
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 text-xs font-medium">
                  {tournamentError}
                </div>
              )}

              <div className="space-y-2">
                <input
                  type="text"
                  required
                  value={newTournamentName}
                  onChange={(e) => setNewTournamentName(e.target.value)}
                  placeholder="Tournament Name (e.g. 2026 Club Championship)"
                  className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold transition focus:outline-none ${
                    isSunlight
                      ? 'bg-yellow-100 border-2 border-black text-black'
                      : isDark
                      ? 'bg-slate-800 border border-slate-700 text-white focus:border-emerald-500'
                      : 'bg-white border border-slate-300 text-slate-900 focus:border-emerald-600'
                  }`}
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={newCourseName}
                    onChange={(e) => setNewCourseName(e.target.value)}
                    placeholder="Golf Course (Optional)"
                    className={`w-full px-3.5 py-2 rounded-xl text-xs font-medium transition focus:outline-none ${
                      isSunlight
                        ? 'bg-yellow-100 border border-black text-black'
                        : isDark
                        ? 'bg-slate-800 border border-slate-700 text-white'
                        : 'bg-white border border-slate-300 text-slate-900'
                    }`}
                  />
                  <input
                    type="date"
                    value={newTournamentDate}
                    onChange={(e) => setNewTournamentDate(e.target.value)}
                    className={`w-full px-3.5 py-2 rounded-xl text-xs font-medium transition focus:outline-none ${
                      isSunlight
                        ? 'bg-yellow-100 border border-black text-black'
                        : isDark
                        ? 'bg-slate-800 border border-slate-700 text-white'
                        : 'bg-white border border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !newTournamentName.trim()}
                className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50"
              >
                <Trophy className="w-4 h-4" />
                <span>Save Tournament to Database</span>
              </button>
            </form>

            {/* List of Tournaments */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-500 flex items-center justify-between">
                <span>Database Tournaments ({tournamentsList.length})</span>
              </div>

              {tournamentsList.length === 0 ? (
                <div className="text-center py-6 opacity-60 text-xs">
                  No tournaments stored in database yet. Add one above!
                </div>
              ) : (
                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                  {tournamentsList.map((t) => (
                    <div
                      key={t.id}
                      className={`p-3 rounded-xl border flex items-center justify-between gap-2 ${
                        isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600">
                          <Trophy className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-xs">{t.name}</div>
                          <div className="text-[10px] opacity-60">
                            {t.course_name ? `${t.course_name} • ` : ''}{t.date || 'No date set'}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteTournament(t.id)}
                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 transition"
                        title="Delete Tournament"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}



        {/* Footer Actions */}
        <div className="mt-6 pt-4 border-t border-slate-500/20 flex items-center justify-between text-xs">
          {currentUserProfile ? (
            <div className="flex items-center gap-2">
              <span className="font-bold">{currentUserProfile.displayName}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                  currentUserProfile.role === 'admin'
                    ? 'bg-purple-500/20 text-purple-600'
                    : currentUserProfile.approved
                    ? 'bg-emerald-500/20 text-emerald-600'
                    : 'bg-amber-500/20 text-amber-600'
                }`}
              >
                {currentUserProfile.role === 'admin'
                  ? 'Admin'
                  : currentUserProfile.approved
                  ? 'Approved User'
                  : 'Pending'}
              </span>
            </div>
          ) : (
            <span className="opacity-60">Not authenticated</span>
          )}

          {currentUserProfile && (
            <button
              onClick={handleLogout}
              className="text-rose-500 hover:underline font-bold flex items-center gap-1"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );

  if (typeof document !== 'undefined') {
    return createPortal(modalContent, document.body);
  }

  return modalContent;
};
