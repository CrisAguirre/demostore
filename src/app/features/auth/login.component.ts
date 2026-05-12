/**
 * login.component.ts  (modified — preload overlay con logo de la tienda)
 *
 * Cambios vs original:
 *  - Se agrega un overlay full-screen que aparece mientras loading === true.
 *  - El overlay muestra el logo de la tienda con anillo neon giratorio.
 *  - Dos fases de mensaje: "Verificando..." → "Preparando tu tienda..."
 *    (el cambio ocurre cuando el auth responde y arranca el preload).
 */

import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { SettingsService } from '@core/services/settings.service';

@Component({
  selector: 'app-login',
  template: `
    <!-- ══════════════════════════════════════════
         PRELOAD OVERLAY — aparece mientras loading
         ══════════════════════════════════════════ -->
    <div class="preload-overlay" *ngIf="loading">
      <div class="overlay-content">

        <!-- Anillo neon + logo -->
        <div class="logo-ring-wrapper">
          <div class="ring-track">
            <div class="ring-spin"></div>
          </div>
          <div class="logo-inner">
            <img *ngIf="settings.logoFullUrl; else emojiLogo"
                 [src]="settings.logoFullUrl"
                 alt="Logo"
                 class="overlay-logo-img">
            <ng-template #emojiLogo>
              <span class="overlay-logo-emoji">🏪</span>
            </ng-template>
          </div>
        </div>

        <!-- Nombre de la tienda -->
        <h2 class="overlay-store-name">{{ settings.storeName }}</h2>

        <!-- Mensaje con fase dinámica -->
        <p class="overlay-msg">
          {{ preloading ? 'Preparando tu tienda' : 'Verificando credenciales' }}<span class="dots"></span>
        </p>

        <!-- Barra de progreso infinita -->
        <div class="progress-bar"><div class="progress-fill"></div></div>

      </div>
    </div>

    <!-- ══════════════════════════════════════════
         FORMULARIO (igual que antes)
         ══════════════════════════════════════════ -->
    <div class="login-wrapper">
      <div class="login-card neon-card">
        <div class="login-header">
          <img *ngIf="settings.logoFullUrl; else defaultLogo"
               [src]="settings.logoFullUrl" alt="Logo" class="login-logo-img">
          <ng-template #defaultLogo><div class="login-logo">🏪</div></ng-template>
          <h1>{{ settings.storeName }}</h1>
          <p>{{ isLoginView ? 'Ingresa a tu cuenta' : 'Crea una cuenta nueva' }}</p>
        </div>

        <form *ngIf="isLoginView" (ngSubmit)="onLogin()" class="login-form">
          <div class="form-group">
            <label class="form-label">Correo electrónico</label>
            <input class="form-input" type="email" [(ngModel)]="loginData.email" name="email"
                   placeholder="correo@ejemplo.com" required autocomplete="email">
          </div>
          <div class="form-group">
            <label class="form-label">Contraseña</label>
            <input class="form-input" [type]="showPwd ? 'text' : 'password'"
                   [(ngModel)]="loginData.password" name="password" placeholder="••••••••" required>
            <button type="button" class="pwd-toggle" (click)="showPwd = !showPwd">
              {{ showPwd ? '🙈' : '👁️' }}
            </button>
          </div>
          <p class="error-msg" *ngIf="error">{{ error }}</p>
          <button type="submit" class="btn-primary btn-lg login-btn" [disabled]="loading">
            {{ loading ? '⏳ Ingresando...' : '🔐 Ingresar' }}
          </button>
          <p class="toggle-view">¿No tienes cuenta?
            <a href="javascript:void(0)" (click)="toggleView()">Regístrate aquí</a>
          </p>
          <button type="button" class="btn-outline btn-lg login-btn"
                  (click)="onGuestLogin()" [disabled]="loading" style="margin-top:1rem">
            👤 Entrar como Invitado
          </button>
        </form>

        <form *ngIf="!isLoginView" (ngSubmit)="onRegister()" class="login-form">
          <div class="form-group">
            <label class="form-label">Nombre Completo</label>
            <input class="form-input" type="text" [(ngModel)]="registerData.name" name="name" required>
          </div>
          <div class="form-group">
            <label class="form-label">Correo electrónico</label>
            <input class="form-input" type="email" [(ngModel)]="registerData.email" name="email" required>
          </div>
          <div class="form-group">
            <label class="form-label">Celular</label>
            <input class="form-input" type="text" [(ngModel)]="registerData.phone" name="phone" required>
          </div>
          <div class="form-group">
            <label class="form-label">Dirección</label>
            <input class="form-input" type="text" [(ngModel)]="registerData.address" name="address" required>
          </div>
          <div class="form-group">
            <label class="form-label">Contraseña</label>
            <input class="form-input" [type]="showPwd ? 'text' : 'password'"
                   [(ngModel)]="registerData.password" name="password" required>
            <button type="button" class="pwd-toggle" (click)="showPwd = !showPwd">
              {{ showPwd ? '🙈' : '👁️' }}
            </button>
          </div>
          <p class="error-msg" *ngIf="error">{{ error }}</p>
          <button type="submit" class="btn-primary btn-lg login-btn" [disabled]="loading">
            {{ loading ? '⏳ Registrando...' : '📝 Crear cuenta' }}
          </button>
          <p class="toggle-view">¿Ya tienes cuenta?
            <a href="javascript:void(0)" (click)="toggleView()">Inicia sesión</a>
          </p>
        </form>

        <p class="login-footer">Powered by <strong>Agencia Deploy</strong></p>
      </div>
    </div>
  `,
  styles: [`
    /* ── Formulario (sin cambios) ─────────────────── */
    .login-wrapper {
      min-height: 100vh; display: flex; align-items: center; justify-content: center;
      background: var(--bg-body); padding: 1rem;
    }
    .login-card {
      width: 100%; max-width: 400px; padding: 2.5rem 2rem;
      animation: fadeInUp 0.6s ease;
      background: var(--bg-card);
      border: 1px solid rgba(0,229,255,0.15);
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.2);
    }
    .login-header { text-align: center; margin-bottom: 2rem; }
    .login-logo { font-size: 3rem; margin-bottom: 0.5rem; }
    .login-logo-img { display: block; max-height: 60px; margin: 0 auto 1rem; border-radius: 8px; }
    .login-header h1 {
      font-family: 'Outfit', sans-serif; font-size: 1.5rem;
      background: linear-gradient(135deg, var(--neon-cyan), var(--neon-violet));
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    }
    .login-header p { color: var(--text-secondary); font-size: 0.85rem; margin-top: 0.25rem; }
    .login-form { display: flex; flex-direction: column; }
    .form-group { position: relative; margin-bottom: 1rem; }
    .pwd-toggle {
      position: absolute; right: 10px; top: 32px;
      background: none; border: none; cursor: pointer; font-size: 1rem;
    }
    .error-msg {
      color: var(--neon-red); font-size: 0.8rem; text-align: center;
      margin-bottom: 0.5rem; animation: fadeIn 0.3s;
    }
    .login-btn { width: 100%; margin-top: 0.5rem; }
    .toggle-view {
      text-align: center; font-size: 0.85rem; margin-top: 1rem; color: var(--text-primary);
    }
    .toggle-view a { color: var(--neon-cyan); text-decoration: none; font-weight: 600; }
    .login-footer {
      text-align: center; margin-top: 1.5rem;
      font-size: 0.75rem; color: var(--text-muted);
    }

    /* ── Overlay ──────────────────────────────────── */
    .preload-overlay {
      position: fixed; inset: 0; z-index: 9999;
      background: var(--bg-primary, #0F111A);
      display: flex; align-items: center; justify-content: center;
      animation: fadeIn 0.25s ease;
    }

    /* Subtle radial glow behind the logo */
    .preload-overlay::before {
      content: '';
      position: absolute;
      width: 400px; height: 400px;
      border-radius: 50%;
      background: radial-gradient(
        circle,
        rgba(0,229,255,0.07) 0%,
        rgba(124,77,255,0.05) 40%,
        transparent 70%
      );
      animation: pulse-glow 3s ease-in-out infinite;
    }

    .overlay-content {
      display: flex; flex-direction: column; align-items: center; gap: 1.25rem;
      position: relative; z-index: 1;
    }

    /* ── Anillo giratorio ─────────────────────────── */
    .logo-ring-wrapper {
      position: relative;
      width: 120px; height: 120px;
    }

    /* Track del anillo — conic-gradient que rota */
    .ring-track {
      position: absolute; inset: 0;
      border-radius: 50%;
    }

    .ring-spin {
      position: absolute; inset: 0;
      border-radius: 50%;
      background: conic-gradient(
        from 0deg,
        transparent 0deg,
        #00E5FF 90deg,
        #7C4DFF 180deg,
        transparent 260deg
      );
      animation: ring-rotate 1.6s linear infinite;
    }

    /* Máscara interior para dejar solo el borde */
    .logo-inner {
      position: absolute;
      inset: 5px; /* grosor del anillo */
      border-radius: 50%;
      background: var(--bg-primary, #0F111A);
      display: flex; align-items: center; justify-content: center;
      overflow: hidden;
    }

    .overlay-logo-img {
      width: 72px; height: 72px;
      object-fit: contain; border-radius: 50%;
      /* Suave pulso de brillo */
      animation: logo-pulse 2.4s ease-in-out infinite;
    }

    .overlay-logo-emoji {
      font-size: 3rem;
      animation: logo-pulse 2.4s ease-in-out infinite;
    }

    /* ── Textos ───────────────────────────────────── */
    .overlay-store-name {
      font-family: 'Outfit', sans-serif;
      font-size: 1.4rem; font-weight: 700;
      background: linear-gradient(135deg, var(--neon-cyan), var(--neon-violet));
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
      letter-spacing: 0.5px;
    }

    .overlay-msg {
      color: var(--text-secondary, #9CA3AF);
      font-size: 0.9rem; font-weight: 500;
      display: flex; align-items: baseline; gap: 2px;
    }

    /* Tres puntitos animados */
    .dots::after {
      content: '';
      animation: dot-cycle 1.5s steps(4, end) infinite;
    }
    @keyframes dot-cycle {
      0%   { content: ''; }
      25%  { content: '.'; }
      50%  { content: '..'; }
      75%  { content: '...'; }
      100% { content: ''; }
    }

    /* ── Barra de progreso ────────────────────────── */
    .progress-bar {
      width: 200px; height: 3px;
      background: rgba(255,255,255,0.08);
      border-radius: 999px;
      overflow: hidden;
      margin-top: 0.5rem;
    }

    .progress-fill {
      height: 100%;
      width: 40%;
      border-radius: 999px;
      background: linear-gradient(90deg, var(--neon-cyan), var(--neon-violet));
      animation: progress-slide 1.6s ease-in-out infinite;
      box-shadow: 0 0 8px rgba(0,229,255,0.6);
    }

    /* ── Keyframes ────────────────────────────────── */
    @keyframes ring-rotate {
      from { transform: rotate(0deg); }
      to   { transform: rotate(360deg); }
    }

    @keyframes logo-pulse {
      0%, 100% { filter: drop-shadow(0 0 6px rgba(0,229,255,0.4)); }
      50%       { filter: drop-shadow(0 0 16px rgba(124,77,255,0.6)); }
    }

    @keyframes pulse-glow {
      0%, 100% { transform: scale(1); opacity: 0.6; }
      50%       { transform: scale(1.15); opacity: 1; }
    }

    @keyframes progress-slide {
      0%   { transform: translateX(-150%); }
      50%  { transform: translateX(100%); }
      100% { transform: translateX(350%); }
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to   { opacity: 1; }
    }

    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(20px); }
      to   { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class LoginComponent implements OnInit, OnDestroy {
  isLoginView = true;
  loginData    = { email: '', password: '' };
  registerData = { name: '', email: '', phone: '', address: '', password: '' };

  loading    = false;  // true desde que se envía el form hasta que navega
  preloading = false;  // true después de auth OK → indica que arrancó el preload
  error      = '';
  showPwd    = false;

  private phaseTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private auth: AuthService,
    private router: Router,
    public settings: SettingsService
  ) {
    if (this.auth.isLoggedIn) this.router.navigate(['/dashboard']);
  }

  ngOnInit(): void {
    this.settings.loadSettings();
  }

  ngOnDestroy(): void {
    if (this.phaseTimer) clearTimeout(this.phaseTimer);
  }

  toggleView(): void {
    this.isLoginView = !this.isLoginView;
    this.error = '';
  }

  // ── Fase del overlay ─────────────────────────────────────────────────────
  /**
   * Cambia el mensaje del overlay a "Preparando tu tienda" después de un
   * tiempo estimado para que el auth HTTP responda (~800 ms en servidor cálido).
   * Si el auth tarda más, igual cambia — es solo cosmético.
   */
  private startPhaseTimer(): void {
    this.phaseTimer = setTimeout(() => {
      this.preloading = true;
    }, 900);
  }

  private resetOverlay(): void {
    this.loading    = false;
    this.preloading = false;
    if (this.phaseTimer) { clearTimeout(this.phaseTimer); this.phaseTimer = null; }
  }

  // ── Login ─────────────────────────────────────────────────────────────────
  onLogin(): void {
    this.loading = true;
    this.error   = '';
    this.startPhaseTimer();

    this.auth.login(this.loginData.email, this.loginData.password).subscribe({
      next: () => {
        this.resetOverlay();
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.resetOverlay();
        this.error = err.error?.message || 'Error al iniciar sesión';
      }
    });
  }

  onRegister(): void {
    this.loading = true;
    this.error   = '';
    this.startPhaseTimer();

    this.auth.registerClient(this.registerData).subscribe({
      next: () => {
        this.resetOverlay();
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.resetOverlay();
        this.error = err.error?.message || 'Error al registrar';
      }
    });
  }

  onGuestLogin(): void {
    this.loading = true;
    this.error   = '';
    this.startPhaseTimer();

    this.auth.loginGuest().subscribe({
      next: () => {
        this.resetOverlay();
        this.router.navigate(['/storefront']);
      },
      error: (err) => {
        this.resetOverlay();
        this.error = err.error?.message || 'Error al entrar como invitado';
      }
    });
  }
}
