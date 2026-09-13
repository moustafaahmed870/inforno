import { IAuthService } from '../../application/ports/IAuthService.js';
import {
  auth, db, signInWithEmailAndPassword, signOut, onAuthStateChanged, doc, getDoc,
} from '../firebase/firebaseApp.js';

/**
 * @implements {IAuthService}
 * A logged-in user is treated as "admin" only if a matching doc exists
 * in the `admins` Firestore collection (doc id = uid). See /firestore.rules.
 */
export class FirebaseAuthService extends IAuthService {
  async login(email, password) {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return this.#toUser(cred.user);
  }

  async logout() {
    await signOut(auth);
  }

  getCurrentUser() {
    return new Promise(resolve => {
      const unsubscribe = onAuthStateChanged(auth, async fbUser => {
        unsubscribe();
        resolve(fbUser ? await this.#toUser(fbUser) : null);
      });
    });
  }

  onAuthChanged(callback) {
    return onAuthStateChanged(auth, async fbUser => {
      callback(fbUser ? await this.#toUser(fbUser) : null);
    });
  }

  /** @returns {Promise<string|null>} Firebase ID token for calling protected /api routes */
  async getIdToken() {
    return auth.currentUser ? auth.currentUser.getIdToken() : null;
  }

  async #toUser(fbUser) {
    let isAdmin = false;
    try {
      const snap = await getDoc(doc(db, 'admins', fbUser.uid));
      isAdmin = snap.exists();
    } catch {
      isAdmin = false;
    }
    return { uid: fbUser.uid, email: fbUser.email, isAdmin };
  }
}
