import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type Theme = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private themeSubject = new BehaviorSubject<Theme>(this.getSavedTheme());
  theme$ = this.themeSubject.asObservable();

  get currentTheme(): Theme { return this.themeSubject.value; }
  get isDark(): boolean { return this.currentTheme === 'dark'; }

  constructor() {
    this.applyTheme(this.currentTheme);
  }

  toggle(): void {
    this.setTheme(this.isDark ? 'light' : 'dark');
  }

  setTheme(theme: Theme): void {
    localStorage.setItem('gradeit_theme', theme);
    this.themeSubject.next(theme);
    this.applyTheme(theme);
  }

  private getSavedTheme(): Theme {
    const saved = localStorage.getItem('gradeit_theme') as Theme;
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  private applyTheme(theme: Theme): void {
    document.documentElement.setAttribute('data-theme', theme);
  }
}
