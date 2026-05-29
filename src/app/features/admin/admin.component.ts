import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../core/firestore/admin.service';
import { AuthService } from '../../core/auth/auth.service';
import { AppUser } from '../../core/auth/user.model';
import { GradingList } from '../../core/models';

type Tab = 'users' | 'lists';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
<div class="admin-page">

  <!-- Header -->
  <header class="admin-header">
    <div class="header-left">
      <span class="admin-badge">⚙️ Admin Panel</span>
      <span class="user-info">{{ auth.appUser?.email }}</span>
    </div>
    <a routerLink="/lists" class="btn btn-outline">← Înapoi la aplicație</a>
  </header>

  <!-- Stats -->
  <div class="stats-row">
    <div class="stat-card">
      <div class="stat-num">{{ users.length }}</div>
      <div class="stat-label">Utilizatori</div>
    </div>
    <div class="stat-card">
      <div class="stat-num">{{ allLists.length }}</div>
      <div class="stat-label">Liste totale</div>
    </div>
    <div class="stat-card">
      <div class="stat-num">{{ publicCount }}</div>
      <div class="stat-label">Liste publice</div>
    </div>
    <div class="stat-card">
      <div class="stat-num">{{ adminCount }}</div>
      <div class="stat-label">Admini</div>
    </div>
  </div>

  <!-- Tabs -->
  <div class="tabs">
    <button class="tab" [class.active]="activeTab === 'users'" (click)="activeTab = 'users'">
      👥 Utilizatori ({{ users.length }})
    </button>
    <button class="tab" [class.active]="activeTab === 'lists'" (click)="activeTab = 'lists'">
      📋 Toate listele ({{ allLists.length }})
    </button>
  </div>

  <!-- Search -->
  <div class="search-bar">
    <input [(ngModel)]="searchQuery" placeholder="Caută..." class="search-input" />
  </div>

  <!-- Tab: Utilizatori -->
  <div *ngIf="activeTab === 'users'">
    <div *ngIf="loadingUsers" class="loading">Se încarcă utilizatorii...</div>
    <div class="table-wrapper" *ngIf="!loadingUsers">
      <table class="data-table">
        <thead>
          <tr>
            <th>Email</th>
            <th>Rol</th>
            <th>Creat</th>
            <th>Liste</th>
            <th>Acțiuni</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let user of filteredUsers" [class.current-user]="user.uid === auth.currentUser?.uid">
            <td>
              <span class="email">{{ user.email }}</span>
              <span class="you-badge" *ngIf="user.uid === auth.currentUser?.uid">tu</span>
            </td>
            <td>
              <select class="role-select"
                      [value]="user.role"
                      (change)="changeRole(user, $any($event.target).value)"
                      [disabled]="user.uid === auth.currentUser?.uid">
                <option value="user">user</option>
                <option value="admin">admin</option>
              </select>
            </td>
            <td class="date-col">{{ formatDate(user.createdAt) }}</td>
            <td class="center">{{ listCountForUser(user.uid) }}</td>
            <td>
              <button class="btn-icon danger"
                      (click)="deleteUser(user)"
                      [disabled]="user.uid === auth.currentUser?.uid"
                      title="Șterge utilizator">🗑</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- Tab: Liste -->
  <div *ngIf="activeTab === 'lists'">
    <div *ngIf="loadingLists" class="loading">Se încarcă listele...</div>
    <div class="table-wrapper" *ngIf="!loadingLists">
      <table class="data-table">
        <thead>
          <tr>
            <th>Listă</th>
            <th>Proprietar</th>
            <th>Criterii</th>
            <th>Elemente</th>
            <th>Vizibilitate</th>
            <th>Acțiuni</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let list of filteredLists">
            <td>
              <span class="list-emoji">{{ list.emoji || '📋' }}</span>
              <strong>{{ list.title }}</strong>
            </td>
            <td class="email-col">{{ list.userEmail }}</td>
            <td class="center">{{ list.criteria.length }}</td>
            <td class="center">{{ list.items.length }}</td>
            <td>
              <span class="badge" [class.badge-public]="list.isPublic" [class.badge-private]="!list.isPublic">
                {{ list.isPublic ? '🌍 Public' : '🔒 Privat' }}
              </span>
            </td>
            <td class="actions-col">
              <button class="btn-icon"
                      (click)="togglePublic(list)"
                      [title]="list.isPublic ? 'Fă privată' : 'Fă publică'">
                {{ list.isPublic ? '🔒' : '🌍' }}
              </button>
              <button class="btn-icon danger"
                      (click)="deleteList(list)"
                      title="Șterge lista">🗑</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- Confirm dialog -->
  <div class="modal-overlay" *ngIf="confirmMsg" (click)="cancelConfirm()">
    <div class="modal" (click)="$event.stopPropagation()">
      <p>{{ confirmMsg }}</p>
      <div class="modal-actions">
        <button class="btn btn-danger" (click)="runConfirm()">Confirmă</button>
        <button class="btn btn-outline" (click)="cancelConfirm()">Anulează</button>
      </div>
    </div>
  </div>

