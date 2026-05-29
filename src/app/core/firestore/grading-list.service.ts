import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  addDoc,
  collection,
  collectionData,
  deleteDoc,
  doc,
  docData,
  serverTimestamp,
  setDoc,
  updateDoc,
} from '@angular/fire/firestore';
import { Observable, filter, switchMap, take } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { GradeItem, GradingList, calculateOverallScore } from '../models';

@Injectable({ providedIn: 'root' })
export class GradingListService {
  private firestore = inject(Firestore);
  private auth = inject(AuthService);

  private userListsRef(userId: string) {
    return collection(this.firestore, `users/${userId}/gradingLists`);
  }

  private publicListsRef() {
    return collection(this.firestore, 'publicLists');
  }

  // ─── Citire ───────────────────────────────────────────────────────────────

  getMyLists(): Observable<GradingList[]> {
    return this.auth.user$.pipe(
      filter(user => user !== null && user !== undefined),
      switchMap(user =>
        collectionData(this.userListsRef(user!.uid), { idField: 'id' }) as Observable<GradingList[]>
      )
    );
  }

  getList(listId: string): Observable<GradingList> {
    return this.auth.user$.pipe(
      filter(user => user !== null && user !== undefined),
      take(1),
      switchMap(user => {
        const ref = doc(this.firestore, `users/${user!.uid}/gradingLists/${listId}`);
        return docData(ref, { idField: 'id' }) as Observable<GradingList>;
      })
    );
  }

  getPublicLists(): Observable<GradingList[]> {
    return collectionData(this.publicListsRef(), { idField: 'id' }) as Observable<GradingList[]>;
  }

  // ─── Creare ───────────────────────────────────────────────────────────────

  async createList(
    data: Omit<GradingList, 'id' | 'userId' | 'userEmail' | 'createdAt' | 'updatedAt'>
  ): Promise<string> {
    const user = this.auth.currentUser!;
    const payload = {
      ...data,
      userId: user.uid,
      userEmail: user.email ?? '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const ref = await addDoc(this.userListsRef(user.uid), payload);

    if (data.isPublic) {
      await setDoc(doc(this.publicListsRef(), ref.id), {
        ...payload,
        id: ref.id,
      });
    }

    return ref.id;
  }

  // ─── Actualizare ─────────────────────────────────────────────────────────

  async updateList(listId: string, changes: Partial<GradingList>): Promise<void> {
    const user = this.auth.currentUser!;
    const userRef = doc(this.firestore, `users/${user.uid}/gradingLists/${listId}`);
    const publicRef = doc(this.publicListsRef(), listId);

    await updateDoc(userRef, { ...changes, updatedAt: serverTimestamp() });

    if (changes.isPublic === true) {
      // Obține documentul complet și sincronizează în publicLists
      const fullPayload = {
        ...changes,
        id: listId,
        userId: user.uid,
        userEmail: user.email ?? '',
        updatedAt: serverTimestamp(),
      };
      await setDoc(publicRef, fullPayload, { merge: true });
    } else if (changes.isPublic === false) {
      // Șterge din publicLists dacă devine privată
      try { await deleteDoc(publicRef); } catch (_) {}
    } else {
      // Update normal — dacă există în publicLists, actualizează și acolo
      await setDoc(publicRef, { ...changes, updatedAt: serverTimestamp() }, { merge: true });
    }
  }

  // ─── Ștergere ─────────────────────────────────────────────────────────────

  async deleteList(listId: string): Promise<void> {
    const user = this.auth.currentUser!;
    await deleteDoc(doc(this.firestore, `users/${user.uid}/gradingLists/${listId}`));
    try { await deleteDoc(doc(this.publicListsRef(), listId)); } catch (_) {}
  }

  // ─── Iteme ────────────────────────────────────────────────────────────────

  async addOrUpdateItem(listId: string, list: GradingList, item: GradeItem): Promise<void> {
    item.overallScore = calculateOverallScore(item.scores, list.criteria);
    const existingIndex = list.items.findIndex(i => i.id === item.id);
    const updatedItems = existingIndex >= 0
      ? list.items.map(i => (i.id === item.id ? item : i))
      : [...list.items, item];
    await this.updateList(listId, { items: updatedItems });
  }

  async removeItem(listId: string, list: GradingList, itemId: string): Promise<void> {
    const updatedItems = list.items.filter(i => i.id !== itemId);
    await this.updateList(listId, { items: updatedItems });
  }
}
