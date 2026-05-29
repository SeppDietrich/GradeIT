import { Pipe, PipeTransform, inject, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { TranslateService } from './translate.service';
import { Subscription } from 'rxjs';

@Pipe({ name: 't', standalone: true, pure: false })
export class TranslatePipe implements PipeTransform, OnDestroy {
  private translateService = inject(TranslateService);
  private cd = inject(ChangeDetectorRef);
  private sub: Subscription;
  private lastValue = '';

  constructor() {
    // Re-render la schimbarea limbii
    this.sub = this.translateService.lang$.subscribe(() => {
      this.cd.markForCheck();
    });
  }

  transform(key: string, params?: Record<string, string>): string {
    this.lastValue = this.translateService.t(key, params);
    return this.lastValue;
  }

  ngOnDestroy() { this.sub.unsubscribe(); }
}
