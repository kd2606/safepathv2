import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, signInAnonymously } from "firebase/auth";
import { getFirestore, collection, addDoc, getDocs, query, where, serverTimestamp, updateDoc, doc, getDoc, setDoc, onSnapshot, arrayUnion } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import config from "./config/keys";

const firebaseConfig = config.firebase;

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google: ", error);
    throw error;
  }
};

export const logOut = () => signOut(auth);

export { auth, db, storage, onAuthStateChanged, signInAnonymously, collection, addDoc, getDocs, query, where, serverTimestamp, updateDoc, doc, getDoc, setDoc, onSnapshot, ref, uploadBytes, getDownloadURL, arrayUnion };
