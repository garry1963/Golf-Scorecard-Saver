import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  setPersistence,
  browserSessionPersistence,
  signInAnonymously,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
  getDocs,
  Timestamp,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Round, Tournament } from '../types';

// Initialize Firebase App
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
// Set auth persistence to browser session so closing app signs out user
setPersistence(auth, browserSessionPersistence).catch((err) => {
  console.warn('Set auth persistence error:', err);
});
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || undefined);

export interface UserProfile {
  uid: string;
  displayName: string;
  email?: string;
  role: 'admin' | 'user';
  approved: boolean;
  createdAt: string;
}

export interface PendingUser {
  uid: string;
  displayName: string;
  approved: boolean;
  requestedAt: string;
}

// Ensure anonymous auth for regular users
export async function ensureAnonymousAuth(): Promise<FirebaseUser | { uid: string }> {
  if (auth.currentUser) {
    return auth.currentUser;
  }
  try {
    const credential = await signInAnonymously(auth);
    return credential.user;
  } catch (err: any) {
    console.warn('Anonymous Auth disabled or restricted in Firebase Console:', err.message || err);
    let localId = localStorage.getItem('golf_guest_uid');
    if (!localId) {
      localId = 'user_' + Math.random().toString(36).substring(2, 10);
      localStorage.setItem('golf_guest_uid', localId);
    }
    return { uid: localId };
  }
}

// Request Access for regular user (adds to pending_users and users)
export async function requestUserAccess(displayName: string): Promise<UserProfile> {
  const user = await ensureAnonymousAuth();
  const requestedAt = new Date().toISOString();

  const pendingDoc: PendingUser = {
    uid: user.uid,
    displayName: displayName || 'Golf Player',
    approved: false,
    requestedAt,
  };

  const userDoc: UserProfile = {
    uid: user.uid,
    displayName: displayName || 'Golf Player',
    role: 'user',
    approved: false,
    createdAt: requestedAt,
  };

  try {
    // Save to pending_users
    await setDoc(doc(db, 'pending_users', user.uid), pendingDoc, { merge: true });
    // Save to users
    await setDoc(doc(db, 'users', user.uid), userDoc, { merge: true });
  } catch (err) {
    console.error('Could not save pending request to Firestore:', err);
    throw err;
  }

  return userDoc;
}

// Check current user profile & approval status
export async function fetchUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const userSnap = await getDoc(doc(db, 'users', uid));
    if (userSnap.exists()) {
      return userSnap.data() as UserProfile;
    }
    return null;
  } catch (err) {
    console.warn('Error fetching user profile from Firestore:', err);
    return null;
  }
}

export const AUTHORIZED_ADMIN_EMAILS = [
  'garrydavies1963@gmail.com',
];

const googleProvider = new GoogleAuthProvider();

// General Google Sign-In for players/users
export async function signInWithGoogle(): Promise<UserProfile> {
  const result = await signInWithPopup(auth, googleProvider);
  const user = result.user;
  const userEmail = (user.email || '').toLowerCase().trim();

  const isAdminEmail = userEmail === 'garrydavies1963@gmail.com';

  const existingProfile = await fetchUserProfile(user.uid);

  const userProfile: UserProfile = {
    uid: user.uid,
    email: user.email || '',
    displayName: user.displayName || user.email?.split('@')[0] || 'User',
    role: isAdminEmail ? 'admin' : (existingProfile?.role || 'user'),
    approved: isAdminEmail ? true : (existingProfile?.approved || false),
    createdAt: existingProfile?.createdAt || new Date().toISOString(),
  };

  try {
    await setDoc(doc(db, 'users', user.uid), userProfile, { merge: true });
  } catch (err) {
    console.warn('Could not save user profile to Firestore:', err);
  }

  return userProfile;
}

