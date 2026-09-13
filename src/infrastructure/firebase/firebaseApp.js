/**
 * @module firebaseApp
 * Initializes Firebase (App, Auth, Firestore) via the CDN modular SDK.
 * No bundler required — matches this project's plain-ESM setup.
 */
import { initializeApp }        from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js';
import {
  getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged,
}                                from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js';
import {
  getFirestore, collection, doc, getDoc, getDocs, setDoc, deleteDoc, query, where,
}                                from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js';

import { firebaseConfig } from '../config/firebaseConfig.js';

export const firebaseApp = initializeApp(firebaseConfig);
export const auth        = getAuth(firebaseApp);
export const db          = getFirestore(firebaseApp);

// Re-exported so repositories/services import everything from one place
export {
  signInWithEmailAndPassword, signOut, onAuthStateChanged,
  collection, doc, getDoc, getDocs, setDoc, deleteDoc, query, where,
};
