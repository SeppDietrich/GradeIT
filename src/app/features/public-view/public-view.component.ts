import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { GradingListService } from '../../core/firestore/grading-list.service';
import { GradingList } from '../../core/models';

@Component({
  selector: 'app-public-view',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
<div class="page">
  <header class="page-header">
    <a routerLink="/lists" class="back-link">← Înapoi</a>
    <h1>🌍 Liste publice</h1>
  </header>

  <div *ngIf="lists.length === 0 && !loading" class="empty-state">
    <p>Nicio listă publică momentan.</p>
  </div>

  <div class="lists-stack">
    <div *ngFor="let list of lists" class="public-card" [routerLink]="['/list', list.id]">
      <div class="card-header">
        <div class="title-row">
          <span class="emoji">{{ list.emoji || '📋' }}</span>
          <strong>{{ list.title }}</strong>
        </div>
        <span class="author">de {{ list.userEmail }}</span>
      </div>
      <div class="criteria-tags">
        <span *ngFor="let c of list.criteria" class="tag">{{ c.name }} {{ c.weight }}%</span>
      </div>
      <div class="podium" *ngIf="list.items.length > 0">
        <span *ngFor="let item of topItems(list); let i = index" class="podium-item">
          {{ ['🥇','🥈','🥉'][i] }} {{ item.name }} — <strong>{{ item.overallScore | number:'1.1-2' }}</strong>
        </span>
      </div>
    </div>
  </div>
</div>
  `,
  styles: [`
.page { max-width: 700px; margin: 0 auto; padding: 1.5rem; }
.page-header { display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem; }
.page-header h1 { font-size: 1.3rem; font-weight: 500; }
.back-link { font-size: 13px; color: var(--color-text-secondary); text-decoration: none; }
.back-link:hover { color: var(--color-text-primary); }
.lists-stack { display: flex; flex-direction: column; gap: 10px; }
.public-card { background: var(--color-background-primary); border: 0.5px solid var(--color-border-tertiary); border-radius: var(--border-radius-lg); padding: 1.25rem; cursor: pointer; transition: border-color 0.15s; }
.public-card:hover { border-color: #1D9E75; }
.card-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 10px; }
.title-row { display: flex; align-items: center; gap: 8px; font-size: 15px; }
.emoji { font-size: 1.3rem; }
.author { font-size: 12px; color: var(--color-text-secondary); }
.criteria-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 10px; }
.tag { font-size: 11px; background: var(--color-background-secondary); border-radius: 20px; padding: 2px 10px; color: var(--color-text-secondary); }
.podium { display: flex; gap: 12px; flex-wrap: wrap; border-top: 0.5px solid var(--color-border-tertiary); padding-top: 10px; font-size: 13px; }
.podium-item strong { color: #1D9E75; }
.empty-state { text-align: center; padding: 3rem; color: var(--color-text-secondary); }
  `]
})
export class PublicViewComponent implements OnInit {
  private service = inject(GradingListService);
  lists: GradingList[] = [];
  loading = true;

  ngOnInit() {
    this.service.getPublicLists().subscribe(lists => {
      this.lists = lists;
      this.loading = false;
    });
  }

  topItems(list: GradingList) {
    return [...list.items].sort((a, b) => b.overallScore - a.overallScore).slice(0, 3);
  }
}