// Admin Google Sign-In function with strict email lockdown (garrydavies1963@gmail.com only)
export async function loginAdminWithGoogle(): Promise<UserProfile> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    const userEmail = (user.email || '').toLowerCase().trim();

    // Strict email check: only allow garrydavies1963@gmail.com as administrator
    if (userEmail !== 'garrydavies1963@gmail.com') {
      await signOut(auth);
      throw new Error(
        `Access denied: "${user.email}" is not authorized as an administrator. Only garrydavies1963@gmail.com is permitted as administrator.`
      );
    }

    const adminProfile: UserProfile = {
      uid: user.uid,
      email: 'garrydavies1963@gmail.com',
      displayName: user.displayName || 'Administrator',
      role: 'admin',
      approved: true,
      createdAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'users', user.uid), adminProfile, { merge: true });
    } catch (err) {
      console.warn('Could not update admin profile in Firestore:', err);
    }
    return adminProfile;
  } catch (err: any) {
    if (err.message && err.message.includes('Access denied')) {
      throw err;
    }
    console.error('Google Sign-In error:', err);
    if (err.code === 'auth/popup-closed-by-user') {
      throw new Error('Google sign-in popup was closed before completing. Please try again.');
    }
    if (err.code === 'auth/popup-blocked') {
      throw new Error('Google sign-in popup was blocked by your browser. Please allow popups for this site and try again.');
    }
    throw err;
  }
}

// Admin login function (restricted to garrydavies1963@gmail.com)
export async function loginAdmin(email: string, pass: string): Promise<UserProfile> {
  const cleanEmail = (email || '').toLowerCase().trim();
  if (cleanEmail && cleanEmail !== 'garrydavies1963@gmail.com') {
    throw new Error('Access denied: Only garrydavies1963@gmail.com is authorized as administrator.');
  }

  let credential;
  try {
    credential = await signInWithEmailAndPassword(auth, 'garrydavies1963@gmail.com', pass);
  } catch (err: any) {
    if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
      try {
        credential = await createUserWithEmailAndPassword(auth, 'garrydavies1963@gmail.com', pass);
      } catch (createErr: any) {
        throw new Error('Failed to authenticate as administrator. Please check your credentials.');
      }
    } else {
      throw err;
    }
  }

  const user = credential.user;
  const adminProfile: UserProfile = {
    uid: user.uid,
    email: 'garrydavies1963@gmail.com',
    displayName: 'Administrator',
    role: 'admin',
    approved: true,
    createdAt: new Date().toISOString(),
  };

  try {
    await setDoc(doc(db, 'users', user.uid), adminProfile, { merge: true });
  } catch (err) {
    console.warn('Could not update admin profile in Firestore:', err);
  }
  return adminProfile;
}

// Logout
export async function logoutUser() {
  await signOut(auth);
}

// Admin: Listen to pending users list
export function listenToPendingUsers(callback: (pendingList: PendingUser[]) => void) {
  const q = query(collection(db, 'pending_users'));
  return onSnapshot(q, (snapshot) => {
    const list: PendingUser[] = [];
    snapshot.forEach((docSnap) => {
      list.push(docSnap.data() as PendingUser);
    });
    callback(list);
  }, (error) => {
    console.error('Error listening to pending users:', error);
  });
}

// Admin: Listen to all registered users list
export function listenToAllUsers(callback: (usersList: UserProfile[]) => void) {
  const q = query(collection(db, 'users'));
  return onSnapshot(q, (snapshot) => {
    const list: UserProfile[] = [];
    snapshot.forEach((docSnap) => {
      list.push(docSnap.data() as UserProfile);
    });
    callback(list);
  }, (error) => {
    console.error('Error listening to all users:', error);
  });
}

// Admin: Approve pending user
export async function approvePendingUser(uid: string) {
  // Update pending_users
  await updateDoc(doc(db, 'pending_users', uid), {
    approved: true,
  });
  // Update users collection
  await updateDoc(doc(db, 'users', uid), {
    approved: true,
  });
}

// Admin: Reject / Remove pending user
export async function rejectPendingUser(uid: string) {
  await deleteDoc(doc(db, 'pending_users', uid));
  await deleteDoc(doc(db, 'users', uid));
}

