import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  runTransaction,
  writeBatch,
  DocumentData,
  QueryConstraint,
} from 'firebase/firestore';
import { db } from '../../firebase';

function cleanUndefined(obj: any): any {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(cleanUndefined);
  const result: any = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) {
      result[k] = cleanUndefined(v);
    }
  }
  return result;
}

export class FirestoreService {
  public static subscribeCollection<T extends { id: string }>(
    collectionName: string,
    onData: (items: T[]) => void,
    onError?: (err: Error) => void,
    constraints: QueryConstraint[] = []
  ): () => void {
    const q = query(collection(db, collectionName), ...constraints);
    return onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((d) => ({ ...(d.data() as T), id: d.id }));
        onData(items);
      },
      (err) => {
        console.warn(`Firestore listener notice on [${collectionName}]:`, err);
        if (onError) onError(err);
      }
    );
  }

  public static async getCollection<T extends { id: string }>(
    collectionName: string,
    constraints: QueryConstraint[] = []
  ): Promise<T[]> {
    const q = query(collection(db, collectionName), ...constraints);
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ ...(d.data() as T), id: d.id }));
  }

  public static async getDocument<T>(collectionName: string, docId: string): Promise<T | null> {
    const snap = await getDoc(doc(db, collectionName, docId));
    if (snap.exists()) {
      return snap.data() as T;
    }
    return null;
  }

  public static async saveDocument<T extends DocumentData>(
    collectionName: string,
    docId: string,
    data: T
  ): Promise<void> {
    const cleaned = cleanUndefined(data);
    await setDoc(doc(db, collectionName, docId), cleaned, { merge: true });
  }

  public static async updateDocument(
    collectionName: string,
    docId: string,
    data: Partial<DocumentData>
  ): Promise<void> {
    const cleaned = cleanUndefined(data);
    await updateDoc(doc(db, collectionName, docId), cleaned);
  }

  public static async deleteDocument(collectionName: string, docId: string): Promise<void> {
    await deleteDoc(doc(db, collectionName, docId));
  }

  /**
   * Atomic sequence generator for document & entity numbering (prevents multi-user collisions)
   */
  public static async getNextAtomicSequence(
    counterKey: string,
    prefix: string,
    digitPadding: number = 4,
    includeYear: boolean = true
  ): Promise<string> {
    const counterDocRef = doc(db, 'settings', 'counters');
    const yearStr = includeYear ? `${new Date().getFullYear()}-` : '';

    return await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(counterDocRef);
      const data = snap.exists() ? snap.data() : {};
      const current = (data[counterKey] as number) || 0;
      const next = current + 1;

      transaction.set(counterDocRef, { ...data, [counterKey]: next }, { merge: true });
      const padded = String(next).padStart(digitPadding, '0');
      return `${prefix}-${yearStr}${padded}`;
    });
  }
}
