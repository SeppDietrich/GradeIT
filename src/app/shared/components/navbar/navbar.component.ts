import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { TranslateService, Lang } from '../../../core/i18n/translate.service';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { ThemeService } from '../../../core/theme/theme.service';
import { ExportService } from '../../../core/export/export.service';
import { GradingListService } from '../../../core/firestore/grading-list.service';
import { GradingList } from '../../../core/models';
import { Subscription, filter } from 'rxjs';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslatePipe],
  template: `
<nav class="navbar">
  <div class="nav-left">
    <a routerLink="/lists" class="nav-logo">📊 GradeIt</a>
  </div>

  <div class="nav-right">
    <ng-container *ngIf="auth.currentUser">

      <!-- My Lists dropdown -->
      <div class="dropdown" *ngIf="myLists.length > 0">
        <button class="nav-btn dropdown-trigger" (click)="toggleListsMenu($event)">
          {{ 'nav.myLists' | t }} <span class="chevron">{{ showListsMenu ? '▴' : '▾' }}</span>
        </button>
        <div class="dropdown-menu" *ngIf="showListsMenu">
          <div class="dropdown-header">{{ 'nav.myLists' | t }}</div>
          <a *ngFor="let list of myLists"
             class="dropdown-item"
             [routerLink]="['/editor', list.id]"
             (click)="showListsMenu = false">
            <span class="item-emoji">{{ list.emoji || '📋' }}</span>
            <span class="item-info">
              <span class="item-title">{{ list.title }}</span>
              <span class="item-meta">{{ (list.items || []).length }} elem.</span>
            </span>
            <button class="export-btn"
                    (click)="exportList($event, list)"
                    title="Export CSV">
              ⬇ CSV
            </button>
          </a>
          <div class="dropdown-divider"></div>
          <a routerLink="/editor" class="dropdown-item new-item" (click)="showListsMenu = false">
            + {{ 'nav.newList' | t }}
          </a>
        </div>
      </div>

      <!-- Buton simplu dacă nu are liste -->
      <a routerLink="/lists" class="nav-btn" *ngIf="myLists.length === 0">
        {{ 'nav.myLists' | t }}
      </a>

      <a routerLink="/admin" class="nav-btn admin-btn" *ngIf="auth.isAdmin">
        {{ 'nav.adminPanel' | t }}
      </a>
      <a routerLink="/explore" class="nav-btn">{{ 'nav.explore' | t }}</a>
      <a routerLink="/editor" class="nav-btn primary-btn">{{ 'nav.newList' | t }}</a>
    </ng-container>

    <!-- Selector limbă -->
    <div class="lang-selector">
      <button *ngFor="let lang of langs"
              class="lang-btn"
              [class.active]="translate.currentLang === lang"
              (click)="setLang(lang)">
        {{ langFlag(lang) }} {{ lang.toUpperCase() }}
      </button>
    </div>

    <!-- Toggle dark/light -->
    <button class="theme-toggle"
            (click)="theme.toggle()"
            [title]="theme.isDark ? ('theme.light' | t) : ('theme.dark' | t)">
      {{ theme.isDark ? '☀️' : '🌙' }}
    </button>

    <!-- Logout -->
    <button class="nav-btn logout-btn" *ngIf="auth.currentUser" (click)="logout()">
      {{ 'nav.logout' | t }}
    </button>
  </div>
</nav>

<!-- Overlay să închidă dropdown când dai click în altă parte -->
<div class="overlay" *ngIf="showListsMenu" (click)="showListsMenu = false"></div>
  `,
  styles: [`
.navbar { display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 1.5rem; background: var(--color-background-primary); border-bottom: 0.5px solid var(--color-border-tertiary); position: sticky; top: 0; z-index: 50; flex-wrap: wrap; gap: 10px; }
.nav-left { display: flex; align-items: center; gap: 10px; }
.nav-logo { font-size: 16px; font-weight: 500; text-decoration: none; color: var(--color-text-primary); }
.nav-right { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.nav-btn { padding: 6px 12px; border-radius: var(--border-radius-md); font-size: 13px; cursor: pointer; border: 0.5px solid var(--color-border-secondary); background: transparent; color: var(--color-text-primary); text-decoration: none; display: inline-flex; align-items: center; gap: 6px; transition: background 0.1s; }
.nav-btn:hover { background: var(--color-background-secondary); }
.primary-btn { background: #1D9E75; border-color: #1D9E75; color: #E1F5EE; }
.primary-btn:hover { background: #0F6E56; }
.admin-btn { background: #FFF3CD; border-color: #FFCD5A; color: #856404; }
.admin-btn:hover { background: #FFE69C; }
.logout-btn { color: var(--color-text-secondary); }
.chevron { font-size: 10px; }

/* Dropdown */
.dropdown { position: relative; }
.dropdown-trigger { gap: 6px; }
.dropdown-menu { position: absolute; top: calc(100% + 8px); left: 0; background: var(--color-background-primary); border: 0.5px solid var(--color-border-secondary); border-radius: var(--border-radius-lg); box-shadow: 0 8px 24px rgba(0,0,0,0.12); min-width: 260px; z-index: 100; overflow: hidden; }
.dropdown-header { font-size: 11px; font-weight: 500; color: var(--color-text-secondary); text-transform: uppercase; letter-spacing: 0.5px; padding: 10px 14px 6px; }
.dropdown-item { display: flex; align-items: center; gap: 10px; padding: 8px 14px; font-size: 13px; text-decoration: none; color: var(--color-text-primary); cursor: pointer; transition: background 0.1s; }
.dropdown-item:hover { background: var(--color-background-secondary); }
.item-emoji { font-size: 1.2rem; flex-shrink: 0; }
.item-info { flex: 1; display: flex; flex-direction: column; gap: 1px; overflow: hidden; }
.item-title { font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.item-meta { font-size: 11px; color: var(--color-text-secondary); }
.export-btn { font-size: 11px; padding: 3px 8px; border: 0.5px solid var(--color-border-secondary); border-radius: 4px; background: var(--color-background-secondary); color: var(--color-text-secondary); cursor: pointer; flex-shrink: 0; transition: all 0.1s; white-space: nowrap; }
.export-btn:hover { background: #1D9E75; border-color: #1D9E75; color: white; }
.dropdown-divider { height: 0.5px; background: var(--color-border-tertiary); margin: 4px 0; }
.new-item { color: #1D9E75; font-weight: 500; }

/* Lang selector */
.lang-selector { display: flex; gap: 2px; background: var(--color-background-secondary); border: 0.5px solid var(--color-border-tertiary); border-radius: var(--border-radius-md); padding: 2px; }
.lang-btn { padding: 3px 8px; font-size: 11px; font-weight: 500; border: none; background: transparent; color: var(--color-text-secondary); border-radius: 4px; cursor: pointer; transition: all 0.15s; white-space: nowrap; }
.lang-btn.active { background: var(--color-background-primary); color: var(--color-text-primary); box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
.lang-btn:hover:not(.active) { color: var(--color-text-primary); }

/* Theme toggle */
.theme-toggle { background: none; border: 0.5px solid var(--color-border-secondary); border-radius: var(--border-radius-md); padding: 5px 9px; font-size: 16px; cursor: pointer; transition: background 0.1s; }
.theme-toggle:hover { background: var(--color-background-secondary); }

/* Overlay */
.overlay { position: fixed; inset: 0; z-index: 49; }
  `]
})
export class NavbarComponent implements OnInit, OnDestroy {
  auth = inject(AuthService);
  translate = inject(TranslateService);
  theme = inject(ThemeService);
  private exportService = inject(ExportService);
  private listService = inject(GradingListService);
  private router = inject(Router);