</div>
  `,
  styles: [`
.admin-page { max-width: 1100px; margin: 0 auto; padding: 1.5rem; }
.admin-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 10px; }
.header-left { display: flex; align-items: center; gap: 12px; }
.admin-badge { font-size: 16px; font-weight: 500; }
.user-info { font-size: 13px; color: var(--color-text-secondary); }
.stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 1.5rem; }
.stat-card { background: var(--color-background-primary); border: 0.5px solid var(--color-border-tertiary); border-radius: var(--border-radius-lg); padding: 1rem; text-align: center; }
.stat-num { font-size: 2rem; font-weight: 500; color: #1D9E75; }
.stat-label { font-size: 12px; color: var(--color-text-secondary); margin-top: 4px; }
.tabs { display: flex; gap: 4px; border-bottom: 0.5px solid var(--color-border-tertiary); margin-bottom: 1rem; }
.tab { padding: 8px 16px; font-size: 13px; cursor: pointer; border: none; background: none; border-bottom: 2px solid transparent; color: var(--color-text-secondary); transition: all 0.15s; }
.tab.active { color: #0F6E56; border-bottom-color: #1D9E75; font-weight: 500; }
.search-bar { margin-bottom: 1rem; }
.search-input { width: 100%; max-width: 320px; padding: 7px 12px; font-size: 13px; border: 0.5px solid var(--color-border-secondary); border-radius: var(--border-radius-md); background: var(--color-background-secondary); color: var(--color-text-primary); }
.table-wrapper { overflow-x: auto; }
.data-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.data-table th { text-align: left; font-size: 11px; color: var(--color-text-secondary); text-transform: uppercase; letter-spacing: 0.5px; padding: 8px 10px; border-bottom: 0.5px solid var(--color-border-tertiary); white-space: nowrap; }
.data-table td { padding: 10px; border-bottom: 0.5px solid var(--color-border-tertiary); vertical-align: middle; }
.data-table tr:last-child td { border-bottom: none; }
.data-table tr.current-user td { background: rgba(29,158,117,0.04); }
.email { font-size: 13px; }
.you-badge { font-size: 10px; background: #E1F5EE; color: #085041; border-radius: 20px; padding: 1px 6px; margin-left: 6px; }
.role-select { font-size: 12px; padding: 3px 6px; border: 0.5px solid var(--color-border-secondary); border-radius: 4px; background: var(--color-background-primary); color: var(--color-text-primary); cursor: pointer; }
.date-col { font-size: 12px; color: var(--color-text-secondary); white-space: nowrap; }
.email-col { font-size: 12px; color: var(--color-text-secondary); }
.center { text-align: center; }
.list-emoji { margin-right: 6px; }
.actions-col { display: flex; gap: 6px; align-items: center; }
.badge { font-size: 11px; padding: 3px 10px; border-radius: 20px; white-space: nowrap; }
.badge-public { background: #E1F5EE; color: #085041; }
.badge-private { background: var(--color-background-secondary); color: var(--color-text-secondary); }
.btn { padding: 7px 14px; border-radius: var(--border-radius-md); font-size: 13px; cursor: pointer; border: 0.5px solid var(--color-border-secondary); background: transparent; color: var(--color-text-primary); text-decoration: none; display: inline-flex; align-items: center; gap: 6px; transition: background 0.1s; }
.btn:hover { background: var(--color-background-secondary); }
.btn-outline { border-color: var(--color-border-secondary); }
.btn-danger { background: #E24B4A; border-color: #E24B4A; color: white; }
.btn-danger:hover { background: #c43938; }
.btn-icon { background: none; border: none; cursor: pointer; font-size: 16px; padding: 4px 6px; border-radius: 4px; transition: background 0.1s; }
.btn-icon:hover { background: var(--color-background-secondary); }
.btn-icon.danger:hover { background: #FCEBEB; }
.btn-icon:disabled { opacity: 0.3; cursor: not-allowed; }
.loading { text-align: center; padding: 2rem; color: var(--color-text-secondary); }
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 100; }
.modal { background: var(--color-background-primary); border-radius: var(--border-radius-lg); padding: 1.5rem; width: 90%; max-width: 360px; }
.modal p { font-size: 14px; margin-bottom: 1rem; line-height: 1.5; }
.modal-actions { display: flex; gap: 8px; }
@media (max-width: 600px) { .stats-row { grid-template-columns: repeat(2, 1fr); } }
  `]
})
export class AdminComponent implements OnInit {
  auth = inject(AuthService);
  private adminService = inject(AdminService);

  activeTab: Tab = 'users';
  searchQuery = '';

  users: AppUser[] = [];
  allLists: GradingList[] = [];
  loadingUsers = true;
  loadingLists = true;

  confirmMsg = '';
  private confirmAction?: () => Promise<void>;

  get filteredUsers() {
    const q = this.searchQuery.toLowerCase();
    return this.users.filter(u =>
      u.email.toLowerCase().includes(q) || u.role.includes(q)
    );
  }

  get filteredLists() {
    const q = this.searchQuery.toLowerCase();
    return this.allLists.filter(l =>
      l.title.toLowerCase().includes(q) ||
      l.userEmail?.toLowerCase().includes(q)
    );
  }

  get publicCount() { return this.allLists.filter(l => l.isPublic).length; }
  get adminCount() { return this.users.filter(u => u.role === 'admin').length; }

  ngOnInit() {
    this.adminService.getUsers().subscribe(users => {
      this.users = users;
      this.loadingUsers = false;
    });
    this.loadAllLists();
  }

  async loadAllLists() {
    this.loadingLists = true;
    this.allLists = await this.adminService.getAllLists();
    this.loadingLists = false;
  }

  listCountForUser(uid: string) {
    return this.allLists.filter(l => l.userId === uid).length;
  }

  formatDate(date: any): string {
    if (!date) return '—';
    const d = date?.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('ro-RO');
  }

  async changeRole(user: AppUser, role: 'admin' | 'user') {
    await this.adminService.setUserRole(user.uid, role);
    user.role = role;
  }

  deleteUser(user: AppUser) {
    this.confirmMsg = `Ștergi utilizatorul ${user.email} și toate listele lui?`;
    this.confirmAction = async () => {
      await this.adminService.deleteUser(user.uid);
      this.users = this.users.filter(u => u.uid !== user.uid);
      this.allLists = this.allLists.filter(l => l.userId !== user.uid);
    };
  }

  deleteList(list: GradingList) {
    this.confirmMsg = `Ștergi lista "${list.title}" a utilizatorului ${list.userEmail}?`;
    this.confirmAction = async () => {
      await this.adminService.deleteList(list.userId, list.id);
      this.allLists = this.allLists.filter(l => l.id !== list.id);
    };
  }

  async togglePublic(list: GradingList) {
    await this.adminService.toggleListPublic(list.userId, list.id, !list.isPublic);
    list.isPublic = !list.isPublic;
  }

  async runConfirm() {
    if (this.confirmAction) await this.confirmAction();
    this.cancelConfirm();
  }

  cancelConfirm() {
    this.confirmMsg = '';
    this.confirmAction = undefined;
  }
}
