import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { GradingListService } from '../../core/firestore/grading-list.service';
import { AuthService } from '../../core/auth/auth.service';
import { GradingList } from '../../core/models';

@Component({
  selector: 'app-grading-lists',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
<div class="page">
  <header class="page-header">
    <div class="header-left">
      <h1>📊 GradeIt</h1>
      <span class="user-pill">{{ auth.currentUser?.email }}</span>
    </div>
    <div class="header-right">
      <a routerLink="/explore" class="btn btn-outline">🌍 Explorează</a>
      <a routerLink="/editor" class="btn btn-primary">+ Listă nouă</a>
      <button class="btn btn-outline" (click)="logout()">Ieși</button>
    </div>
  </header>

  <main class="main-content">
    <h2>Listele mele</h2>

    <div *ngIf="lists.length === 0 && !loading" class="empty-state">
      <p>Nu ai nicio listă încă.</p>
      <a routerLink="/editor" class="btn btn-primary" style="display:inline-flex;margin-top:1rem">+ Creează prima listă</a>
    </div>

    <div class="lists-grid" *ngIf="lists.length > 0">
      <div *ngFor="let list of lists" class="list-card" [routerLink]="['/editor', list.id]">
        <div class="card-top">
          <span class="emoji">{{ list.emoji || '📋' }}</span>
          <span class="badge" [class.badge-public]="list.isPublic" [class.badge-private]="!list.isPublic">
            {{ list.isPublic ? '🌍 Public' : '🔒 Privat' }}
          </span>
        </div>
        <h3 class="card-title">{{ list.title }}</h3>
        <p class="card-meta">{{ list.criteria.length }} criterii · {{ list.items.length }} elemente</p>
        <div class="top-item" *ngIf="topItem(list) as top">
          🏆 {{ top.name }} — <strong>{{ top.overallScore | number:'1.1-2' }}</strong>
        </div>
      </div>
    </div>
  </main>
</div>
  `,
  styles: [`
.page { max-width: 900px; margin: 0 auto; padding: 1.5rem; }
.page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 2rem; flex-wrap: wrap; gap: 10px; }
.header-left { display: flex; align-items: center; gap: 12px; }
.header-left h1 { font-size: 1.4rem; font-weight: 500; }
.header-right { display: flex; gap: 8px; align-items: center; }
.user-pill { font-size: 12px; color: var(--color-text-secondary); background: var(--color-background-secondary); border: 0.5px solid var(--color-border-tertiary); border-radius: 20px; padding: 3px 10px; }
.btn { padding: 7px 14px; border-radius: var(--border-radius-md); font-size: 13px; cursor: pointer; border: 0.5px solid var(--color-border-secondary); background: transparent; color: var(--color-text-primary); text-decoration: none; display: inline-flex; align-items: center; gap: 6px; transition: background 0.1s; }
.btn:hover { background: var(--color-background-secondary); }
.btn-primary { background: #1D9E75; border-color: #1D9E75; color: #E1F5EE; }
.btn-primary:hover { background: #0F6E56; }
h2 { font-size: 15px; font-weight: 500; margin-bottom: 1rem; color: var(--color-text-secondary); }
.lists-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px; }
.list-card { background: var(--color-background-primary); border: 0.5px solid var(--color-border-tertiary); border-radius: var(--border-radius-lg); padding: 1.25rem; cursor: pointer; transition: border-color 0.15s, transform 0.1s; }
.list-card:hover { border-color: #1D9E75; transform: translateY(-1px); }
.card-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
.emoji { font-size: 1.5rem; }
.badge { font-size: 11px; padding: 2px 8px; border-radius: 20px; }
.badge-public { background: #E1F5EE; color: #085041; }
.badge-private { background: var(--color-background-secondary); color: var(--color-text-secondary); }
.card-title { font-size: 15px; font-weight: 500; margin-bottom: 4px; }
.card-meta { font-size: 12px; color: var(--color-text-secondary); margin-bottom: 8px; }
.top-item { font-size: 12px; color: var(--color-text-secondary); border-top: 0.5px solid var(--color-border-tertiary); padding-top: 8px; }
.empty-state { text-align: center; padding: 3rem; color: var(--color-text-secondary); }
  `]
})
export class GradingListsComponent implements OnInit {
  auth = inject(AuthService);
  private service = inject(GradingListService);

  lists: GradingList[] = [];
  loading = true;

  ngOnInit() {
    this.service.getMyLists().subscribe(lists => {
      this.lists = lists.sort((a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
      this.loading = false;
    });
  }

  topItem(list: GradingList) {
    if (!list.items.length) return null;
    return [...list.items].sort((a, b) => b.overallScore - a.overallScore)[0];
  }

  async logout() {
    await this.auth.logout();
  }
}
