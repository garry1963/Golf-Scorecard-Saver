import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import {
  auth,
  loginAdmin,
  logoutUser,
  requestUserAccess,
  listenToPendingUsers,
  listenToAllUsers,
  approvePendingUser,
  rejectPendingUser,
  UserProfile,
  PendingUser,
  fetchUserProfile,
} from '../lib/firebase';
import { ThemeMode, Round } from '../types';

interface AdminApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserProfile: UserProfile | null;
  onProfileUpdated: (profile: UserProfile | null) => void;
  themeMode: ThemeMode;
  allRoundsCount?: number;
}

export const AdminApprovalModal: React.FC<AdminApprovalModalProps> = ({
  isOpen,
  onClose,
  currentUserProfile,
  onProfileUpdated,
  themeMode,
  allRoundsCount = 0,
}) => {
  const [activeTab, setActiveTab] = useState<'pending' | 'users' | 'login' | 'request'>('request');
  const [adminEmail, setAdminEmail] = useState('admin@golfscorecards.com');
  const [adminPass, setAdminPass] = useState('');
  const [requestName, setRequestName] = useState('');
  const [pendingList, setPendingList] = useState<PendingUser[]>([]);
  const [allUsersList, setAllUsersList] = useState<UserProfile[]>([]);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [requestSuccess, setRequestSuccess] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const isDark = themeMode === 'dark';
  const isSunlight = themeMode === 'sunlight';
  const isAdmin = currentUserProfile?.role === 'admin';

  useEffect(() => {
    if (isAdmin) {
      setActiveTab('pending');
      // Listen to pending users
      const unsubPending = listenToPendingUsers((list) => {
        setPendingList(list);
      });
      // Listen to all users
      const unsubUsers = listenToAllUsers((list) => {
        setAllUsersList(list);
      });
      return () => {
        unsubPending();
        unsubUsers();
      };
    } else {
      if (!currentUserProfile) {
        setActiveTab('request');
      }
    }
  }, [isAdmin, currentUserProfile]);

  if (!isOpen) return null;

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

  const handleLogout = async () => {
    await logoutUser();
    onProfileUpdated(null);
    setActiveTab('request');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div
        className={`w-full max-w-lg rounded-3xl p-6 shadow-2xl transition-all border ${
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
                {isAdmin ? 'Admin Portal' : 'User Access & Authentication'}
              </h2>
              <p className="text-xs opacity-75">
                {isAdmin
                  ? 'Manage user access requests & database permissions'
                  : 'Firebase Authentication & Request Approval'}
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

        {/* Navigation Tabs if Admin */}
        {isAdmin && (
          <div className="flex gap-2 p-1 rounded-2xl bg-slate-500/10 mb-5 text-xs font-bold">
            <button
              onClick={() => setActiveTab('pending')}
              className={`flex-1 py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 ${
                activeTab === 'pending'
                  ? isSunlight
                    ? 'bg-black text-white'
                    : 'bg-emerald-600 text-white shadow-md'
                  : 'opacity-70 hover:opacity-100'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Pending</span>
              {pendingList.filter((p) => !p.approved).length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-black font-black">
                  {pendingList.filter((p) => !p.approved).length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('users')}
              className={`flex-1 py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 ${
                activeTab === 'users'
                  ? isSunlight
                    ? 'bg-black text-white'
                    : 'bg-emerald-600 text-white shadow-md'
                  : 'opacity-70 hover:opacity-100'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>All Users</span>
            </button>
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

                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                      u.approved
                        ? 'bg-emerald-500/20 text-emerald-600'
                        : 'bg-amber-500/20 text-amber-600'
                    }`}
                  >
                    {u.approved ? 'Approved' : 'Pending'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* NON-ADMIN VIEW: Request Access or Admin Login */}
        {!isAdmin && (
          <div className="space-y-5">
            {/* Toggle between Request Access and Admin Login */}
            <div className="flex gap-2 p-1 rounded-2xl bg-slate-500/10 text-xs font-bold">
              <button
                onClick={() => setActiveTab('request')}
                className={`flex-1 py-2.5 px-3 rounded-xl transition flex items-center justify-center gap-1.5 ${
                  activeTab === 'request'
                    ? isSunlight
                      ? 'bg-black text-white'
                      : 'bg-emerald-600 text-white shadow-md'
                    : 'opacity-70 hover:opacity-100'
                }`}
              >
                <User className="w-4 h-4" />
                <span>Request Access</span>
              </button>

              <button
                onClick={() => setActiveTab('login')}
                className={`flex-1 py-2.5 px-3 rounded-xl transition flex items-center justify-center gap-1.5 ${
                  activeTab === 'login'
                    ? isSunlight
                      ? 'bg-black text-white'
                      : 'bg-emerald-600 text-white shadow-md'
                    : 'opacity-70 hover:opacity-100'
                }`}
              >
                <Lock className="w-4 h-4" />
                <span>Admin Login</span>
              </button>
            </div>

            {/* TAB: Request Access Form */}
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
                        Your Full Name / Player Name
                      </label>
                      <input
                        type="text"
                        required
                        value={requestName}
                        onChange={(e) => setRequestName(e.target.value)}
                        placeholder="e.g. Garry Davies"
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

            {/* TAB: Single Admin Account Login */}
            {activeTab === 'login' && (
              <form onSubmit={handleAdminLogin} className="space-y-4">
                <p className="text-xs opacity-80 leading-relaxed">
                  Log in as the Administrator to review pending user access requests and manage Firestore storage permissions.
                </p>

                {loginError && (
                  <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-bold">
                    {loginError}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                    Admin Email
                  </label>
                  <input
                    type="email"
                    required
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="admin@golfscorecards.com"
                    className={`w-full px-4 py-3 rounded-2xl text-sm font-bold transition focus:outline-none ${
                      isSunlight
                        ? 'bg-yellow-100 border-2 border-black text-black'
                        : isDark
                        ? 'bg-slate-800 border border-slate-700 text-white focus:border-emerald-500'
                        : 'bg-slate-50 border border-slate-300 text-slate-900 focus:border-emerald-600'
                    }`}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                    Admin Password
                  </label>
                  <input
                    type="password"
                    required
                    value={adminPass}
                    onChange={(e) => setAdminPass(e.target.value)}
                    placeholder="••••••••"
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
                  {loading ? 'Authenticating Admin...' : 'Login as Administrator'}
                </button>
              </form>
            )}
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
};
