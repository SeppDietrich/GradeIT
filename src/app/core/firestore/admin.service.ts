import { Injectable, inject } from '@angular/core';
import {
  Firestore, collection, collectionData,
  doc, updateDoc, deleteDoc, getDocs, query, getDoc
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { AppUser } from '../auth/user.model';
import { GradingList } from '../models';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private firestore = inject(Firestore);

  // ─── Utilizatori ─────────────────────────────────────────────────────────

  getUsers(): Observable<AppUser[]> {
    return collectionData(
      collection(this.firestore, 'users'), { idField: 'uid' }
    ) as Observable<AppUser[]>;
  }

  async setUserRole(uid: string, role: 'admin' | 'user'): Promise<void> {
    await updateDoc(doc(this.firestore, `users/${uid}`), { role });
  }

  async deleteUser(uid: string): Promise<void> {
    // Șterge toate listele utilizatorului
    const listsRef = collection(this.firestore, `users/${uid}/gradingLists`);
    const listsSnap = await getDocs(listsRef);
    for (const listDoc of listsSnap.docs) {
      // Șterge și din publicLists dacă e publică
      try {
        await deleteDoc(doc(this.firestore, `publicLists/${listDoc.id}`));
      } catch (_) {}
      await deleteDoc(listDoc.ref);
    }
    await deleteDoc(doc(this.firestore, `users/${uid}`));
  }

  // ─── Toate listele (din toți utilizatorii) ───────────────────────────────

  async getAllLists(): Promise<GradingList[]> {
    const usersSnap = await getDocs(collection(this.firestore, 'users'));
    const allLists: GradingList[] = [];

    for (const userDoc of usersSnap.docs) {
      const listsSnap = await getDocs(
        collection(this.firestore, `users/${userDoc.id}/gradingLists`)
      );
      for (const listDoc of listsSnap.docs) {
        allLists.push({ id: listDoc.id, ...listDoc.data() } as GradingList);
      }
    }

    return allLists;
  }

  async deleteList(userId: string, listId: string): Promise<void> {
    await deleteDoc(doc(this.firestore, `users/${userId}/gradingLists/${listId}`));
    try {
      await deleteDoc(doc(this.firestore, `publicLists/${listId}`));
    } catch (_) {}
  }

  async toggleListPublic(userId: string, listId: string, isPublic: boolean): Promise<void> {
    await updateDoc(
      doc(this.firestore, `users/${userId}/gradingLists/${listId}`),
      { isPublic }
    );
    if (!isPublic) {
      try { await deleteDoc(doc(this.firestore, `publicLists/${listId}`)); } catch (_) {}
    }
  }
}
