import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { GradingListService } from '../../core/firestore/grading-list.service';
import { Criterion, GradeItem, GradingList, calculateOverallScore } from '../../core/models';
import { v4 as uuidv4 } from 'uuid';

@Component({
  selector: 'app-grade-editor',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule],
  template: `
<div class="editor-page">
  <header class="page-header">
    <a routerLink="/lists" class="back-link">← Înapoi</a>
    <h1>{{ isEditing ? 'Editează lista' : 'Listă nouă de grading' }}</h1>
  </header>

  <form [formGroup]="form" (ngSubmit)="saveList()" class="editor-form">

    <!-- ── Informații de bază ── -->
    <section class="form-section">
      <h2>Detalii listă</h2>
      <div class="field-row">
        <div class="field field-sm">
          <label>Emoji</label>
          <input formControlName="emoji" placeholder="🍎" maxlength="2" />
        </div>
        <div class="field field-grow">
          <label>Titlu *</label>
          <input formControlName="title" placeholder="ex: Mere, Cafele, Laptopuri..." />
        </div>
      </div>
      <div class="field">
        <label>Descriere (opțional)</label>
        <textarea formControlName="description" rows="2" placeholder="Scopul acestei liste de grading..."></textarea>
      </div>
      <div class="field toggle-field">
        <label class="toggle-label">
          <span>Listă publică</span>
          <small>Oricine logat poate vedea această listă</small>
        </label>
        <label class="toggle-switch">
          <input type="checkbox" formControlName="isPublic" />
          <span class="slider"></span>
        </label>
      </div>
    </section>

    <!-- ── Criterii ── -->
    <section class="form-section">
      <div class="section-header">
        <h2>Criterii de evaluare</h2>
        <span class="weight-indicator" [class.valid]="totalWeight === 100" [class.invalid]="totalWeight !== 100">
          Total: {{ totalWeight }}% / 100%
        </span>
      </div>

      <div formArrayName="criteria" class="criteria-list">
        <div *ngFor="let c of criteriaArray.controls; let i = index"
             [formGroupName]="i" class="criterion-row">
          <input formControlName="name" placeholder="Criteriu..." class="criterion-name" />
          <div class="weight-input">
            <input formControlName="weight" type="number" min="1" max="100" />
            <span>%</span>
          </div>
          <button type="button" class="btn-icon" (click)="removeCriterion(i)" aria-label="Șterge criteriu">✕</button>
        </div>
      </div>

      <button type="button" class="btn btn-outline" (click)="addCriterion()">
        + Adaugă criteriu
      </button>
    </section>

    <!-- ── Elemente evaluate ── -->
    <section class="form-section" *ngIf="isEditing && currentList">
      <div class="section-header">
        <h2>Elemente evaluate</h2>
        <button type="button" class="btn btn-outline" (click)="openAddItemDialog()">
          + Adaugă element
        </button>
      </div>

      <div class="items-table-wrapper" *ngIf="currentList.items.length > 0; else noItems">
        <table class="items-table">
          <thead>
            <tr>
              <th>Nume</th>
              <th *ngFor="let c of currentList.criteria">{{ c.name }}</th>
              <th>Overall</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let item of currentList.items">
              <td class="item-name">{{ item.name }}</td>
              <td *ngFor="let c of currentList.criteria">
                <span class="score-badge" [class]="scoreClass(getScore(item, c.id))">
                  {{ getScore(item, c.id) }}/10
                </span>
              </td>
              <td class="overall-col">
                <strong [class]="overallClass(item.overallScore)">{{ item.overallScore | number:'1.1-2' }}</strong>
              </td>
              <td>
                <button type="button" class="btn-icon small" (click)="editItem(item)">✎</button>
                <button type="button" class="btn-icon small danger" (click)="deleteItem(item.id)">✕</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <ng-template #noItems>
        <p class="empty-hint">Niciun element adăugat încă. Salvează criteria și adaugă primul element.</p>
      </ng-template>
    </section>

    <!-- ── Acțiuni ── -->
    <div class="form-actions">
      <button type="submit" class="btn btn-primary" [disabled]="form.invalid || totalWeight !== 100 || isSaving">
        {{ isSaving ? 'Se salvează...' : (isEditing ? 'Salvează modificările' : 'Creează lista') }}
      </button>
      <a routerLink="/lists" class="btn btn-outline">Anulează</a>
    </div>

  </form>

  <!-- ── Dialog adăugare element ── -->
  <div class="modal-overlay" *ngIf="showItemDialog" (click)="closeItemDialog()">
    <div class="modal" (click)="$event.stopPropagation()">
      <h3>{{ editingItem ? 'Editează' : 'Adaugă' }} element</h3>
      <div class="field">
        <label>Nume element *</label>
        <input [(ngModel)]="itemForm.name" [ngModelOptions]="{standalone: true}" placeholder="ex: Fuji, Golden..." />
      </div>
      <div *ngFor="let c of currentList?.criteria" class="field">
        <label>{{ c.name }} (1–10)</label>
        <input type="range" min="1" max="10" step="1"
               [ngModel]="getItemFormScore(c.id)"
               (ngModelChange)="setItemFormScore(c.id, $event)"
               [ngModelOptions]="{standalone: true}" />
        <span class="range-val">{{ getItemFormScore(c.id) }}</span>
      </div>
      <div class="modal-actions">
        <button class="btn btn-primary" (click)="saveItem()">Salvează</button>
        <button class="btn btn-outline" (click)="closeItemDialog()">Anulează</button>
      </div>
    </div>
  </div>
</div>
  `,
  styles: [`
.editor-page { max-width: 700px; margin: 0 auto; padding: 1.5rem; }
.page-header { display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem; }
.page-header h1 { font-size: 1.3rem; font-weight: 500; }
.back-link { font-size: 13px; color: var(--color-text-secondary); text-decoration: none; }
.back-link:hover { color: var(--color-text-primary); }
.editor-form { display: flex; flex-direction: column; gap: 1.5rem; }
.form-section { background: var(--color-background-primary); border: 0.5px solid var(--color-border-tertiary); border-radius: var(--border-radius-lg); padding: 1.25rem; }
.form-section h2 { font-size: 14px; font-weight: 500; color: var(--color-text-secondary); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 1rem; }
.section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; }
.section-header h2 { margin-bottom: 0; }
.field { margin-bottom: 12px; }
.field label { display: block; font-size: 12px; color: var(--color-text-secondary); margin-bottom: 4px; }
.field input, .field textarea { width: 100%; padding: 8px 10px; border: 0.5px solid var(--color-border-secondary); border-radius: var(--border-radius-md); font-size: 14px; background: var(--color-background-primary); color: var(--color-text-primary); font-family: inherit; }
.field-row { display: flex; gap: 10px; }
.field-sm { width: 70px; flex-shrink: 0; }
.field-grow { flex: 1; }
.toggle-field { display: flex; align-items: center; justify-content: space-between; }
.toggle-label span { font-size: 14px; }
.toggle-label small { display: block; font-size: 12px; color: var(--color-text-secondary); }
.toggle-switch { position: relative; display: inline-block; width: 40px; height: 22px; }
.toggle-switch input { opacity: 0; width: 0; height: 0; }
.slider { position: absolute; inset: 0; background: red; border-radius: 22px; cursor: pointer; transition: background 0.2s; }
.slider::before { content: ''; position: absolute; width: 18px; height: 18px; border-radius: 50%; background: white; left: 2px; top: 2px; transition: transform 0.2s; }
.toggle-switch input:checked + .slider { background: #1D9E75; }
.toggle-switch input:checked + .slider::before { transform: translateX(18px); }
.weight-indicator { font-size: 13px; padding: 3px 10px; border-radius: 20px; }
.weight-indicator.valid { background: #E1F5EE; color: #085041; }
.weight-indicator.invalid { background: #FCEBEB; color: #501313; }
.criteria-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 10px; }
.criterion-row { display: flex; align-items: center; gap: 8px; }
.criterion-name { flex: 1; padding: 7px 10px; border: 0.5px solid var(--color-border-tertiary); border-radius: var(--border-radius-md); font-size: 14px; background: var(--color-background-primary); color: var(--color-text-primary); }
.weight-input { display: flex; align-items: center; gap: 4px; }
.weight-input input { width: 56px; padding: 7px 8px; border: 0.5px solid var(--color-border-tertiary); border-radius: var(--border-radius-md); font-size: 14px; text-align: center; background: var(--color-background-primary); color: var(--color-text-primary); }
.weight-input span { font-size: 13px; color: var(--color-text-secondary); }
.btn { padding: 7px 14px; border-radius: var(--border-radius-md); font-size: 13px; cursor: pointer; border: 0.5px solid var(--color-border-secondary); background: transparent; color: var(--color-text-primary); display: inline-flex; align-items: center; gap: 6px; transition: background 0.1s; text-decoration: none; }
.btn:hover { background: var(--color-background-secondary); }
.btn-primary { background: #1D9E75; border-color: #1D9E75; color: #E1F5EE; }
.btn-primary:hover { background: #0F6E56; }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-icon { background: none; border: none; cursor: pointer; font-size: 14px; color: var(--color-text-secondary); padding: 4px 6px; border-radius: 4px; }
.btn-icon:hover { background: var(--color-background-secondary); }
.btn-icon.small { font-size: 12px; }
.btn-icon.danger:hover { color: #E24B4A; }
.items-table-wrapper { overflow-x: auto; }
.items-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.items-table th { text-align: left; font-size: 11px; color: var(--color-text-secondary); text-transform: uppercase; letter-spacing: 0.5px; padding: 6px 8px; border-bottom: 0.5px solid var(--color-border-tertiary); white-space: nowrap; }
.items-table td { padding: 8px; border-bottom: 0.5px solid var(--color-border-tertiary); }
.item-name { font-weight: 500; }
.overall-col { font-size: 15px; }
.score-badge { display: inline-flex; align-items: center; justify-content: center; width: 30px; height: 30px; border-radius: 50%; font-size: 12px; font-weight: 500; }
.score-badge.high { background: #E1F5EE; color: #085041; }
.score-badge.mid { background: #FAEEDA; color: #633806; }
.score-badge.low { background: #FCEBEB; color: #501313; }
.color-high { color: #1D9E75; }
.color-mid { color: #BA7517; }
.color-low { color: #E24B4A; }
.form-actions { display: flex; gap: 10px; }
.empty-hint { font-size: 13px; color: var(--color-text-secondary); text-align: center; padding: 1.5rem; }
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 100; }
.modal { background: var(--color-background-primary); border-radius: var(--border-radius-lg); padding: 1.5rem; width: 90%; max-width: 420px; }
.modal h3 { font-size: 15px; font-weight: 500; margin-bottom: 1rem; }
.modal-actions { display: flex; gap: 8px; margin-top: 1rem; }
.range-val { font-size: 13px; font-weight: 500; color: #1D9E75; min-width: 20px; }
  `]
})
export class GradeEditorComponent implements OnInit {
  private fb = inject(FormBuilder);
  private service = inject(GradingListService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  form!: FormGroup;
  isEditing = false;
  isSaving = false;
  listId?: string;
  currentList?: GradingList;
  showItemDialog = false;
  editingItem?: GradeItem;
  itemForm: { name: string; scores: Record<string, number> } = { name: '', scores: {} };

  get criteriaArray() { return this.form.get('criteria') as FormArray; }
  get totalWeight(): number {
    return this.criteriaArray.controls.reduce((s, c) => s + (+(c.get('weight')?.value) || 0), 0);
  }

  ngOnInit() {
    this.buildForm();
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditing = true;
      this.listId = id;
      this.service.getList(id).subscribe(list => {
        this.currentList = list;
        this.patchForm(list);
      });
    }
  }

