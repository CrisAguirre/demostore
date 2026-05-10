import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { SettingsService } from '@core/services/settings.service';

@Component({
  selector: 'app-login',
  template: `
    <div class="login-wrapper">
      <div class="login-card neon-card">
        <div class="login-header">
          <img *ngIf="settings.logoFullUrl; else defaultLogo" [src]="settings.logoFullUrl" alt="Logo" class="login-logo-img">
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
          <p class="toggle-view">¿No tienes cuenta? <a href="javascript:void(0)" (click)="toggleView()">Regístrate aquí</a></p>
          <button type="button" class="btn-outline btn-lg login-btn" (click)="onGuestLogin()" [disabled]="loading" style="margin-top: 1rem;">
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
          <p class="toggle-view">¿Ya tienes cuenta? <a href="javascript:void(0)" (click)="toggleView()">Inicia sesión</a></p>
        </form>

        <p class="login-footer">Powered by <strong>Agencia Deploy</strong></p>
      </div>
    </div>
  `,
  styles: [`
    .login-wrapper {
      min-height: 100vh; display: flex; align-items: center; justify-content: center;
      background: var(--bg-body);
      padding: 1rem;
    }
    .login-card {
      width: 100%; max-width: 400px; padding: 2.5rem 2rem;
      animation: fadeInUp 0.6s ease;
      background: var(--bg-card);
      border: 1px solid rgba(0,229,255,0.15);
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.2);
    }
    .login-header {
      text-align: center; margin-bottom: 2rem;
    }
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
  `]
})
export class LoginComponent implements OnInit {
  isLoginView = true;
  loginData = { email: '', password: '' };
  registerData = { name: '', email: '', phone: '', address: '', password: '' };
  
  loading = false;
  error = '';
  showPwd = false;

  constructor(private auth: AuthService, private router: Router, public settings: SettingsService) {
    if (this.auth.isLoggedIn) this.router.navigate(['/dashboard']);
  }

  ngOnInit(): void {
    this.settings.loadSettings();
  }

  toggleView(): void {
    this.isLoginView = !this.isLoginView;
    this.error = '';
  }

  onLogin(): void {
    this.loading = true;
    this.error = '';
    this.auth.login(this.loginData.email, this.loginData.password).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Error al iniciar sesión';
      }
    });
  }

  onRegister(): void {
    this.loading = true;
    this.error = '';
    this.auth.registerClient(this.registerData).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Error al registrar';
      }
    });
  }

  onGuestLogin(): void {
    this.loading = true;
    this.error = '';
    this.auth.loginGuest().subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/storefront']);
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Error al entrar como invitado';
      }
    });
  }
}
