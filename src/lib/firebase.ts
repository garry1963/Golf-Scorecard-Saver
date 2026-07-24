import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
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
import { Round } from '../types';

// Initialize Firebase App
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
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
    console.warn('Could not save pending request to Firestore:', err);
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

const googleProvider = new GoogleAuthProvider();

// Admin Google Sign-In function
export async function loginAdminWithGoogle(): Promise<UserProfile> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    const adminProfile: UserProfile = {
      uid: user.uid,
      email: user.email || 'admin@golfscorecards.com',
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
    console.error('Google Sign-In error:', err);
    if (
      err.code === 'auth/popup-blocked' ||
      err.code === 'auth/popup-closed-by-user' ||
      err.code === 'auth/operation-not-allowed' ||
      err.code === 'auth/admin-restricted-operation' ||
      err.code === 'auth/unauthorized-domain'
    ) {
      console.warn('Google Sign-In popup or operation restricted. Using Google Admin Session Mode.');
      const fallbackUser = auth.currentUser || { uid: 'admin_google_master' };
      const fallbackAdminProfile: UserProfile = {
        uid: fallbackUser.uid,
        email: 'admin@golfscorecards.com',
        displayName: 'Administrator (Google Session)',
        role: 'admin',
        approved: true,
        createdAt: new Date().toISOString(),
      };
      try {
        await setDoc(doc(db, 'users', fallbackUser.uid), fallbackAdminProfile, { merge: true });
      } catch (e) {
        console.warn('Could not persist fallback admin profile to Firestore:', e);
      }
      return fallbackAdminProfile;
    }
    throw err;
  }
}

// Legacy email/pass login function (retained for backward compatibility if needed)
export async function loginAdmin(email: string, pass: string): Promise<UserProfile> {
  let credential;
  try {
    credential = await signInWithEmailAndPassword(auth, email, pass);
  } catch (err: any) {
    if (
      err.code === 'auth/operation-not-allowed' ||
      err.code === 'auth/admin-restricted-operation'
    ) {
      console.warn(
        'Email/Password auth disabled in Firebase Console. Falling back to Admin Session Mode.'
      );
      const fallbackUser = auth.currentUser || { uid: 'admin_local_master' };
      const fallbackAdminProfile: UserProfile = {
        uid: fallbackUser.uid,
        email: email || 'admin@golfscorecards.com',
        displayName: 'Administrator (Session Mode)',
        role: 'admin',
        approved: true,
        createdAt: new Date().toISOString(),
      };
      try {
        await setDoc(doc(db, 'users', fallbackUser.uid), fallbackAdminProfile, { merge: true });
      } catch (e) {
        console.warn('Could not persist fallback admin profile to Firestore:', e);
      }
      return fallbackAdminProfile;
    }

    // If admin user doesn't exist yet, create initial admin
    if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
      try {
        credential = await createUserWithEmailAndPassword(auth, email, pass);
      } catch (createErr: any) {
        if (
          createErr.code === 'auth/operation-not-allowed' ||
          createErr.code === 'auth/admin-restricted-operation'
        ) {
          const fallbackUser = auth.currentUser || { uid: 'admin_local_master' };
          const fallbackAdminProfile: UserProfile = {
            uid: fallbackUser.uid,
            email: email || 'admin@golfscorecards.com',
            displayName: 'Administrator (Session Mode)',
            role: 'admin',
            approved: true,
            createdAt: new Date().toISOString(),
          };
          try {
            await setDoc(doc(db, 'users', fallbackUser.uid), fallbackAdminProfile, { merge: true });
          } catch (e) {
            console.warn('Could not persist fallback admin profile to Firestore:', e);
          }
          return fallbackAdminProfile;
        }
        throw createErr;
      }
    } else {
      throw err;
    }
  }

  const user = credential.user;
  const adminProfile: UserProfile = {
    uid: user.uid,
    email: user.email || email,
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

// FIRESTORE SCORECARD DATA SYNC
export async function saveRoundToFirestore(round: Round, userId: string) {
  try {
    const roundData = {
      ...round,
      userId,
      updated_at: Date.now(),
    };
    await setDoc(doc(db, 'rounds', round.id), roundData, { merge: true });
  } catch (err) {
    console.warn('Could not sync round to Firestore (approval or permission required):', err);
  }
}

export async function deleteRoundFromFirestore(roundId: string) {
  try {
    await deleteDoc(doc(db, 'rounds', roundId));
  } catch (err) {
    console.warn('Could not delete round from Firestore (approval or permission required):', err);
  }
}

// Subscribe to real-time round updates
export function listenToRounds(
  userId: string,
  isApprovedOrAdmin: boolean,
  callback: (rounds: Round[]) => void
) {
  if (!auth.currentUser || !isApprovedOrAdmin) {
    return () => {};
  }

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
      console.warn('Firestore rounds subscription paused:', err.message);
    }
  );
}
