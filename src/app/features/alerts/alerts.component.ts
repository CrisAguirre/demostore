import { Component, OnInit } from '@angular/core';
import { ApiService } from '@core/services/api.service';

@Component({
  selector: 'app-alerts',
  template: `
    <div class="page-header">
      <h1>🔔 Alertas <span class="badge badge-red" *ngIf="unread > 0">{{ unread }}</span></h1>
      <div style="display:flex;gap:0.5rem">
        <button class="btn-outline btn-sm" (click)="checkStock()">🔄 Verificar Stock</button>
        <button class="btn-primary btn-sm" (click)="markAllRead()" *ngIf="unread > 0">✅ Marcar todas leídas</button>
      </div>
    </div>
    <div *ngFor="let a of alerts" class="neon-card mb-2" [style.opacity]="a.read ? 0.6 : 1"
         style="animation:none;display:flex;align-items:center;gap:1rem;padding:1rem">
      <span style="font-size:1.5rem">{{ a.type === 'sin_stock' ? '🚨' : a.type === 'stock_bajo' ? '⚠️' : '🐌' }}</span>
      <div style="flex:1">
        <strong>{{ a.message }}</strong>
        <div style="font-size:0.75rem;color:var(--text-muted)">{{ a.createdAt | date:'medium' }}</div>
      </div>
      <span [class]="'badge badge-' + (a.priority === 'alta' ? 'red' : a.priority === 'media' ? 'orange' : 'cyan')">{{ a.priority }}</span>
      <button class="btn-ghost btn-sm" *ngIf="!a.read" (click)="markRead(a._id)">✓</button>
    </div>
    <p *ngIf="alerts.length === 0" style="text-align:center;padding:3rem;color:var(--text-muted)">No hay alertas 🎉</p>
  `
})
export class AlertsComponent implements OnInit {
  alerts: any[] = [];
  unread = 0;
  constructor(private api: ApiService) {}
  ngOnInit(): void { this.loadAlerts(); }
  loadAlerts(): void {
    this.api.getAlerts().subscribe({ next: (r: any) => { this.alerts = r.alerts || []; this.unread = r.unread || 0; } });
  }
  markRead(id: string): void { this.api.markAlertRead(id).subscribe({ next: () => this.loadAlerts() }); }
  markAllRead(): void { this.api.markAllAlertsRead().subscribe({ next: () => this.loadAlerts() }); }
  checkStock(): void { this.api.checkStockAlerts().subscribe({ next: () => this.loadAlerts() }); }
}