  private buildForm() {
    this.form = this.fb.group({
      emoji: [''],
      title: ['', Validators.required],
      description: [''],
      isPublic: [false],
      criteria: this.fb.array([this.newCriterionGroup()])
    });
  }

  private newCriterionGroup(name = '', weight = 50): FormGroup {
    return this.fb.group({
      id: [uuidv4()],
      name: [name, Validators.required],
      weight: [weight, [Validators.required, Validators.min(1), Validators.max(100)]]
    });
  }

  private patchForm(list: GradingList) {
    this.form.patchValue({ emoji: list.emoji, title: list.title, description: list.description, isPublic: list.isPublic });
    this.criteriaArray.clear();
    list.criteria.forEach(c => this.criteriaArray.push(this.fb.group({ id: [c.id], name: [c.name, Validators.required], weight: [c.weight] })));
  }

  addCriterion() { this.criteriaArray.push(this.newCriterionGroup()); }
  removeCriterion(i: number) { if (this.criteriaArray.length > 1) this.criteriaArray.removeAt(i); }

  async saveList() {
    if (this.form.invalid || this.totalWeight !== 100) return;
    this.isSaving = true;
    const v = this.form.value;
    const criteria: Criterion[] = v.criteria.map((c: any) => ({ id: c.id || uuidv4(), name: c.name, weight: +c.weight }));
    try {
      if (this.isEditing && this.listId) {
        await this.service.updateList(this.listId, { emoji: v.emoji, title: v.title, description: v.description, isPublic: v.isPublic, criteria });
      } else {
        const id = await this.service.createList({ emoji: v.emoji, title: v.title, description: v.description, isPublic: v.isPublic, criteria, items: [] });
        this.router.navigate(['/editor', id]);
        return;
      }
    } finally { this.isSaving = false; }
  }

