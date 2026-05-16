import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  addDoc,
  collection,
  collectionData,
  deleteDoc,
  doc,
  docData,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from '@angular/fire/firestore';
import { Observable, filter, switchMap, take } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { GradeItem, GradingList, calculateOverallScore } from '../models';

@Injectable({ providedIn: 'root' })
export class GradingListService {
  private firestore = inject(Firestore);
  private auth = inject(AuthService);

  // ─── Colecții Firestore ───────────────────────────────────────────────────
  // users/{userId}/gradingLists/{listId}  ← liste private (și publice)
  // publicLists/{listId}                  ← copie pentru query-uri publice rapide

  private userListsRef(userId: string) {
    return collection(this.firestore, `users/${userId}/gradingLists`);
  }

  private publicListsRef() {
    return collection(this.firestore, 'publicLists');
  }

  // ─── Citire ───────────────────────────────────────────────────────────────

  /** Toate listele utilizatorului curent — așteaptă autentificarea */
  getMyLists(): Observable<GradingList[]> {
    return this.auth.user$.pipe(
      filter(user => user !== null),
      switchMap(user =>
        collectionData(this.userListsRef(user!.uid), { idField: 'id' }) as Observable<GradingList[]>
      )
    );
  }

  /** O singură listă după ID — așteaptă autentificarea */
  getList(listId: string): Observable<GradingList> {
    return this.auth.user$.pipe(
      filter(user => user !== null),
      take(1),
      switchMap(user => {
        const ref = doc(this.firestore, `users/${user!.uid}/gradingLists/${listId}`);
        return docData(ref, { idField: 'id' }) as Observable<GradingList>;
      })
    );
  }

  /** Toate listele publice (pentru pagina de explorare) */
  getPublicLists(): Observable<GradingList[]> {
    return collectionData(this.publicListsRef(), {
      idField: 'id',
    }) as Observable<GradingList[]>;
  }

  // ─── Creare ───────────────────────────────────────────────────────────────

  async createList(
    data: Omit<GradingList, 'id' | 'userId' | 'userEmail' | 'createdAt' | 'updatedAt'>
  ): Promise<string> {
    const user = this.auth.currentUser!;
    const payload = {
      ...data,
      userId: user.uid,
      userEmail: user.email,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    const ref = await addDoc(this.userListsRef(user.uid), payload);
    if (data.isPublic) {
      await setDoc(doc(this.publicListsRef(), ref.id), { ...payload, id: ref.id });
    }
    return ref.id;
  }

  // ─── Actualizare ─────────────────────────────────────────────────────────

  async updateList(listId: string, changes: Partial<GradingList>): Promise<void> {
    const userId = this.auth.currentUser!.uid;
    const ref = doc(this.firestore, `users/${userId}/gradingLists/${listId}`);
    await updateDoc(ref, { ...changes, updatedAt: serverTimestamp() });

    // Sincronizează cu colecția publică
    const publicRef = doc(this.publicListsRef(), listId);
    if (changes.isPublic === true) {
      const list = { ...changes, id: listId, updatedAt: serverTimestamp() };
      await setDoc(publicRef, list, { merge: true });
    } else if (changes.isPublic === false) {
      await deleteDoc(publicRef);
    } else if (changes.isPublic === undefined) {
      await setDoc(publicRef, { ...changes, updatedAt: serverTimestamp() }, { merge: true });
    }
  }

  // ─── Ștergere ─────────────────────────────────────────────────────────────

  async deleteList(listId: string): Promise<void> {
    const userId = this.auth.currentUser!.uid;
    await deleteDoc(doc(this.firestore, `users/${userId}/gradingLists/${listId}`));
    await deleteDoc(doc(this.publicListsRef(), listId));
  }

  // ─── Adăugare element evaluat ─────────────────────────────────────────────

  async addOrUpdateItem(listId: string, list: GradingList, item: GradeItem): Promise<void> {
    item.overallScore = calculateOverallScore(item.scores, list.criteria);
    const existingIndex = list.items.findIndex(i => i.id === item.id);
    let updatedItems: GradeItem[];
    if (existingIndex >= 0) {
      updatedItems = list.items.map(i => (i.id === item.id ? item : i));
    } else {
      updatedItems = [...list.items, item];
    }
    await this.updateList(listId, { items: updatedItems });
  }

  async removeItem(listId: string, list: GradingList, itemId: string): Promise<void> {
    const updatedItems = list.items.filter(i => i.id !== itemId);
    await this.updateList(listId, { items: updatedItems });
  }
}