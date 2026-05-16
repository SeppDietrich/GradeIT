import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Firestore, doc, docData } from '@angular/fire/firestore';
import { GradingList } from '../../core/models';

@Component({
  selector: 'app-list-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
<div class="page">
  <header class="page-header">
    <a routerLink="/explore" class="back-link">← Înapoi la liste publice</a>
  </header>

  <div *ngIf="list" class="detail-content">
    <div class="list-title">
      <span class="emoji">{{ list.emoji || '📋' }}</span>
      <h1>{{ list.title }}</h1>
    </div>
    <p class="author">Creat de {{ list.userEmail }}</p>
    <p class="description" *ngIf="list.description">{{ list.description }}</p>

    <div class="criteria-section">
      <h2>Criterii</h2>
      <div class="criteria-pills">
        <span *ngFor="let c of list.criteria" class="pill">{{ c.name }} <strong>{{ c.weight }}%</strong></span>
      </div>
    </div>

    <div class="items-section">
      <h2>Clasament</h2>
      <table class="items-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Nume</th>
            <th *ngFor="let c of list.criteria">{{ c.name }}</th>
            <th>Overall</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let item of sortedItems(); let i = index">
            <td class="rank">{{ i + 1 }}</td>
            <td class="item-name">{{ item.name }}</td>
            <td *ngFor="let c of list.criteria">
              <span class="score-chip" [class]="scoreClass(getScore(item, c.id))">
                {{ getScore(item, c.id) }}
              </span>
            </td>
            <td><strong [class]="overallClass(item.overallScore)">{{ item.overallScore | number:'1.1-2' }}</strong></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <div *ngIf="!list" class="loading">Se încarcă...</div>
</div>
  `,
  styles: [`
.page { max-width: 800px; margin: 0 auto; padding: 1.5rem; }
.page-header { margin-bottom: 1.5rem; }
.back-link { font-size: 13px; color: var(--color-text-secondary); text-decoration: none; }
.back-link:hover { color: var(--color-text-primary); }
.list-title { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; }
.emoji { font-size: 2rem; }
h1 { font-size: 1.5rem; font-weight: 500; }
.author { font-size: 13px; color: var(--color-text-secondary); margin-bottom: 8px; }
.description { font-size: 14px; color: var(--color-text-secondary); margin-bottom: 1.5rem; }
h2 { font-size: 14px; font-weight: 500; color: var(--color-text-secondary); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px; margin-top: 1.5rem; }
.criteria-pills { display: flex; flex-wrap: wrap; gap: 8px; }
.pill { font-size: 13px; background: var(--color-background-secondary); border-radius: 20px; padding: 4px 12px; }
.items-table { width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 0.5rem; }
.items-table th { text-align: left; font-size: 11px; color: var(--color-text-secondary); text-transform: uppercase; letter-spacing: 0.5px; padding: 6px 8px; border-bottom: 0.5px solid var(--color-border-tertiary); }
.items-table td { padding: 10px 8px; border-bottom: 0.5px solid var(--color-border-tertiary); }
.rank { color: var(--color-text-secondary); font-weight: 500; }
.item-name { font-weight: 500; }
.score-chip { display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; border-radius: 50%; font-size: 12px; font-weight: 500; }
.high { background: #E1F5EE; color: #085041; }
.mid { background: #FAEEDA; color: #633806; }
.low { background: #FCEBEB; color: #501313; }
.color-high { color: #1D9E75; }
.color-mid { color: #BA7517; }
.color-low { color: #E24B4A; }
.loading { text-align: center; padding: 3rem; color: var(--color-text-secondary); }
  `]
})
export class ListDetailComponent implements OnInit {
  private firestore = inject(Firestore);
  private route = inject(ActivatedRoute);
  list?: GradingList;

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    const ref = doc(this.firestore, `publicLists/${id}`);
    (docData(ref, { idField: 'id' }) as any).subscribe((list: GradingList) => {
      this.list = list;
    });
  }

  sortedItems() {
    if (!this.list) return [];
    return [...this.list.items].sort((a, b) => b.overallScore - a.overallScore);
  }

  getScore(item: any, criterionId: string): number {
    return item.scores.find((s: any) => s.criterionId === criterionId)?.score ?? 0;
  }

  scoreClass(s: number) { return s >= 8 ? 'high' : s >= 6 ? 'mid' : 'low'; }
  overallClass(s: number) { return s >= 8 ? 'color-high' : s >= 6 ? 'color-mid' : 'color-low'; }
}
