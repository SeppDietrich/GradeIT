import { Component, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/auth/auth.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TranslatePipe],
  template: `
<div class="home-page">
  <div class="hero">
    <h1>📊 GradeIt</h1>
    <p class="subtitle">{{ 'home.subtitle' | t }}</p>
  </div>

  <div class="auth-card">
    <div *ngIf="!showEmail">
      <button class="btn btn-google" (click)="loginGoogle()">
        <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/><path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/><path fill="#FBBC05" d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"/><path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 6.293C4.672 4.166 6.656 3.58 9 3.58z"/></svg>
        {{ 'home.continueGoogle' | t }}
      </button>
      <div class="divider"><span>{{ 'home.or' | t }}</span></div>
      <button class="btn btn-outline" (click)="showEmail = true">{{ 'home.continueEmail' | t }}</button>
    </div>

    <div *ngIf="showEmail">
      <div class="field">
        <label>{{ 'home.email' | t }}</label>
        <input type="email" [(ngModel)]="email" placeholder="adresa@email.com" />
      </div>
      <div class="field">
        <label>{{ 'home.password' | t }}</label>
        <input type="password" [(ngModel)]="password" placeholder="minim 6 caractere" />
      </div>
      <div class="error-msg" *ngIf="errorMsg">{{ errorMsg }}</div>
      <div class="btn-group">
        <button class="btn btn-primary" (click)="loginEmail()">{{ 'home.login' | t }}</button>
        <button class="btn btn-outline" (click)="registerEmail()">{{ 'home.register' | t }}</button>
      </div>
      <button class="btn-link" (click)="showEmail = false">{{ 'home.back' | t }}</button>
    </div>
  </div>
</div>
  `,
  styles: [`
.home-page { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 70vh; }
.hero { text-align: center; margin-bottom: 2rem; }
.hero h1 { font-size: 2.5rem; font-weight: 500; margin-bottom: 0.5rem; }
.subtitle { color: var(--color-text-secondary); line-height: 1.6; max-width: 360px; }
.auth-card { background: var(--color-background-primary); border: 0.5px solid var(--color-border-tertiary); border-radius: var(--border-radius-lg); padding: 2rem; width: 100%; max-width: 360px; }
.btn { width: 100%; padding: 10px 16px; border-radius: var(--border-radius-md); font-size: 14px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; border: 0.5px solid var(--color-border-secondary); background: transparent; color: var(--color-text-primary); margin-bottom: 10px; transition: background 0.1s; }
.btn:hover { background: var(--color-background-secondary); }
.btn-primary { background: #1D9E75; border-color: #1D9E75; color: #E1F5EE; }
.btn-primary:hover { background: #0F6E56; }
.divider { display: flex; align-items: center; gap: 10px; margin: 12px 0; color: var(--color-text-secondary); font-size: 13px; }
.divider::before, .divider::after { content: ''; flex: 1; height: 0.5px; background: var(--color-border-tertiary); }
.field { margin-bottom: 12px; }
.field label { display: block; font-size: 12px; color: var(--color-text-secondary); margin-bottom: 4px; }
.field input { width: 100%; padding: 8px 10px; }
.btn-group { display: flex; gap: 8px; }
.btn-group .btn { margin-bottom: 0; }
.btn-link { background: none; border: none; color: var(--color-text-secondary); font-size: 13px; cursor: pointer; margin-top: 10px; padding: 0; }
.error-msg { color: #E24B4A; font-size: 13px; margin-bottom: 10px; }
  `]
})
export class HomeComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  showEmail = false;
  email = '';
  password = '';
  errorMsg = '';

  async loginGoogle() {
    try { await this.auth.loginWithGoogle(); }
    catch (e: any) { this.errorMsg = e.message; }
  }

  async loginEmail() {
    try { await this.auth.loginWithEmail(this.email, this.password); }
    catch { this.errorMsg = 'Email sau parolă incorectă.'; }
  }

  async registerEmail() {
    try { await this.auth.registerWithEmail(this.email, this.password); }
    catch (e: any) { this.errorMsg = e.message; }
  }
}
