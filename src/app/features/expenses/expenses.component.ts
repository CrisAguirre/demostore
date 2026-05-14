import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../core/services/api.service';
import { Expense, ExpenseCategoryOption, Supplier } from '../../core/models/interfaces';

@Component({
  selector: 'app-expenses',
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1 class="page-title">💸 Gastos Operativos</h1>
          <p class="page-subtitle">Arriendo, servicios, reparaciones, insumos y más</p>
        </div>
        <button class="btn-primary" (click)="openForm()">+ Registrar Gasto</button>
      </div>

      <!-- KPIs rápidos -->
      <div class="kpi-row" *ngIf="!loading">
        <div class="kpi-card">
          <span class="kpi-label">Total del mes</span>
          <span class="kpi-value neon-red">{{ totalMonth | currency:'COP':'symbol-narrow':'1.0-0' }}</span>
        </div>
        <div class="kpi-card" *ngFor="let cat of topCategories">
          <span class="kpi-label">{{ catLabel(cat.category) }}</span>
          <span class="kpi-value">{{ cat.total | currency:'COP':'symbol-narrow':'1.0-0' }}</span>
        </div>
      </div>

      <!-- Filters -->
      <div class="filter-bar">
        <select class="form-input sm" [(ngModel)]="filterCategory" (change)="load()">
          <option value="">Todas las categorías</option>
          <option *ngFor="let c of categories" [value]="c.value">{{ c.label }}</option>
        </select>
        <input class="form-input sm" type="date" [(ngModel)]="filterFrom" (change)="load()" />
        <input class="form-input sm" type="date" [(ngModel)]="filterTo" (change)="load()" />
      </div>

      <!-- Table -->
      <div class="card table-card">
        <div *ngIf="loading" class="loading-state">Cargando gastos...</div>
        <div *ngIf="!loading && expenses.length === 0" class="empty-state">Sin gastos registrados</div>
        <table *ngIf="!loading && expenses.length > 0" class="data-table">
          <thead>
            <tr><th>Fecha</th><th>Categoría</th><th>Descripción</th><th>Método</th><th>Monto</th><th>Recurrente</th><th>Acciones</th></tr>
          </thead>
          <tbody>
            <tr *ngFor="let e of expenses">
              <td>{{ e.date | date:'dd/MM/yyyy' }}</td>
              <td><span class="badge badge-info">{{ catLabel(e.category) }}</span></td>
              <td>{{ e.description }}</td>
              <td>{{ e.paymentMethod }}</td>
              <td class="amount-col">{{ e.amount | currency:'COP':'symbol-narrow':'1.0-0' }}</td>
              <td><span *ngIf="e.isRecurring" class="badge badge-warning">🔄 Sí</span></td>
              <td class="actions">
                <button class="btn-icon" (click)="edit(e)">✏️</button>
                <button class="btn-icon btn-icon-danger" (click)="remove(e._id)">🗑️</button>
              </td>
            </tr>
          </tbody>
        </table>
        <!-- Paginación -->
        <div class="pagination" *ngIf="totalPages > 1">
          <button [disabled]="page === 1" (click)="changePage(page-1)">‹</button>
          <span>{{ page }} / {{ totalPages }}</span>
          <button [disabled]="page === totalPages" (click)="changePage(page+1)">›</button>
        </div>
      </div>

      <!-- Modal Form -->
      <div class="modal-overlay" *ngIf="showForm" (click)="closeForm()">
        <div class="modal" (click)="$event.stopPropagation()">
          <h2 class="modal-title">{{ editing ? 'Editar Gasto' : 'Registrar Gasto' }}</h2>
          <div class="form-grid">
            <div class="form-group">
              <label>Categoría *</label>
              <select class="form-input" [(ngModel)]="form.category">
                <option value="">Seleccionar...</option>
                <option *ngFor="let c of categories" [value]="c.value">{{ c.label }}</option>
              </select>
            </div>
            <div class="form-group">
              <label>Fecha *</label>
              <input class="form-input" type="date" [(ngModel)]="form.date" />
            </div>
            <div class="form-group full-width">
              <label>Descripción *</label>
              <input class="form-input" [(ngModel)]="form.description" placeholder="Ej: Arriendo local mayo 2026" />
            </div>
            <div class="form-group">
              <label>Monto (COP) *</label>
              <input class="form-input" type="number" min="0" [(ngModel)]="form.amount" />
            </div>
            <div class="form-group">
              <label>Método de pago</label>
              <select class="form-input" [(ngModel)]="form.paymentMethod">
                <option value="efectivo">Efectivo</option>
                <option value="transferencia">Transferencia</option>
                <option value="tarjeta">Tarjeta</option>
                <option value="otro">Otro</option>
              </select>
            </div>
            <div class="form-group">
              <label>N° Factura / Recibo</label>
              <input class="form-input" [(ngModel)]="form.invoiceNumber" />
            </div>
            <div class="form-group">
              <label>Proveedor (opcional)</label>
              <select class="form-input" [(ngModel)]="form.supplier">
                <option value="">Ninguno</option>
                <option *ngFor="let s of suppliers" [value]="s._id">{{ s.name }}</option>
              </select>
            </div>
            <div class="form-group toggle-group">
              <label class="toggle-label">
                <input type="checkbox" [(ngModel)]="form.isRecurring" />
                Gasto recurrente (mensual)
              </label>
            </div>
            <div class="form-group full-width">
              <label>Notas</label>
              <textarea class="form-input" rows="2" [(ngModel)]="form.notes"></textarea>
            </div>
          </div>
          <div class="modal-actions">
            <button class="btn-secondary" (click)="closeForm()">Cancelar</button>
            <button class="btn-primary" (click)="save()" [disabled]="saving">
              {{ saving ? 'Guardando...' : 'Guardar' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .kpi-row { display:flex; gap:1rem; flex-wrap:wrap; margin-bottom:1.5rem; }
    .kpi-card { background:var(--bg-card); border:1px solid var(--border); border-radius:10px; padding:.8rem 1.2rem; min-width:160px; }
    .kpi-label { display:block; font-size:.75rem; color:var(--text-secondary); margin-bottom:.3rem; }
    .kpi-value { font-size:1.2rem; font-weight:700; color:var(--text-primary); }
    .neon-red { color:#ff4444; }
    .filter-bar { display:flex; gap:.75rem; flex-wrap:wrap; margin-bottom:1rem; }
    .form-input.sm { max-width:180px; }
    .form-grid { display:grid; grid-template-columns:1fr 1fr; gap:1rem; }
    .full-width { grid-column:1 / -1; }
    .toggle-group { display:flex; align-items:center; }
    .toggle-label { display:flex; align-items:center; gap:.5rem; font-size:.85rem; cursor:pointer; }
    .amount-col { font-weight:600; color:var(--neon-cyan); }
    .actions { display:flex; gap:.4rem; }
    .pagination { display:flex; align-items:center; justify-content:center; gap:1rem; padding:1rem; }
    .badge-info { background:rgba(0,150,255,.15); color:#4db8ff; }
    .badge-warning { background:rgba(255,200,0,.15); color:#ffc800; }
  `]
})
export class ExpensesComponent implements OnInit {
  expenses: Expense[] = []; categories: ExpenseCategoryOption[] = []; suppliers: Supplier[] = [];
  loading = false; saving = false; showForm = false; editing = false;
  filterCategory = ''; filterFrom = ''; filterTo = '';
  page = 1; totalPages = 1; totalMonth = 0;
  topCategories: { category: string; total: number }[] = [];
  form: Partial<Expense & { supplier: any }> = {};
  private editingId = '';

  // Map for labels lookup
  private labelMap: Record<string, string> = {};

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.api.getExpenseCategories().subscribe((cats: ExpenseCategoryOption[]) => {
      this.categories = cats;
      cats.forEach(c => this.labelMap[c.value] = c.label);
    });
    this.api.getSuppliers({ active: 'true' }).subscribe((s: Supplier[]) => this.suppliers = s);
    this.load();
  }

  catLabel(v: string) { return this.labelMap[v] || v; }

  load() {
    this.loading = true;
    const params: any = { page: this.page, limit: 20 };
    if (this.filterCategory) params.category = this.filterCategory;
    if (this.filterFrom) params.from = this.filterFrom;
    if (this.filterTo)   params.to   = this.filterTo;
    this.api.getExpenses(params).subscribe({
      next: (data: any) => {
        this.expenses = data.expenses; this.totalPages = data.pages;
        this.computeKPIs(data.expenses); this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  computeKPIs(list: Expense[]) {
    const now = new Date(); const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthItems = list.filter(e => new Date(e.date) >= monthStart);
    this.totalMonth = monthItems.reduce((s, e) => s + e.amount, 0);
    const catMap: Record<string, number> = {};
    monthItems.forEach(e => { catMap[e.category] = (catMap[e.category] || 0) + e.amount; });
    this.topCategories = Object.entries(catMap).sort((a,b) => b[1]-a[1]).slice(0,3).map(([category, total]) => ({ category, total }));
  }

  changePage(p: number) { this.page = p; this.load(); }

  openForm() { this.form = { date: new Date().toISOString().slice(0,10), paymentMethod: 'efectivo', isRecurring: false }; this.editing = false; this.editingId = ''; this.showForm = true; }
  edit(e: Expense) { this.form = { ...e, date: e.date?.slice(0,10), supplier: typeof e.supplier === 'object' ? (e.supplier as any)?._id : e.supplier }; this.editing = true; this.editingId = e._id; this.showForm = true; }
  closeForm() { this.showForm = false; }

  save() {
    if (!this.form.category || !this.form.description || !this.form.amount) return;
    this.saving = true;
    const obs = this.editing ? this.api.updateExpense(this.editingId, this.form) : this.api.createExpense(this.form);
    obs.subscribe({ next: () => { this.saving = false; this.closeForm(); this.load(); }, error: () => this.saving = false });
  }

  remove(id: string) {
    if (!confirm('¿Eliminar este gasto?')) return;
    this.api.deleteExpense(id).subscribe(() => this.load());
  }
}
