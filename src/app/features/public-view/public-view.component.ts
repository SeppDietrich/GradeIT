import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Firestore, collection, collectionData } from '@angular/fire/firestore';
import { AuthService } from '../../core/auth/auth.service';
import { GradingList } from '../../core/models';
import { filter, switchMap } from 'rxjs';

@Component({
  selector: 'app-public-view',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
<div>
  <h2 class="section-title">🌍 Liste publice</h2>

  <div *ngIf="loading" class="empty-state"><p>Se încarcă...</p></div>
  <div *ngIf="!loading && lists.length === 0" class="empty-state">
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
        <span *ngFor="let c of (list.criteria || [])" class="tag">{{ c.name }} {{ c.weight }}%</span>
      </div>
      <div class="podium" *ngIf="(list.items || []).length > 0">
        <span *ngFor="let item of topItems(list); let i = index" class="podium-item">
          {{ ['🥇','🥈','🥉'][i] }} {{ item.name }} — <strong>{{ item.overallScore | number:'1.1-2' }}</strong>
        </span>
      </div>
      <div *ngIf="(list.items || []).length === 0" class="no-items">Niciun element evaluat încă</div>
    </div>
  </div>
</div>
  `,
  styles: [`
.section-title { font-size: 15px; font-weight: 500; margin-bottom: 1rem; color: var(--color-text-secondary); }
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
.no-items { font-size: 12px; color: var(--color-text-secondary); border-top: 0.5px solid var(--color-border-tertiary); padding-top: 10px; }
.empty-state { text-align: center; padding: 3rem; color: var(--color-text-secondary); }
  `]
})
export class PublicViewComponent implements OnInit {
  private firestore = inject(Firestore);
  private auth = inject(AuthService);

  lists: GradingList[] = [];
  loading = true;

  ngOnInit() {
    // Apelăm collectionData în injection context (în constructor/ngOnInit cu inject())
    const publicRef = collection(this.firestore, 'publicLists');

    this.auth.user$.pipe(
      filter(user => user !== null && user !== undefined),
      switchMap(() => collectionData(publicRef, { idField: 'id' }))
    ).subscribe({
      next: (lists: any[]) => {
        // Normalizează datele — items și criteria pot lipsi în documente vechi
        this.lists = lists.map(l => ({
          ...l,
          items: l.items ?? [],
          criteria: l.criteria ?? [],
        }));
        this.loading = false;
      },
      error: err => {
        console.error('Public lists error:', err);
        this.loading = false;
      }
    });
  }

  topItems(list: GradingList) {
    return [...(list.items || [])].sort((a, b) => b.overallScore - a.overallScore).slice(0, 3);
  }
}