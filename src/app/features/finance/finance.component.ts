import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../core/services/api.service';
import { FinancialSummary, MonthlyPL } from '../../core/models/interfaces';

@Component({
  selector: 'app-finance',
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1 class="page-title">🧠 Centro de Inteligencia Financiera</h1>
          <p class="page-subtitle">Estado financiero, P&amp;L y flujo de caja</p>
        </div>
        <div class="period-selector">
          <button *ngFor="let p of periods" class="btn-period"
            [class.active]="period === p.value" (click)="setPeriod(p.value)">
            {{ p.label }}
          </button>
        </div>
      </div>

      <div *ngIf="loading" class="loading-state">Calculando estado financiero...</div>

      <ng-container *ngIf="!loading && summary">

        <!-- P&L Cards -->
        <div class="pl-grid">
          <div class="pl-card income">
            <div class="pl-icon">💰</div>
            <div class="pl-info">
              <span class="pl-label">Ingresos por Ventas</span>
              <span class="pl-value">{{ summary.totalRevenue | currency:'COP':'symbol-narrow':'1.0-0' }}</span>
              <span class="pl-sub">{{ summary.salesCount }} transacciones</span>
            </div>
          </div>
          <div class="pl-card cost">
            <div class="pl-icon">📦</div>
            <div class="pl-info">
              <span class="pl-label">Costo de Ventas (COGS)</span>
              <span class="pl-value">{{ summary.cogs | currency:'COP':'symbol-narrow':'1.0-0' }}</span>
              <span class="pl-sub">Costo directo de mercancía</span>
            </div>
          </div>
          <div class="pl-card gross" [class.positive]="summary.grossProfit>=0" [class.negative]="summary.grossProfit<0">
            <div class="pl-icon">📊</div>
            <div class="pl-info">
              <span class="pl-label">Utilidad Bruta</span>
              <span class="pl-value">{{ summary.grossProfit | currency:'COP':'symbol-narrow':'1.0-0' }}</span>
              <span class="pl-sub">Margen {{ summary.grossMargin }}%</span>
            </div>
          </div>
          <div class="pl-card purchase">
            <div class="pl-icon">🛍️</div>
            <div class="pl-info">
              <span class="pl-label">Compras a Proveedores</span>
              <span class="pl-value">{{ summary.totalPurchases | currency:'COP':'symbol-narrow':'1.0-0' }}</span>
              <span class="pl-sub">{{ summary.purchasesCount }} órdenes</span>
            </div>
          </div>
          <div class="pl-card expense">
            <div class="pl-icon">💸</div>
            <div class="pl-info">
              <span class="pl-label">Gastos Operativos</span>
              <span class="pl-value">{{ summary.totalExpenses | currency:'COP':'symbol-narrow':'1.0-0' }}</span>
              <span class="pl-sub">Arriendo, servicios, nómina...</span>
            </div>
          </div>
          <div class="pl-card net" [class.positive]="summary.netProfit>=0" [class.negative]="summary.netProfit<0">
            <div class="pl-icon">{{ summary.netProfit >= 0 ? '🟢' : '🔴' }}</div>
            <div class="pl-info">
              <span class="pl-label">Utilidad Neta</span>
              <span class="pl-value net-value">{{ summary.netProfit | currency:'COP':'symbol-narrow':'1.0-0' }}</span>
              <span class="pl-sub">Margen neto {{ summary.netMargin }}%</span>
            </div>
          </div>
        </div>

        <!-- Expense Breakdown -->
        <div class="section-row">
          <div class="card breakdown-card">
            <h3 class="section-title">Desglose de Gastos Operativos</h3>
            <div *ngIf="expenseCategories.length === 0" class="empty-state">Sin gastos registrados en este período</div>
            <div class="expense-item" *ngFor="let cat of expenseCategories">
              <div class="expense-info">
                <span class="expense-name">{{ getCatLabel(cat.key) }}</span>
                <span class="expense-amount">{{ cat.value | currency:'COP':'symbol-narrow':'1.0-0' }}</span>
              </div>
              <div class="expense-bar-bg">
                <div class="expense-bar" [style.width.%]="cat.pct"></div>
              </div>
            </div>
          </div>

          <!-- Cuenta de resultados resumen -->
          <div class="card pl-statement">
            <h3 class="section-title">Estado de Resultados</h3>
            <table class="pl-table">
              <tbody>
                <tr class="income-row"><td>Ventas netas</td><td>{{ summary.totalRevenue | currency:'COP':'symbol-narrow':'1.0-0' }}</td></tr>
                <tr class="cost-row"><td>(−) Costo de ventas</td><td>{{ summary.cogs | currency:'COP':'symbol-narrow':'1.0-0' }}</td></tr>
                <tr class="subtotal-row"><td><strong>= Utilidad Bruta</strong></td><td><strong>{{ summary.grossProfit | currency:'COP':'symbol-narrow':'1.0-0' }}</strong></td></tr>
                <tr><td colspan="2"><hr class="divider"/></td></tr>
                <tr class="expense-row"><td>(−) Gastos operativos</td><td>{{ summary.totalExpenses | currency:'COP':'symbol-narrow':'1.0-0' }}</td></tr>
                <tr class="subtotal-row"><td><strong>= Utilidad Operacional</strong></td><td><strong>{{ summary.operatingProfit | currency:'COP':'symbol-narrow':'1.0-0' }}</strong></td></tr>
                <tr><td colspan="2"><hr class="divider"/></td></tr>
                <tr class="net-row"><td><strong>UTILIDAD NETA</strong></td>
                  <td><strong [class.positive-text]="summary.netProfit>=0" [class.negative-text]="summary.netProfit<0">
                    {{ summary.netProfit | currency:'COP':'symbol-narrow':'1.0-0' }}
                  </strong></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Monthly trend (last 6 months P&L) -->
        <div class="card" *ngIf="monthlyPL.length > 0">
          <h3 class="section-title">Tendencia Mensual — Últimos {{ monthlyPL.length }} meses</h3>
          <div class="monthly-grid">
            <div class="month-col" *ngFor="let m of monthlyPL">
              <div class="month-label">{{ m.label }}</div>
              <div class="bar-group">
                <div class="bar-wrap" title="Ingresos">
                  <div class="bar bar-income" [style.height.px]="barH(m.revenue)"></div>
                </div>
                <div class="bar-wrap" title="Gastos">
                  <div class="bar bar-expense" [style.height.px]="barH(m.expenses + m.purchases)"></div>
                </div>
              </div>
              <div class="month-profit" [class.positive-text]="m.profit>=0" [class.negative-text]="m.profit<0">
                {{ m.profit | currency:'COP':'symbol-narrow':'1.0-0' }}
              </div>
            </div>
          </div>
          <div class="legend">
            <span class="legend-item income-dot">■ Ingresos</span>
            <span class="legend-item expense-dot">■ Gastos + Compras</span>
          </div>
        </div>

      </ng-container>
    </div>
  `,
  styles: [`
    .period-selector { display:flex; gap:.4rem; }
    .btn-period { padding:.4rem .9rem; border-radius:6px; border:1px solid var(--border); background:transparent; color:var(--text-secondary); cursor:pointer; font-size:.8rem; transition:all .15s; }
    .btn-period.active { background:var(--neon-cyan); color:#000; border-color:var(--neon-cyan); font-weight:700; }

    .pl-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:1rem; margin-bottom:1.5rem; }
    @media(max-width:768px){ .pl-grid { grid-template-columns:1fr 1fr; } }
    .pl-card { display:flex; gap:1rem; align-items:flex-start; padding:1.2rem; border-radius:12px; border:1px solid var(--border); background:var(--bg-card); }
    .pl-icon { font-size:1.8rem; }
    .pl-info { display:flex; flex-direction:column; }
    .pl-label { font-size:.75rem; color:var(--text-secondary); margin-bottom:.3rem; }
    .pl-value { font-size:1.15rem; font-weight:700; color:var(--text-primary); }
    .pl-sub { font-size:.72rem; color:var(--text-muted,var(--text-secondary)); margin-top:.2rem; }
    .pl-card.income  { border-color:rgba(0,229,255,.25); }
    .pl-card.gross.positive  { border-color:rgba(0,200,100,.3); }
    .pl-card.gross.negative  { border-color:rgba(255,80,80,.3); }
    .pl-card.net.positive  { border-color:rgba(0,200,100,.4); background:rgba(0,200,100,.05); }
    .pl-card.net.negative  { border-color:rgba(255,80,80,.4); background:rgba(255,80,80,.05); }
    .pl-card.expense { border-color:rgba(255,200,0,.25); }
    .pl-card.purchase{ border-color:rgba(150,100,255,.25); }
    .net-value { font-size:1.3rem !important; }

    .section-row { display:grid; grid-template-columns:1fr 1fr; gap:1rem; margin-bottom:1.5rem; }
    @media(max-width:768px){ .section-row { grid-template-columns:1fr; } }

    .expense-item { margin-bottom:.8rem; }
    .expense-info { display:flex; justify-content:space-between; margin-bottom:.3rem; font-size:.85rem; }
    .expense-name { color:var(--text-secondary); }
    .expense-amount { font-weight:600; color:var(--text-primary); }
    .expense-bar-bg { background:rgba(255,255,255,.06); border-radius:4px; height:6px; }
    .expense-bar { background:linear-gradient(90deg,#ff9800,#ff5722); height:6px; border-radius:4px; transition:width .3s; }

    .pl-table { width:100%; border-collapse:collapse; font-size:.88rem; }
    .pl-table td { padding:.45rem .2rem; }
    .pl-table td:last-child { text-align:right; }
    .income-row td { color:#4caf50; }
    .cost-row td, .expense-row td { color:#ff7043; }
    .subtotal-row td { border-top:1px solid var(--border); }
    .net-row td { font-size:1rem; padding-top:.75rem; }
    .divider { border:none; border-top:1px dashed var(--border); margin:.2rem 0; }
    .positive-text { color:#4caf50 !important; }
    .negative-text { color:#f44336 !important; }

    .monthly-grid { display:flex; gap:1rem; align-items:flex-end; padding:1rem 0; overflow-x:auto; }
    .month-col { display:flex; flex-direction:column; align-items:center; min-width:70px; }
    .month-label { font-size:.75rem; color:var(--text-secondary); margin-bottom:.5rem; }
    .bar-group { display:flex; gap:4px; align-items:flex-end; height:100px; }
    .bar-wrap { display:flex; align-items:flex-end; }
    .bar { width:18px; border-radius:3px 3px 0 0; min-height:4px; transition:height .3s; }
    .bar-income  { background:var(--neon-cyan,#00e5ff); }
    .bar-expense { background:#ff7043; }
    .month-profit { font-size:.72rem; font-weight:600; margin-top:.4rem; }
    .legend { display:flex; gap:1.5rem; justify-content:center; margin-top:.5rem; font-size:.78rem; }
    .income-dot { color:var(--neon-cyan,#00e5ff); }
    .expense-dot { color:#ff7043; }
  `]
})
export class FinanceComponent implements OnInit {
  summary: FinancialSummary | null = null;
  monthlyPL: MonthlyPL[] = [];
  loading = false;
  period = 'month';
  expenseCategories: { key: string; value: number; pct: number }[] = [];

  periods = [
    { value: 'day', label: 'Hoy' },
    { value: 'week', label: 'Semana' },
    { value: 'month', label: 'Mes' },
    { value: 'year', label: 'Año' }
  ];

  private catLabels: Record<string, string> = {
    arriendo: 'Arriendo', servicios_publicos: 'Servicios Públicos', nomina: 'Nómina',
    mantenimiento_reparaciones: 'Mantenimiento', insumos_aseo: 'Insumos Aseo',
    papeleria_oficina: 'Papelería', transporte_logistica: 'Transporte',
    publicidad_marketing: 'Publicidad', impuestos_tasas: 'Impuestos', otros: 'Otros'
  };

  maxMonthly = 1;

  constructor(private api: ApiService) {}

  ngOnInit() { this.loadAll(); }

  setPeriod(p: string) { this.period = p; this.loadAll(); }

  loadAll() {
    this.loading = true;
    this.api.getFinancialSummary(this.period).subscribe({
      next: (data: FinancialSummary) => {
        this.summary = data;
        this.buildExpenseBreakdown(data.expenseByCategory);
        this.loading = false;
      },
      error: () => this.loading = false
    });
    this.api.getMonthlyPL(6).subscribe((data: MonthlyPL[]) => {
      this.monthlyPL = data;
      this.maxMonthly = Math.max(...data.map(m => Math.max(m.revenue, m.expenses + m.purchases)), 1);
    });
  }

  buildExpenseBreakdown(map: Record<string, number>) {
    const max = Math.max(...Object.values(map), 1);
    this.expenseCategories = Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .map(([key, value]) => ({ key, value, pct: Math.round(value / max * 100) }));
  }

  getCatLabel(k: string) { return this.catLabels[k] || k; }

  barH(v: number) { return Math.round((v / this.maxMonthly) * 90); }
}
