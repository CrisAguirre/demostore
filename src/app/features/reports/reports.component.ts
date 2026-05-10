import { Component, OnInit } from '@angular/core';
import { ApiService } from '@core/services/api.service';

@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss']
})
export class ReportsComponent implements OnInit {
  period = 'month';
  activeTab = 'ventas';
  summary: any = { totalRevenue: 0, totalTransactions: 0, averageTicket: 0, totalItems: 0, salesByDay: [] };
  topProducts: any[] = [];
  lowRotation: any[] = [];
  salesByCategory: any[] = [];
  salesByPayment: any[] = [];
  salesByHour: any[] = [];
  inventory: any = { totalProducts: 0, totalUnits: 0, totalCostValue: 0, totalSaleValue: 0, potentialProfit: 0, marginPercent: 0, lowStockCount: 0, outOfStockCount: 0, byCategory: [] };
  profitMargins: any[] = [];

  pieColors = ['#00E5FF', '#7C4DFF', '#00E676', '#FF9100', '#F50057', '#FFEA00', '#00B0FF', '#D500F9', '#76FF03', '#FF3D00'];

  constructor(private api: ApiService) {}
  ngOnInit(): void { this.loadAll(); }

  setPeriod(p: string) { this.period = p; this.loadAll(); }

  loadAll(): void {
    this.api.getSalesSummary(this.period).subscribe({ next: (r: any) => this.summary = r });
    this.api.getTopProducts(10).subscribe({ next: (r: any) => this.topProducts = r || [] });
    this.api.getLowRotation().subscribe({ next: (r: any) => this.lowRotation = r || [] });
    this.api.getSalesByCategory(this.period).subscribe({ next: (r: any) => this.salesByCategory = r || [] });
    this.api.getSalesByPayment(this.period).subscribe({ next: (r: any) => this.salesByPayment = r || [] });
    this.api.getSalesByHour(this.period).subscribe({ next: (r: any) => this.salesByHour = r || [] });
    this.api.getInventoryValuation().subscribe({ next: (r: any) => this.inventory = r });
    this.api.getProfitMargins().subscribe({ next: (r: any) => this.profitMargins = (r || []).slice(0, 15) });
  }

  // ── Pie chart helpers ──
  get categoryTotal(): number { return this.salesByCategory.reduce((s: number, c: any) => s + c.revenue, 0) || 1; }
  get paymentTotal(): number { return this.salesByPayment.reduce((s: number, c: any) => s + c.totalRevenue, 0) || 1; }

  piePath(items: any[], valueKey: string, total: number, index: number): string {
    let startAngle = 0;
    for (let i = 0; i < index; i++) {
      startAngle += (items[i][valueKey] / total) * 360;
    }
    const angle = (items[index][valueKey] / total) * 360;
    return this.describeArc(100, 100, 80, startAngle, startAngle + angle);
  }

  describeArc(x: number, y: number, r: number, startAngle: number, endAngle: number): string {
    if (endAngle - startAngle >= 359.99) {
      return `M ${x-r},${y} a ${r},${r} 0 1,1 ${r*2},0 a ${r},${r} 0 1,1 -${r*2},0`;
    }
    const s = this.polarToCart(x, y, r, startAngle);
    const e = this.polarToCart(x, y, r, endAngle);
    const large = endAngle - startAngle > 180 ? 1 : 0;
    return `M ${x},${y} L ${s.x},${s.y} A ${r},${r} 0 ${large},1 ${e.x},${e.y} Z`;
  }

  polarToCart(cx: number, cy: number, r: number, deg: number) {
    const rad = (deg - 90) * Math.PI / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }

  // ── Bar chart helpers ──
  get maxHourly(): number { return Math.max(...this.salesByHour.map((h: any) => h.count), 1); }
  get maxDailyRevenue(): number { return Math.max(...(this.summary.salesByDay || []).map((d: any) => d.total), 1); }

  paymentLabel(method: string): string {
    const map: any = { efectivo: '💵 Efectivo', transferencia: '📲 Transferencia', mixto: '🔄 Mixto' };
    return map[method] || method;
  }

  formatCurrency(n: number): string { return '$' + (n || 0).toLocaleString('es-CO', { maximumFractionDigits: 0 }); }
}
