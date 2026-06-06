import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ApiService } from './api.service';
import { Settings } from '../models/interfaces';

import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private settingsSubject = new BehaviorSubject<Settings | null>(null);
  public settings$ = this.settingsSubject.asObservable();

  constructor(private api: ApiService) { }

  loadSettings(): void {
    this.api.getSettings().subscribe({
      next: (settings: Settings) => {
        this.settingsSubject.next(settings);
        this.updateFavicon();
      },
      error: () => console.warn('No se pudieron cargar las configuraciones')
    });
  }

  private updateFavicon(): void {
    const favicon = document.getElementById('app-favicon') as HTMLLinkElement;
    if (favicon) {
      favicon.href = this.logoFullUrl;
    }
  }

  get settings(): Settings | null {
    return this.settingsSubject.value;
  }

  get storeName(): string {
    return this.settings?.storeName || 'Daily Mart';
  }

  get logoUrl(): string {
    return this.settings?.logoUrl || '/assets/logo.png';
  }

  get logoFullUrl(): string {
    const url = this.logoUrl;
    if (url.startsWith('http') || url.startsWith('/assets/')) {
      return url;
    }
    return environment.apiUrl.replace('/api', '') + url;
  }

  get whatsappNumber(): string {
    return this.settings?.whatsappNumber || '';
  }

  get whatsappLink(): string {
    const num = this.whatsappNumber;
    return num ? `https://wa.me/${num}` : '';
  }
}
