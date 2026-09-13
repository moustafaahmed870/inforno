import { IPizzaRepository } from '../../domain/repositories/IPizzaRepository.js';
import { Pizza }            from '../../domain/entities/Pizza.js';
import { db, collection, doc, getDoc, getDocs, setDoc, deleteDoc, query, where } from '../firebase/firebaseApp.js';

const COLLECTION = 'products';

/**
 * @implements {IPizzaRepository}
 * Concrete implementation backed by Firestore
 */
export class FirestorePizzaRepository extends IPizzaRepository {
  async save(pizza) {
    await setDoc(doc(db, COLLECTION, pizza.id), { ...pizza.toDTO(), updatedAt: Date.now() });
  }

  async findById(id) {
    const snap = await getDoc(doc(db, COLLECTION, id));
    return snap.exists() ? Pizza.fromDTO(snap.data()) : null;
  }

  async findAll() {
    const snap = await getDocs(collection(db, COLLECTION));
    return snap.docs.map(d => Pizza.fromDTO(d.data()));
  }

  async findByCategory(category) {
    const q = query(collection(db, COLLECTION), where('category', '==', category));
    const snap = await getDocs(q);
    return snap.docs.map(d => Pizza.fromDTO(d.data()));
  }

  async delete(id) {
    await deleteDoc(doc(db, COLLECTION, id));
  }
}