  langs: Lang[] = ['ro', 'en', 'ru'];
  myLists: GradingList[] = [];
  showListsMenu = false;
  private subs: Subscription[] = [];

  ngOnInit() {
    // Încarcă listele când userul e autentificat
    const listSub = this.auth.user$.pipe(
      filter(user => user !== null && user !== undefined)
    ).subscribe(() => {
      this.listService.getMyLists().subscribe(lists => {
        this.myLists = lists.sort((a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
      });
    });

    // Închide dropdown-ul la navigare
    const routerSub = this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe(() => {
      this.showListsMenu = false;
    });

    this.subs.push(listSub, routerSub);
  }

  ngOnDestroy() {
    this.subs.forEach(s => s.unsubscribe());
  }

  toggleListsMenu(event: Event) {
    event.stopPropagation();
    this.showListsMenu = !this.showListsMenu;
  }

  exportList(event: Event, list: GradingList) {
    event.preventDefault();
    event.stopPropagation();
    this.exportService.exportCSV(list);
  }

  langFlag(lang: Lang) {
    return { ro: '🇷🇴', en: '🇬🇧', ru: '🇷🇺' }[lang];
  }

  async setLang(lang: Lang) {
    await this.translate.setLang(lang);
  }

  async logout() { await this.auth.logout(); }
}