// Admin: Delete any user and all associated scorecard data & PIN code
export async function deleteUserAndData(user: UserProfile) {
  const uid = user.uid;
  const playerName = (user.displayName || '').trim();

  // 1. Delete user from 'users' collection
  try {
    await deleteDoc(doc(db, 'users', uid));
  } catch (err) {
    console.warn('Error deleting user doc:', err);
  }

  // 2. Delete pending user if present
  try {
    await deleteDoc(doc(db, 'pending_users', uid));
  } catch (err) {
    console.warn('Error deleting pending user doc:', err);
  }

  // 3. Delete player pin if present
  if (playerName) {
    try {
      await deleteDoc(doc(db, 'player_pins', playerName.toLowerCase()));
    } catch (err) {
      console.warn('Error deleting player pin doc:', err);
    }
  }

  // 4. Delete associated scorecards from Firestore
  try {
    const roundsRef = collection(db, 'rounds');
    // Query by userId
    const q1 = query(roundsRef, where('userId', '==', uid));
    const snap1 = await getDocs(q1);
    snap1.forEach((d) => {
      deleteDoc(d.ref).catch((e) => console.warn('Error deleting round doc:', e));
    });

    // Query by player_name
    if (playerName) {
      const q2 = query(roundsRef, where('player_name', '==', playerName));
      const snap2 = await getDocs(q2);
      snap2.forEach((d) => {
        deleteDoc(d.ref).catch((e) => console.warn('Error deleting round doc:', e));
      });
    }
  } catch (err) {
    console.warn('Error querying/deleting user scorecards from Firestore:', err);
  }
}

// Helper to sanitize data for Firestore (removes undefined fields which cause setDoc to throw errors)
export function sanitizeForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return null as any;
  }
  if (typeof data !== 'object') {
    return data;
  }
  if (Array.isArray(data)) {
    return data.map((item) => sanitizeForFirestore(item)) as any;
  }
  const clean: Record<string, any> = {};
  for (const [key, value] of Object.entries(data as Record<string, any>)) {
    if (value !== undefined) {
      clean[key] = sanitizeForFirestore(value);
    }
  }
  return clean as T;
}

// FIRESTORE SCORECARD DATA SYNC
export async function saveRoundToFirestore(round: Round, userId?: string) {
  try {
    const user = auth.currentUser || (await ensureAnonymousAuth());
    const uid = userId || user.uid;
    const roundData = sanitizeForFirestore({
      ...round,
      userId: uid,
      updated_at: Date.now(),
    });
    await setDoc(doc(db, 'rounds', round.id), roundData, { merge: true });
  } catch (err) {
    console.error('Could not sync round to Firestore:', err);
  }
}

export async function deleteRoundFromFirestore(roundId: string) {
  try {
    await deleteDoc(doc(db, 'rounds', roundId));
  } catch (err) {
    console.error('Could not delete round from Firestore:', err);
  }
}

// PLAYER PIN CODE MANAGEMENT
export interface PlayerPin {
  playerName: string;
  pin: string;
  uid?: string;
  createdAt: number;
}

export async function getPlayerPin(playerName: string): Promise<string | null> {
  if (!playerName || !playerName.trim()) return null;
  const cleanName = playerName.trim().toLowerCase();
  
  // 1. Try Firestore
  try {
    const snap = await getDoc(doc(db, 'player_pins', cleanName));
    if (snap.exists()) {
      return (snap.data() as PlayerPin).pin || null;
    }
  } catch (err) {
    console.warn('Firestore getPlayerPin error:', err);
  }

  // 2. LocalStorage Fallback
  try {
    const raw = localStorage.getItem('golf_player_pins');
    if (raw) {
      const map = JSON.parse(raw);
      return map[cleanName] || null;
    }
  } catch (e) {
    // ignore
  }
  return null;
}

