import { Component, OnInit } from '@angular/core';
import { ApiService } from '@core/services/api.service';
import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-dashboard',
  template: `
    <div class="page-header">
      <h1>👋 Bienvenido, {{ authService.currentUser?.name?.split(' ')?.[0] || '' }}</h1>
    </div>

    <div class="grid-4 mb-3">
      <div class="stat-card">
        <div class="stat-icon" style="background:rgba(0,229,255,0.1)">💰</div>
        <div><div class="stat-value">\${{ todaySales | number:'1.0-0' }}</div><div class="stat-label">Ventas Hoy</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:rgba(124,77,255,0.1)">🧾</div>
        <div><div class="stat-value">{{ todayTransactions }}</div><div class="stat-label">Transacciones</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:rgba(0,230,118,0.1)">📦</div>
        <div><div class="stat-value">{{ totalProducts }}</div><div class="stat-label">Productos</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:rgba(255,23,68,0.1)">🔔</div>
        <div><div class="stat-value">{{ unreadAlerts }}</div><div class="stat-label">Alertas</div></div>
      </div>
    </div>

    <div class="grid-2">
      <div class="neon-card">
        <h3 style="margin-bottom:1rem">📈 Ventas de la semana</h3>
        <canvas *ngIf="salesChartData" baseChart
          [datasets]="salesChartData" [labels]="salesChartLabels"
          [options]="chartOptions" type="bar">
        </canvas>
        <p *ngIf="!salesChartData" style="color:var(--text-muted);text-align:center;padding:2rem">
          Cargando datos...
        </p>
      </div>
      <div class="neon-card-violet">
        <h3 style="margin-bottom:1rem">⭐ Productos Estrella</h3>
        <div *ngFor="let p of topProducts; let i = index" class="top-product-item">
          <span class="top-rank">{{ i + 1 }}</span>
          <span class="top-name">{{ p.name }}</span>
          <span class="badge badge-cyan">{{ p.totalQuantity }} uds</span>
        </div>
        <p *ngIf="topProducts.length === 0" style="color:var(--text-muted);text-align:center;padding:2rem">
          Sin datos aún
        </p>
      </div>
    </div>
  `,
  styles: [`
    .top-product-item {
      display: flex; align-items: center; gap: 0.75rem;
      padding: 0.6rem 0; border-bottom: 1px solid var(--bg-input);
    }
    .top-product-item:last-child { border-bottom: none; }
    .top-rank {
      width: 26px; height: 26px; border-radius: 50%;
      background: linear-gradient(135deg, var(--neon-cyan), var(--neon-violet));
      color: #fff; display: flex; align-items: center; justify-content: center;
      font-size: 0.75rem; font-weight: 700;
    }
    .top-name { flex: 1; font-size: 0.875rem; font-weight: 500; }
  `]
})
export class DashboardComponent implements OnInit {
  todaySales = 0;
  todayTransactions = 0;
  totalProducts = 0;
  unreadAlerts = 0;
  topProducts: any[] = [];
  salesChartData: any = null;
  salesChartLabels: string[] = [];
  chartOptions = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, grid: { color: 'rgba(0,229,255,0.05)' } },
      x: { grid: { display: false } }
    }
  };

  constructor(public authService: AuthService, private api: ApiService) {}

  ngOnInit(): void {
    this.loadStats();
  }

  loadStats(): void {
    this.api.getSalesSummary('day').subscribe({
      next: (res: any) => {
        this.todaySales = res.totalRevenue || 0;
        this.todayTransactions = res.totalTransactions || 0;
      }
    });

    this.api.getProducts({ limit: 1 }).subscribe({
      next: (res: any) => this.totalProducts = res.total || 0
    });

    this.api.getAlerts({ read: 'false' }).subscribe({
      next: (res: any) => this.unreadAlerts = res.unread || 0
    });

    this.api.getTopProducts(5).subscribe({
      next: (res: any) => this.topProducts = res || []
    });

    this.api.getSalesSummary('week').subscribe({
      next: (res: any) => {
        const days = res.salesByDay || [];
        this.salesChartLabels = days.map((d: any) => {
          const date = new Date(d._id);
          return date.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric' });
        });
        this.salesChartData = [{
          data: days.map((d: any) => d.total),
          backgroundColor: 'rgba(0,229,255,0.3)',
          borderColor: '#00E5FF',
          borderWidth: 2,
          borderRadius: 6
        }];
      }
    });
  }
}
