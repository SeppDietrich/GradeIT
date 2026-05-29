export interface AppUser {
  uid: string;
  email: string;
  role: 'admin' | 'user';
  createdAt: Date;
  displayName?: string;
}
