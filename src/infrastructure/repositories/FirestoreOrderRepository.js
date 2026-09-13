import { IOrderRepository } from '../../domain/repositories/IOrderRepository.js';
import { Order }            from '../../domain/entities/Order.js';
import { db, collection, doc, getDoc, getDocs, setDoc, deleteDoc, query, where } from '../firebase/firebaseApp.js';

const COLLECTION = 'orders';

/**
 * @implements {IOrderRepository}
 */
export class FirestoreOrderRepository extends IOrderRepository {
  async save(order) {
    await setDoc(doc(db, COLLECTION, order.id), order.toDTO());
  }

  async findById(id) {
    const snap = await getDoc(doc(db, COLLECTION, id));
    return snap.exists() ? Order.fromDTO(snap.data()) : null;
  }

  async findAll() {
    const snap = await getDocs(collection(db, COLLECTION));
    return snap.docs.map(d => Order.fromDTO(d.data()));
  }

  async findByStatus(statusValue) {
    const val = typeof statusValue === 'string' ? statusValue : statusValue.value;
    const q = query(collection(db, COLLECTION), where('status', '==', val));
    const snap = await getDocs(q);
    return snap.docs.map(d => Order.fromDTO(d.data()));
  }

  async delete(id) {
    await deleteDoc(doc(db, COLLECTION, id));
  }
}
