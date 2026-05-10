import { Component, OnInit, OnDestroy } from '@angular/core';
import { AuthService } from './core/services/auth.service';
import { SettingsService } from './core/services/settings.service';

@Component({
  selector: 'app-root',
  template: `
    <ng-container *ngIf="auth.isLoggedIn; else loginView">
      <app-navbar></app-navbar>
      <div class="app-layout">
        <app-sidebar></app-sidebar>
        <main class="app-content">
          <router-outlet></router-outlet>
        </main>
      </div>
    </ng-container>
    <ng-template #loginView>
      <router-outlet></router-outlet>
    </ng-template>

    <!-- Floating Animated Button -->
    <a *ngIf="settings.whatsappNumber" [href]="settings.whatsappLink" target="_blank"
       class="floating-wa" [class.show-logo]="showStoreLogo" title="Contáctanos">
      <!-- WhatsApp Icon -->
      <svg class="fab-icon wa-icon" viewBox="0 0 24 24" fill="white">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
      </svg>
      <!-- Store Logo -->
      <img src="assets/logow.png" alt="Logo" class="fab-icon store-icon">
    </a>
  `,
  styles: [`
    .app-layout { display: flex; min-height: calc(100vh - 60px); }
    .app-content { flex: 1; padding: 1.5rem; overflow-x: hidden; animation: fadeIn 0.3s ease; }
    
    .floating-wa {
      position: fixed; bottom: 30px; right: 30px; z-index: 1000;
      background: #25D366; width: 52px; height: 52px;
      border-radius: 50%; display: flex; justify-content: center; align-items: center;
      box-shadow: 0 4px 15px rgba(37,211,102,0.4);
      transition: transform 0.3s ease, background 0.6s ease;
      overflow: hidden;
    }
    .floating-wa:hover { transform: scale(1.1); box-shadow: 0 6px 20px rgba(37,211,102,0.6); }

    /* Both icons stacked */
    .fab-icon {
      position: absolute;
      transition: opacity 0.5s ease, transform 0.5s ease;
    }
    .wa-icon { width: 36px; height: 36px; opacity: 1; transform: translateX(0); }
    .store-icon {
      width: 36px; height: 36px; border-radius: 50%; object-fit: cover;
      opacity: 0; transform: translateX(20px);
    }

    /* When showing the store logo */
    .floating-wa.show-logo {
      background: linear-gradient(135deg, var(--neon-cyan), var(--neon-violet));
      box-shadow: 0 4px 15px rgba(0,229,255,0.4);
    }
    .floating-wa.show-logo .wa-icon { opacity: 0; transform: translateX(-20px); }
    .floating-wa.show-logo .store-icon { opacity: 1; transform: translateX(0); }

    @media (max-width: 768px) {
      .app-content { padding: 1rem; width: 100%; min-width: 0; }
      .floating-wa { bottom: 20px; right: 20px; width: 44px; height: 44px; }
      .wa-icon, .store-icon { width: 30px; height: 30px; }
    }
    @media (max-width: 480px) {
      .app-content { padding: 0.5rem; width: 100%; min-width: 0; }
    }
  `]
})
export class AppComponent implements OnInit, OnDestroy {
  showStoreLogo = false;
  private intervalId: any;

  constructor(public auth: AuthService, public settings: SettingsService) {}
  
  ngOnInit() {
    this.settings.loadSettings();
    this.intervalId = setInterval(() => {
      this.showStoreLogo = !this.showStoreLogo;
    }, 10000);
  }

  ngOnDestroy() {
    if (this.intervalId) clearInterval(this.intervalId);
  }
}