  openAddItemDialog() {
    this.editingItem = undefined;
    this.itemForm = { name: '', scores: {} };
    this.currentList?.criteria.forEach(c => this.itemForm.scores[c.id] = 5);
    this.showItemDialog = true;
  }

  editItem(item: GradeItem) {
    this.editingItem = item;
    this.itemForm = { name: item.name, scores: {} };
    item.scores.forEach(s => this.itemForm.scores[s.criterionId] = s.score);
    this.showItemDialog = true;
  }

  closeItemDialog() { this.showItemDialog = false; }

  async saveItem() {
    if (!this.currentList || !this.listId || !this.itemForm.name.trim()) return;
    const item: GradeItem = {
      id: this.editingItem?.id || uuidv4(),
      name: this.itemForm.name.trim(),
      scores: Object.entries(this.itemForm.scores).map(([criterionId, score]) => ({ criterionId, score })),
      overallScore: 0
    };
    item.overallScore = calculateOverallScore(item.scores, this.currentList.criteria);
    await this.service.addOrUpdateItem(this.listId, this.currentList, item);
    this.closeItemDialog();
  }

  async deleteItem(itemId: string) {
    if (!this.currentList || !this.listId) return;
    await this.service.removeItem(this.listId, this.currentList, itemId);
  }

  getScore(item: GradeItem, criterionId: string): number {
    return item.scores.find(s => s.criterionId === criterionId)?.score ?? 0;
  }

  getItemFormScore(cId: string): number { return this.itemForm.scores[cId] ?? 5; }
  setItemFormScore(cId: string, v: number) { this.itemForm.scores[cId] = +v; }

  scoreClass(s: number) { return s >= 8 ? 'high' : s >= 6 ? 'mid' : 'low'; }
  overallClass(s: number) { return s >= 8 ? 'color-high' : s >= 6 ? 'color-mid' : 'color-low'; }
}
