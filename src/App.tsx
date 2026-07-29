import React, { useState, useEffect } from 'react';
import {
  Round,
  AppSettings,
  HolesCount,
  RoundsCount,
  ThemeMode,
  ActiveTab,
  ScreenState,
  Tournament,
} from './types';
import {
  getStoredRounds,
  saveRound,
  saveAllRounds,
  deleteRound,
  duplicateRound,
  getStoredSettings,
  saveSettings,
  exportRoundsToCSV,
  importRoundsFromCSV,
  clearAllData,
  calculateRoundTotals,
  removeRecentPlayer,
  addRemovedPlayerName,
  isAdminPlayerName,
} from './services/storage';

import {
  auth,
  fetchUserProfile,
  ensureAnonymousAuth,
  listenToRounds,
  saveRoundToFirestore,
  deleteRoundFromFirestore,
  listenToTournaments,
  listenToAllUsers,
  deletePlayerPin,
  logoutUser,
  UserProfile,
} from './lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { Shield } from 'lucide-react';

import { MobileContainer } from './components/MobileContainer';
import { BottomNav } from './components/BottomNav';
import { ScorecardsView } from './components/ScorecardsView';
import { NewRoundView } from './components/NewRoundView';
import { ScoreEntryView } from './components/ScoreEntryView';
import { RoundSummaryView } from './components/RoundSummaryView';
import { ViewRoundView } from './components/ViewRoundView';
import { SettingsView } from './components/SettingsView';
import { UserHelpView } from './components/UserHelpView';
import { AdminApprovalModal } from './components/AdminApprovalModal';
import { PinCodeModal } from './components/PinCodeModal';

