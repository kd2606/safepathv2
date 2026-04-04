/* ============================================
   SAFEPATH — Firebase Configuration & Init
   ============================================
   Firebase v10 modular SDK via CDN
   Collections: users, dangerReports, sosEvents
   ============================================ */

// Firebase v10 modular SDK (CDN imports)
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  GeoPoint,
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
import {
  getAuth,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  GoogleAuthProvider,
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';


/* ── Firebase Config ──
   Replace these values with your actual Firebase project config.
   In production, load from environment or a build step.
   ────────────────────────────────────────────── */
const firebaseConfig = {
  apiKey:            'YOUR_API_KEY',
  authDomain:        'YOUR_PROJECT.firebaseapp.com',
  projectId:         'YOUR_PROJECT_ID',
  storageBucket:     'YOUR_PROJECT.appspot.com',
  messagingSenderId: 'YOUR_SENDER_ID',
  appId:             'YOUR_APP_ID',
};


/* ── Initialize Firebase ── */
const app  = initializeApp(firebaseConfig);
const db   = getFirestore(app);
const auth = getAuth(app);


/* ── Collection References ──
   These match the Firestore schema:
   
   users/{uid}:
     - name: string
     - phone: string
     - emergencyContacts: string[]
     - location: GeoPoint
     - createdAt: Timestamp
   
   dangerReports/{id}:
     - lat: number
     - lng: number
     - category: string (e.g. "theft", "harassment", "accident")
     - severity: "low" | "medium" | "high"
     - reportedBy: string (uid)
     - timestamp: Timestamp
     - upvotes: number
   
   sosEvents/{id}:
     - userId: string
     - lat: number
     - lng: number
     - timestamp: Timestamp
     - status: "active" | "resolved" | "cancelled"
     - trackingToken: string
   ──────────────────────────────────────────── */
const COLLECTIONS = {
  USERS:          'users',
  DANGER_REPORTS: 'dangerReports',
  SOS_EVENTS:     'sosEvents',
};


/* ── Helper: Get collection ref ── */
const usersRef         = () => collection(db, COLLECTIONS.USERS);
const dangerReportsRef = () => collection(db, COLLECTIONS.DANGER_REPORTS);
const sosEventsRef     = () => collection(db, COLLECTIONS.SOS_EVENTS);


/* ── Auth helpers ── */
const googleProvider = new GoogleAuthProvider();

/**
 * Sign in with Google popup
 * @returns {Promise<import('firebase/auth').UserCredential>}
 */
const signInWithGoogle = () => signInWithPopup(auth, googleProvider);

/**
 * Sign out the current user
 * @returns {Promise<void>}
 */
const logOut = () => signOut(auth);

/**
 * Listen for auth state changes
 * @param {function} callback — receives user or null
 * @returns {function} unsubscribe
 */
const onAuthChange = (callback) => onAuthStateChanged(auth, callback);


/* ── Export everything needed by the app ── */
export {
  // Firebase instances
  app,
  db,
  auth,

  // Auth utilities
  signInWithGoogle,
  logOut,
  onAuthChange,

  // Firestore utilities
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  GeoPoint,

  // Collection refs
  COLLECTIONS,
  usersRef,
  dangerReportsRef,
  sosEventsRef,
};