export async function setPlayerPin(playerName: string, pin: string, uid?: string): Promise<void> {
  if (!playerName || !playerName.trim() || !pin) return;
  const cleanName = playerName.trim().toLowerCase();
  const data: PlayerPin = {
    playerName: playerName.trim(),
    pin,
    uid,
    createdAt: Date.now(),
  };

  // 1. Save to LocalStorage
  try {
    const raw = localStorage.getItem('golf_player_pins');
    const map = raw ? JSON.parse(raw) : {};
    map[cleanName] = pin;
    localStorage.setItem('golf_player_pins', JSON.stringify(map));
  } catch (e) {
    // ignore
  }

  // 2. Save to Firestore
  try {
    await setDoc(doc(db, 'player_pins', cleanName), data, { merge: true });
  } catch (err) {
    console.warn('Firestore setPlayerPin error:', err);
  }
}

export async function deletePlayerPin(playerName: string): Promise<void> {
  if (!playerName || !playerName.trim()) return;
  const cleanName = playerName.trim().toLowerCase();

  // 1. Remove from LocalStorage
  try {
    const raw = localStorage.getItem('golf_player_pins');
    if (raw) {
      const map = JSON.parse(raw);
      if (map[cleanName]) {
        delete map[cleanName];
        localStorage.setItem('golf_player_pins', JSON.stringify(map));
      }
    }
  } catch (e) {
    // ignore
  }

  // 2. Remove from Firestore
  try {
    await deleteDoc(doc(db, 'player_pins', cleanName));
  } catch (err) {
    console.warn('Firestore deletePlayerPin error:', err);
  }
}

// Subscribe to real-time round updates
export function listenToRounds(
  userId: string,
  isApprovedOrAdmin: boolean,
  callback: (rounds: Round[]) => void
) {
  const roundsRef = collection(db, 'rounds');
  const q = query(roundsRef);

  return onSnapshot(
    q,
    (snapshot) => {
      const roundsList: Round[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as any;
        // Parse round structure safely
        const r: Round = {
          id: data.id || docSnap.id,
          player_name: data.player_name || 'Player',
          course_name: data.course_name || 'Tournament',
          date: data.date || new Date().toISOString().split('T')[0],
          holes: data.holes || 18,
          num_rounds: data.num_rounds,
          round_number: data.round_number,
          tournament_id: data.tournament_id,
          completed: Boolean(data.completed),
          total_score: data.total_score || 0,
          front_9_score: data.front_9_score || 0,
          back_9_score: data.back_9_score || 0,
          scores: data.scores || {},
          pars: data.pars || {},
          created_at: data.created_at || Date.now(),
          updated_at: data.updated_at || Date.now(),
          userId: data.userId,
        };
        roundsList.push(r);
      });
      // Sort newest first
      roundsList.sort((a, b) => b.updated_at - a.updated_at);
      callback(roundsList);
    },
    (err) => {
      console.warn('Firestore rounds subscription error:', err.message);
    }
  );
}

// TOURNAMENTS FIRESTORE SYNC
export async function saveTournamentToFirestore(tournament: Tournament) {
  try {
    const user = auth.currentUser || (await ensureAnonymousAuth());
    const data = sanitizeForFirestore({
      ...tournament,
      userId: user.uid,
      created_at: tournament.created_at || Date.now(),
    });
    await setDoc(doc(db, 'tournaments', tournament.id), data, { merge: true });
  } catch (err) {
    console.error('Could not save tournament to Firestore:', err);
    throw err;
  }
}

export async function deleteTournamentFromFirestore(tournamentId: string) {
  try {
    await deleteDoc(doc(db, 'tournaments', tournamentId));
  } catch (err) {
    console.warn('Could not delete tournament from Firestore:', err);
  }
}

export function listenToTournaments(callback: (tournaments: Tournament[]) => void) {
  const tournamentsRef = collection(db, 'tournaments');
  const q = query(tournamentsRef);

  return onSnapshot(
    q,
    (snapshot) => {
      const list: Tournament[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as any;
        list.push({
          id: data.id || docSnap.id,
          name: data.name || '',
          course_name: data.course_name || '',
          date: data.date || '',
          created_at: data.created_at || Date.now(),
          userId: data.userId,
        });
      });
      list.sort((a, b) => b.created_at - a.created_at);
      callback(list);
    },
    (err) => {
      console.warn('Firestore tournaments subscription paused:', err.message);
    }
  );
}