export default function App() {
  const [settings, setSettings] = useState<AppSettings>(() => getStoredSettings());
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => settings.themeMode || 'light');
  const [rounds, setRounds] = useState<Round[]>(() => getStoredRounds());
  const [screenState, setScreenState] = useState<ScreenState>({
    type: 'tabs',
    tab: 'new_round',
  });
  const [importMessage, setImportMessage] = useState<string | null>(null);

  // Firebase auth & admin state
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState<boolean>(false);
  const [adminModalTab, setAdminModalTab] = useState<'scorecards' | 'settings' | 'help' | 'pending' | 'users' | 'tournaments' | 'login' | 'request'>('login');
  const [dbTournaments, setDbTournaments] = useState<Tournament[]>([]);
  const [dbUsers, setDbUsers] = useState<UserProfile[]>([]);

  const handleOpenRequestAccess = () => {
    setAdminModalTab('request');
    setIsAdminModalOpen(true);
  };

  // PIN Verification State (Session-only: requires PIN re-entry on app restart)
  const [verifiedPlayerName, setVerifiedPlayerName] = useState<string | null>(() => {
    localStorage.removeItem('golf_verified_player');
    return sessionStorage.getItem('golf_verified_player') || null;
  });
  const [pinModalOpen, setPinModalOpen] = useState<boolean>(false);
  const [pinModalPlayerName, setPinModalPlayerName] = useState<string>('');

  const handleOpenPinModal = (playerName: string) => {
    setPinModalPlayerName(playerName);
    setPinModalOpen(true);
  };

  const handlePinVerified = (playerName: string) => {
    setVerifiedPlayerName(playerName);
    sessionStorage.setItem('golf_verified_player', playerName);
    localStorage.removeItem('golf_verified_player');
  };

  const handleSignOut = async () => {
    try {
      await logoutUser();
    } catch (err) {
      console.error('Error signing out:', err);
    }
    setUserProfile(null);
    setVerifiedPlayerName(null);
    sessionStorage.removeItem('golf_verified_player');
    localStorage.removeItem('golf_verified_player');
    setImportMessage('Signed out of account successfully.');
    setTimeout(() => setImportMessage(null), 3000);
  };

  // Preserve session storage; do not sign out auth on window unload/hide
  useEffect(() => {
    // Only cleanup session storage if needed, preserve Firebase Auth state
  }, []);

  // Synchronize settings with storage
  useEffect(() => {
    setSettings(getStoredSettings());
    setRounds(getStoredRounds());
  }, []);

  // Listen to tournaments from Firestore
  useEffect(() => {
    const unsub = listenToTournaments((list) => {
      setDbTournaments(list);
    });
    return () => unsub();
  }, []);

  // Listen to registered users from Firestore
  useEffect(() => {
    const unsubUsers = listenToAllUsers((list) => {
      setDbUsers(list);
    });
    return () => unsubUsers();
  }, []);

  // Firebase Auth State Listener
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const profile = await fetchUserProfile(user.uid);
        setUserProfile(profile);
      } else {
        setUserProfile(null);
        ensureAnonymousAuth().catch(console.error);
      }
    });
    return () => unsubAuth();
  }, []);

  // Sync userProfile automatically whenever dbUsers list is updated from Firestore
  useEffect(() => {
    if (auth.currentUser?.uid && dbUsers.length > 0) {
      const match = dbUsers.find((u) => u.uid === auth.currentUser?.uid);
      if (match) {
        setUserProfile(match);
      }
    }
  }, [dbUsers]);

  // Automatically sync verifiedPlayerName for approved authenticated users
  useEffect(() => {
    if (
      userProfile &&
      (userProfile.approved || userProfile.role === 'admin') &&
      userProfile.displayName &&
      !isAdminPlayerName(userProfile.displayName)
    ) {
      setVerifiedPlayerName((prev) => {
        if (!prev) {
          sessionStorage.setItem('golf_verified_player', userProfile.displayName!);
          return userProfile.displayName!;
        }
        return prev;
      });
    }
  }, [userProfile]);

  // Global comprehensive approval check
  const isApprovedUser = React.useMemo(() => {
    if (userProfile?.role === 'admin' || userProfile?.approved) return true;
    if (verifiedPlayerName) return true;
    if (auth.currentUser?.uid && dbUsers.some((u) => u.uid === auth.currentUser?.uid && u.approved)) return true;
    if (verifiedPlayerName && dbUsers.some((u) => u.displayName?.trim().toLowerCase() === verifiedPlayerName.trim().toLowerCase() && u.approved)) return true;
    return false;
  }, [userProfile, verifiedPlayerName, dbUsers]);

  // Listen to Firestore real-time scorecards database
  useEffect(() => {
    const currentUid = auth.currentUser?.uid || '';

    const unsubRounds = listenToRounds(currentUid, isApprovedUser, (firestoreRounds) => {
      const cleanRounds = (firestoreRounds || []).filter((r) => !r.id.startsWith('sample-round-'));
      setRounds(cleanRounds);
    });

    return () => unsubRounds();
  }, [userProfile, isApprovedUser]);

  const handleThemeChange = (mode: ThemeMode) => {
    setThemeMode(mode);
    const updated = { ...settings, themeMode: mode };
    setSettings(updated);
    saveSettings(updated);
  };

  const reloadRounds = () => {
    setRounds(getStoredRounds());
  };

  // Check if any unfinished round exists
  const unfinishedRound = rounds.find((r) => !r.completed);

  // Handlers
  const handleStartNewRound = (playerName: string, tournamentName: string, numRounds: RoundsCount) => {
    const roundsCount: RoundsCount = Number(numRounds) === 4 ? 4 : 2;
    const now = new Date();
    const tournamentId = 'tourn-' + Date.now();
    const createdRounds: Round[] = [];

    for (let rNum = 1; rNum <= roundsCount; rNum++) {
      const rId = `round-${Date.now()}-${rNum}`;
      const initialScores: Record<number, number | null> = {};
      const initialPars: Record<number, number> = {};

      for (let h = 1; h <= 18; h++) {
        initialScores[h] = null;
        initialPars[h] = 4;
      }

      const newRound: Round = {
        id: rId,
        player_name: playerName,
        course_name: tournamentName,
        date: now.toISOString().split('T')[0],
        holes: 18,
        num_rounds: roundsCount,
        round_number: rNum,
        tournament_id: tournamentId,
        completed: false,
        total_score: 0,
        front_9_score: 0,
        back_9_score: 0,
        scores: initialScores,
        pars: initialPars,
        created_at: now.getTime() + rNum,
        updated_at: now.getTime() + rNum,
        userId: auth.currentUser?.uid || 'guest',
      };

      saveRound(newRound);
      saveRoundToFirestore(newRound);
      createdRounds.push(newRound);
    }

    reloadRounds();

    setScreenState({
      type: 'score_entry',
      roundId: createdRounds[0].id,
      holeNumber: 1,
    });
  };

  const handleUpdateScore = (roundId: string, holeNumber: number, newScore: number | null, par = 4) => {
    const existing = rounds.find((r) => r.id === roundId);
    if (!existing) return;

    const updatedScores = { ...existing.scores, [holeNumber]: newScore };
    const updatedPars = { ...(existing.pars || {}), [holeNumber]: par };

    const totals = calculateRoundTotals(updatedScores, existing.holes);

    const updatedRound: Round = {
      ...existing,
      scores: updatedScores,
      pars: updatedPars,
      total_score: totals.total,
      front_9_score: totals.front9,
      back_9_score: totals.back9,
      completed: totals.playedHolesCount === existing.holes,
      updated_at: Date.now(),
    };

    saveRound(updatedRound);
    saveRoundToFirestore(updatedRound);
    reloadRounds();
  };

  const handleContinueRound = (roundId: string) => {
    const round = rounds.find((r) => r.id === roundId);
    if (!round) return;

    // Find first unplayed hole or default to hole 1
    let firstUnplayed = 1;
    for (let h = 1; h <= round.holes; h++) {
      if (round.scores[h] === null || round.scores[h] === undefined) {
        firstUnplayed = h;
        break;
      }
    }

    setScreenState({
      type: 'score_entry',
      roundId: roundId,
      holeNumber: firstUnplayed,
    });
  };

  const handleFinishRoundClick = (roundId: string) => {
    const round = rounds.find((r) => r.id === roundId);
    if (!round) return;

    const updatedRound: Round = {
      ...round,
      completed: true,
      updated_at: Date.now(),
    };

    saveRound(updatedRound);
    saveRoundToFirestore(updatedRound);
    reloadRounds();

    setScreenState({
      type: 'round_summary',
      roundId,
    });
  };

  const handleDeleteRound = (roundId: string) => {
    deleteRound(roundId);
    deleteRoundFromFirestore(roundId);
    reloadRounds();

    if (
      screenState.type === 'score_entry' ||
      screenState.type === 'round_summary' ||
      screenState.type === 'view_round'
    ) {
      setScreenState({ type: 'tabs', tab: 'scorecards' });
    }
  };

  const handleDeleteUserAndData = (deletedUser: UserProfile) => {
    const nameToMatch = (deletedUser.displayName || '').trim().toLowerCase();
    const uidToMatch = deletedUser.uid;

    const updatedRounds = rounds.filter((r) => {
      const matchUid = r.userId && r.userId === uidToMatch;
      const matchName = nameToMatch && (r.player_name || '').trim().toLowerCase() === nameToMatch;
      return !matchUid && !matchName;
    });

    setRounds(updatedRounds);
    saveAllRounds(updatedRounds);

    if (deletedUser.displayName) {
      removeRecentPlayer(deletedUser.displayName);
    }

    if (verifiedPlayerName && verifiedPlayerName.trim().toLowerCase() === nameToMatch) {
      setVerifiedPlayerName(null);
      sessionStorage.removeItem('golf_verified_player');
      localStorage.removeItem('golf_verified_player');
    }
  };

  const handleRemovePlayerName = async (playerName: string) => {
    if (!playerName || !playerName.trim()) return;
    const cleanName = playerName.trim();
    const lowerName = cleanName.toLowerCase();

    // 1. Add to local removed list & clean recent player storage
    addRemovedPlayerName(cleanName);

    // 2. Delete player PIN from Firestore & LocalStorage
    await deletePlayerPin(cleanName);

    // 3. Reset verified player name if matching
    if (verifiedPlayerName && verifiedPlayerName.trim().toLowerCase() === lowerName) {
      setVerifiedPlayerName(null);
      sessionStorage.removeItem('golf_verified_player');
      localStorage.removeItem('golf_verified_player');
    }

    // 4. Force state update
    setRounds((prev) => [...prev]);
  };

  const handleDuplicateRound = (roundId: string) => {
    const duplicated = duplicateRound(roundId);
    if (duplicated) {
      reloadRounds();
      setScreenState({
        type: 'score_entry',
        roundId: duplicated.id,
        holeNumber: 1,
      });
    }
  };

  const handleSaveSettings = (newSettings: AppSettings) => {
    saveSettings(newSettings);
    setSettings(newSettings);
    if (newSettings.themeMode !== themeMode) {
      setThemeMode(newSettings.themeMode);
    }
  };

  const handleExportCSV = () => {
    const csvContent = exportRoundsToCSV();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `golf_scorecards_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportCSV = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) {
        const res = importRoundsFromCSV(text);
        if (res.success) {
          reloadRounds();
          setImportMessage(`Successfully imported ${res.count} round(s)!`);
        } else {
          setImportMessage(`Import failed: ${res.error || 'Unknown error'}`);
        }
        setTimeout(() => setImportMessage(null), 3000);
      }
    };
    reader.readAsText(file);
  };

  const handleClearAllData = () => {
    clearAllData();
    reloadRounds();
    setScreenState({ type: 'tabs', tab: 'scorecards' });
  };

  // Determine active round title for top mobile container header
  let activeRoundTitle = undefined;
  if (screenState.type === 'score_entry' || screenState.type === 'round_summary' || screenState.type === 'view_round') {
    const r = rounds.find((item) => item.id === screenState.roundId);
    if (r) activeRoundTitle = r.course_name;
  }

  // Render Content based on screen state
  const renderScreenContent = () => {
    if (screenState.type === 'score_entry') {
      const activeRound = rounds.find((r) => r.id === screenState.roundId);
      if (!activeRound) {
        setScreenState({ type: 'tabs', tab: 'scorecards' });
        return null;
      }

      const siblingRounds = rounds
        .filter((r) =>
          r.tournament_id && activeRound.tournament_id
            ? r.tournament_id === activeRound.tournament_id
            : r.course_name === activeRound.course_name && r.player_name === activeRound.player_name && r.date === activeRound.date
        )
        .sort((a, b) => (a.round_number || 1) - (b.round_number || 1));

      return (
        <ScoreEntryView
          round={activeRound}
          siblingRounds={siblingRounds}
          onSelectRound={(targetRoundId) =>
            setScreenState({ type: 'score_entry', roundId: targetRoundId, holeNumber: 1 })
          }
          initialHoleNumber={screenState.holeNumber}
          onUpdateScore={(holeNumber, score, par) =>
            handleUpdateScore(activeRound.id, holeNumber, score, par)
          }
          onFinishRoundClick={() => handleFinishRoundClick(activeRound.id)}
          onBackToScorecards={() => setScreenState({ type: 'tabs', tab: 'scorecards' })}
          onOpenSummary={() =>
            setScreenState({ type: 'round_summary', roundId: activeRound.id })
          }
          themeMode={themeMode}
        />
      );
    }

    if (screenState.type === 'round_summary') {
      const activeRound = rounds.find((r) => r.id === screenState.roundId);
      if (!activeRound) {
        setScreenState({ type: 'tabs', tab: 'scorecards' });
        return null;
      }

      return (
        <RoundSummaryView
          round={activeRound}
          onEditHole={(holeNumber) =>
            setScreenState({
              type: 'score_entry',
              roundId: activeRound.id,
              holeNumber,
            })
          }
          onSaveRound={(r) => {
            saveRound(r);
            reloadRounds();
            setScreenState({ type: 'tabs', tab: 'scorecards' });
          }}
          onFinishRound={handleFinishRoundClick}
          onDeleteRound={handleDeleteRound}
          onBackToScorecards={() => setScreenState({ type: 'tabs', tab: 'scorecards' })}
          themeMode={themeMode}
        />
      );
    }

    if (screenState.type === 'view_round') {
      const activeRound = rounds.find((r) => r.id === screenState.roundId);
      if (!activeRound) {
        setScreenState({ type: 'tabs', tab: 'scorecards' });
        return null;
      }

      return (
        <ViewRoundView
          round={activeRound}
          onDuplicateRound={handleDuplicateRound}
          onDeleteRound={handleDeleteRound}
          onBackToScorecards={() => setScreenState({ type: 'tabs', tab: 'scorecards' })}
          themeMode={themeMode}
        />
      );
    }

    // Default Tabs (New Round, User Help, Scorecards, Settings)
    switch (screenState.tab) {
      case 'new_round':
        return (
          <NewRoundView
            defaultPlayerName={settings.defaultPlayerName}
            defaultNumRounds={settings.defaultNumRounds}
            dbTournaments={dbTournaments}
            rounds={rounds}
            onStartRound={handleStartNewRound}
            themeMode={themeMode}
            verifiedPlayerName={verifiedPlayerName}
            currentUserProfile={userProfile}
            onVerifyPinForPlayer={handleOpenPinModal}
            userRole={userProfile?.role}
            isApproved={isApprovedUser}
            registeredUsers={dbUsers}
            onRemovePlayerName={handleRemovePlayerName}
            onRequestAccess={handleOpenRequestAccess}
          />
        );
      case 'help':
        return (
          <UserHelpView
            themeMode={themeMode}
            onOpenAuthPortal={() => {
              setAdminModalTab('login');
              setIsAdminModalOpen(true);
            }}
          />
        );
      case 'settings':
        return (
          <SettingsView
            settings={settings}
            onSaveSettings={handleSaveSettings}
            onExportCSV={handleExportCSV}
            onImportCSV={handleImportCSV}
            onClearAllData={handleClearAllData}
            themeMode={themeMode}
            userProfile={userProfile}
            verifiedPlayerName={verifiedPlayerName}
            onSignOut={handleSignOut}
            onOpenAuthPortal={() => {
              setAdminModalTab('login');
              setIsAdminModalOpen(true);
            }}
          />
        );
      case 'scorecards':
      default:
        return (
          <ScorecardsView
            rounds={rounds}
            onContinueRound={handleContinueRound}
            onViewRound={(roundId) => setScreenState({ type: 'view_round', roundId })}
            onDeleteRound={handleDeleteRound}
            onDuplicateRound={handleDuplicateRound}
            onNewRoundClick={() => setScreenState({ type: 'tabs', tab: 'new_round' })}
            themeMode={themeMode}
            userRole={userProfile?.role}
            isApproved={isApprovedUser}
            verifiedPlayerName={verifiedPlayerName}
            currentUserProfile={userProfile}
            registeredUsers={dbUsers}
            onOpenPinModal={() =>
              handleOpenPinModal(
                verifiedPlayerName || userProfile?.displayName || settings.defaultPlayerName || 'Player'
              )
            }
            onRequestAccess={handleOpenRequestAccess}
          />
        );
    }
  };

  const showBottomNav = screenState.type === 'tabs';

  return (
    <MobileContainer
      themeMode={themeMode}
      onThemeChange={handleThemeChange}
      activeRoundTitle={activeRoundTitle}
      onOpenAdminModal={() => {
        setAdminModalTab(userProfile?.role === 'admin' ? 'pending' : 'login');
        setIsAdminModalOpen(true);
      }}
      userRole={userProfile?.role}
      isApproved={isApprovedUser}
      verifiedPlayerName={verifiedPlayerName}
      onSignOut={handleSignOut}
    >
      {/* Toast banner for CSV import feedback */}
      {importMessage && (
        <div className="bg-emerald-600 text-white text-xs font-bold px-4 py-2 text-center shadow">
          {importMessage}
        </div>
      )}

      {/* Screen view content */}
      <div className="flex-1 flex flex-col w-full h-full">
        {renderScreenContent()}
      </div>

      {/* Bottom Navigation Bar */}
      {showBottomNav && (
        <BottomNav
          activeTab={screenState.tab}
          onTabChange={(tab) => setScreenState({ type: 'tabs', tab })}
          themeMode={themeMode}
          hasUnfinishedRound={!!unfinishedRound}
          isSignedWithPin={isApprovedUser}
        />
      )}

      {/* PIN Code Verification Modal */}
      <PinCodeModal
        isOpen={pinModalOpen}
        playerName={pinModalPlayerName}
        onClose={() => setPinModalOpen(false)}
        onSuccess={handlePinVerified}
        themeMode={themeMode}
        isApproved={userProfile?.role === 'admin' || userProfile?.approved}
      />

      {/* Admin Review & User Auth Portal Modal */}
      <AdminApprovalModal
        isOpen={isAdminModalOpen}
        initialTab={adminModalTab}
        onClose={() => setIsAdminModalOpen(false)}
        currentUserProfile={userProfile}
        onProfileUpdated={(prof) => setUserProfile(prof)}
        themeMode={themeMode}
        allRoundsCount={rounds.length}
        rounds={rounds}
        verifiedPlayerName={verifiedPlayerName}
        registeredUsers={dbUsers}
        onContinueRound={handleContinueRound}
        onViewRound={(roundId) => setScreenState({ type: 'view_round', roundId })}
        onDeleteRound={handleDeleteRound}
        onDuplicateRound={handleDuplicateRound}
        onNewRoundClick={() => setScreenState({ type: 'tabs', tab: 'new_round' })}
        settings={settings}
        onSaveSettings={handleSaveSettings}
        onExportCSV={handleExportCSV}
        onImportCSV={handleImportCSV}
        onClearAllData={handleClearAllData}
        onDeleteUserAndData={handleDeleteUserAndData}
        onRemovePlayerName={handleRemovePlayerName}
        onSignOut={handleSignOut}
      />
    </MobileContainer>
  );
}
