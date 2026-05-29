import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { ThemeService } from './core/theme/theme.service';
import { TranslateService } from './core/i18n/translate.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, NavbarComponent],
  template: `
    <app-navbar></app-navbar>
    <div class="page-wrapper">
      <router-outlet></router-outlet>
    </div>
  `
})
export class AppComponent implements OnInit {
  private theme = inject(ThemeService);
  private translate = inject(TranslateService);
  ngOnInit() {}
}