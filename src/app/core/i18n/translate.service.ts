import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type Lang = 'ro' | 'en' | 'ru';

@Injectable({ providedIn: 'root' })
export class TranslateService {
  private translations: Record<string, any> = {};
  private langSubject = new BehaviorSubject<Lang>(this.getSavedLang());
  lang$ = this.langSubject.asObservable();

  get currentLang(): Lang { return this.langSubject.value; }

  constructor() {
    this.loadLang(this.currentLang);
  }

  private getSavedLang(): Lang {
    return (localStorage.getItem('gradeit_lang') as Lang) || 'ro';
  }

  async setLang(lang: Lang): Promise<void> {
    localStorage.setItem('gradeit_lang', lang);
    await this.loadLang(lang);
    this.langSubject.next(lang);
  }

  private async loadLang(lang: Lang): Promise<void> {
    try {
      const response = await fetch(`/assets/i18n/${lang}.json`);
      this.translations = await response.json();
    } catch {
      console.error(`Failed to load language: ${lang}`);
    }
  }

  // Obține traducerea după cheie punctată: t('nav.myLists')
  t(key: string, params?: Record<string, string>): string {
    const keys = key.split('.');
    let value: any = this.translations;
    for (const k of keys) {
      value = value?.[k];
      if (value === undefined) return key;
    }
    let result = String(value);
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        result = result.replace(`{${k}}`, v);
      });
    }
    return result;
  }
}
