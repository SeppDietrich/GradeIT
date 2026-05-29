import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  Auth, GoogleAuthProvider, User,
  createUserWithEmailAndPassword, onAuthStateChanged,
  signInWithEmailAndPassword, signInWithPopup, signOut,
} from '@angular/fire/auth';
import {
  Firestore, doc, getDoc, setDoc, serverTimestamp
} from '@angular/fire/firestore';
import { BehaviorSubject, Observable } from 'rxjs';
import { AppUser } from './user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private auth = inject(Auth);
  private firestore = inject(Firestore);
  private router = inject(Router);

  // undefined = Firebase nu a răspuns încă, null = neautentificat
  private userSubject = new BehaviorSubject<User | null | undefined>(undefined);
  user$: Observable<User | null | undefined> = this.userSubject.asObservable();

  private appUserSubject = new BehaviorSubject<AppUser | null>(null);
  appUser$: Observable<AppUser | null> = this.appUserSubject.asObservable();

  constructor() {
    onAuthStateChanged(this.auth, async user => {
      this.userSubject.next(user);
      if (user) {
        const appUser = await this.loadOrCreateAppUser(user);
        this.appUserSubject.next(appUser);
      } else {
        this.appUserSubject.next(null);
      }
    });
  }

  get currentUser(): User | null {
    return this.userSubject.value ?? null;
  }

  get appUser(): AppUser | null {
    return this.appUserSubject.value;
  }

  get isAdmin(): boolean {
    return this.appUserSubject.value?.role === 'admin';
  }

  // ─── Creare/încărcare profil utilizator în Firestore ─────────────────────
  private async loadOrCreateAppUser(user: User): Promise<AppUser> {
    const ref = doc(this.firestore, `users/${user.uid}`);
    const snap = await getDoc(ref);

    if (snap.exists()) {
      return snap.data() as AppUser;
    }

    // Primul utilizator devine admin automat
    const allUsersSnap = await getDoc(doc(this.firestore, '_meta/userCount'));
    const isFirst = !allUsersSnap.exists();

    const appUser: AppUser = {
      uid: user.uid,
      email: user.email ?? '',
      role: isFirst ? 'admin' : 'user',
      displayName: user.displayName ?? '',
      createdAt: new Date(),
    };

    await setDoc(ref, { ...appUser, createdAt: serverTimestamp() });

    if (isFirst) {
      await setDoc(doc(this.firestore, '_meta/userCount'), { count: 1 });
    }

    return appUser;
  }

  // ─── Autentificare ────────────────────────────────────────────────────────
  async loginWithGoogle(): Promise<void> {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(this.auth, provider);
    this.router.navigate(['/lists']);
  }

  async loginWithEmail(email: string, password: string): Promise<void> {
    await signInWithEmailAndPassword(this.auth, email, password);
    this.router.navigate(['/lists']);
  }

  async registerWithEmail(email: string, password: string): Promise<void> {
    await createUserWithEmailAndPassword(this.auth, email, password);
    this.router.navigate(['/lists']);
  }

  async logout(): Promise<void> {
    await signOut(this.auth);
    this.appUserSubject.next(null);
    this.router.navigate(['/']);
  }
}
