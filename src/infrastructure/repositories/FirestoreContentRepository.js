import { IContentRepository } from '../../domain/repositories/IContentRepository.js';
import { db, doc, getDoc, setDoc } from '../firebase/firebaseApp.js';

const COLLECTION = 'siteContent';

/**
 * @implements {IContentRepository}
 * Each "key" is a document in the `siteContent` collection (e.g. 'home')
 */
export class FirestoreContentRepository extends IContentRepository {
  async get(key) {
    const snap = await getDoc(doc(db, COLLECTION, key));
    return snap.exists() ? snap.data() : null;
  }

  async set(key, data) {
    await setDoc(doc(db, COLLECTION, key), { ...data, updatedAt: Date.now() }, { merge: true });
  }
}
