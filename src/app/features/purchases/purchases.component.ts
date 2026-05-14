import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../core/services/api.service';
import { Purchase, Supplier, Product } from '../../core/models/interfaces';

interface PurchaseFormItem {
  productId: string; productName: string; quantity: number; unitCost: number; updateCost: boolean;
}

@Component({
  selector: 'app-purchases',
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1 class="page-title">🛍️ Compras a Proveedores</h1>
          <p class="page-subtitle">Registro de órdenes de compra y entrada de mercancía</p>
        </div>
        <button class="btn-primary" (click)="openForm()">+ Nueva Compra</button>
      </div>

      <!-- Filters -->
      <div class="filter-bar">
        <select class="form-input sm" [(ngModel)]="filterStatus" (change)="load()">
          <option value="">Todos los estados</option>
          <option value="recibida">Recibida</option>
          <option value="pendiente">Pendiente</option>
          <option value="anulada">Anulada</option>
        </select>
        <input class="form-input sm" type="date" [(ngModel)]="filterFrom" (change)="load()" />
        <input class="form-input sm" type="date" [(ngModel)]="filterTo" (change)="load()" />
      </div>

      <!-- Table -->
      <div class="card table-card">
        <div *ngIf="loading" class="loading-state">Cargando compras...</div>
        <div *ngIf="!loading && purchases.length===0" class="empty-state">Sin compras registradas</div>
        <table *ngIf="!loading && purchases.length>0" class="data-table">
          <thead>
            <tr><th>Fecha</th><th>Proveedor</th><th>Factura</th><th>Ítems</th><th>Total</th><th>Pago</th><th>Estado</th><th>Acciones</th></tr>
          </thead>
          <tbody>
            <tr *ngFor="let p of purchases">
              <td>{{ p.createdAt | date:'dd/MM/yyyy' }}</td>
              <td><strong>{{ p.supplierName }}</strong></td>
              <td>{{ p.invoiceNumber || '—' }}</td>
              <td>{{ p.items.length }}</td>
              <td class="amount-col">{{ p.total | currency:'COP':'symbol-narrow':'1.0-0' }}</td>
              <td>{{ p.paymentMethod }}</td>
              <td>
                <span class="badge"
                  [class.badge-success]="p.status==='recibida'"
                  [class.badge-warning]="p.status==='pendiente'"
                  [class.badge-danger]="p.status==='anulada'">{{ p.status }}</span>
              </td>
              <td class="actions">
                <button class="btn-icon" (click)="viewDetail(p)">👁️</button>
                <button class="btn-icon btn-icon-danger" *ngIf="p.status!=='anulada'" (click)="annul(p._id)">❌</button>
              </td>
            </tr>
          </tbody>
        </table>
        <div class="pagination" *ngIf="totalPages>1">
          <button [disabled]="page===1" (click)="changePage(page-1)">‹</button>
          <span>{{ page }} / {{ totalPages }}</span>
          <button [disabled]="page===totalPages" (click)="changePage(page+1)">›</button>
        </div>
      </div>

      <!-- New Purchase Modal -->
      <div class="modal-overlay" *ngIf="showForm" (click)="closeForm()">
        <div class="modal modal-lg" (click)="$event.stopPropagation()">
          <h2 class="modal-title">Nueva Compra a Proveedor</h2>
          <div class="form-grid">
            <div class="form-group">
              <label>Proveedor *</label>
              <select class="form-input" [(ngModel)]="newPurchase.supplierId">
                <option value="">Seleccionar...</option>
                <option *ngFor="let s of suppliers" [value]="s._id">{{ s.name }}</option>
              </select>
            </div>
            <div class="form-group">
              <label>N° Factura</label>
              <input class="form-input" [(ngModel)]="newPurchase.invoiceNumber" placeholder="FV-001" />
            </div>
            <div class="form-group">
              <label>Método de pago</label>
              <select class="form-input" [(ngModel)]="newPurchase.paymentMethod">
                <option value="efectivo">Efectivo</option>
                <option value="transferencia">Transferencia</option>
                <option value="credito">Crédito</option>
                <option value="mixto">Mixto</option>
              </select>
            </div>
            <div class="form-group">
              <label>Notas</label>
              <input class="form-input" [(ngModel)]="newPurchase.notes" />
            </div>
          </div>

          <!-- Items -->
          <div class="items-section">
            <div class="items-header">
              <strong>Productos</strong>
              <button class="btn-secondary btn-sm" (click)="addItem()">+ Agregar producto</button>
            </div>
            <div class="item-row" *ngFor="let item of newPurchase.items; let i=index">
              <select class="form-input" [(ngModel)]="item.productId" (change)="onProductSelect(item)">
                <option value="">Seleccionar producto...</option>
                <option *ngFor="let p of products" [value]="p._id">{{ p.name }} (Stock: {{ p.stock }})</option>
              </select>
              <input class="form-input num-input" type="number" min="1" [(ngModel)]="item.quantity" placeholder="Cant." />
              <input class="form-input num-input" type="number" min="0" [(ngModel)]="item.unitCost" placeholder="Costo unit." />
              <span class="subtotal">{{ (item.quantity * item.unitCost) | currency:'COP':'symbol-narrow':'1.0-0' }}</span>
              <label class="toggle-label sm">
                <input type="checkbox" [(ngModel)]="item.updateCost" />
                Actualizar costo
              </label>
              <button class="btn-icon btn-icon-danger" (click)="removeItem(i)">✕</button>
            </div>
            <div class="purchase-total">
              <strong>Total: {{ purchaseTotal | currency:'COP':'symbol-narrow':'1.0-0' }}</strong>
            </div>
          </div>

          <div class="modal-actions">
            <button class="btn-secondary" (click)="closeForm()">Cancelar</button>
            <button class="btn-primary" (click)="savePurchase()" [disabled]="saving">
              {{ saving ? 'Guardando...' : 'Registrar Compra' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Detail Modal -->
      <div class="modal-overlay" *ngIf="showDetail" (click)="showDetail=false">
        <div class="modal" (click)="$event.stopPropagation()">
          <h2 class="modal-title">Detalle de Compra</h2>
          <div *ngIf="selected">
            <div class="detail-row"><span>Proveedor:</span><strong>{{ selected.supplierName }}</strong></div>
            <div class="detail-row"><span>Factura:</span><strong>{{ selected.invoiceNumber || '—' }}</strong></div>
            <div class="detail-row"><span>Estado:</span><span class="badge badge-success">{{ selected.status }}</span></div>
            <div class="detail-row"><span>Pago:</span><strong>{{ selected.paymentMethod }}</strong></div>
            <table class="data-table" style="margin-top:1rem">
              <thead><tr><th>Producto</th><th>Cant.</th><th>Costo unit.</th><th>Subtotal</th></tr></thead>
              <tbody>
                <tr *ngFor="let it of selected.items">
                  <td>{{ it.productName }}</td>
                  <td>{{ it.quantity }}</td>
                  <td>{{ it.unitCost | currency:'COP':'symbol-narrow':'1.0-0' }}</td>
                  <td>{{ it.subtotal | currency:'COP':'symbol-narrow':'1.0-0' }}</td>
                </tr>
              </tbody>
            </table>
            <div class="purchase-total" style="margin-top:1rem">
              <strong>Total: {{ selected.total | currency:'COP':'symbol-narrow':'1.0-0' }}</strong>
            </div>
          </div>
          <div class="modal-actions">
            <button class="btn-secondary" (click)="showDetail=false">Cerrar</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .filter-bar { display:flex; gap:.75rem; flex-wrap:wrap; margin-bottom:1rem; }
    .form-input.sm { max-width:180px; }
    .form-grid { display:grid; grid-template-columns:1fr 1fr; gap:1rem; margin-bottom:1.5rem; }
    .modal-lg { max-width:800px !important; width:90vw; }
    .items-section { border:1px solid var(--border); border-radius:8px; padding:1rem; margin-bottom:1rem; }
    .items-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; }
    .item-row { display:flex; gap:.5rem; align-items:center; margin-bottom:.75rem; flex-wrap:wrap; }
    .item-row .form-input { flex:1; min-width:140px; }
    .num-input { max-width:100px !important; flex:none !important; }
    .subtotal { min-width:90px; font-weight:600; color:var(--neon-cyan); font-size:.85rem; }
    .toggle-label.sm { font-size:.78rem; white-space:nowrap; }
    .purchase-total { text-align:right; font-size:1.1rem; padding-top:.5rem; }
    .amount-col { font-weight:600; color:var(--neon-cyan); }
    .actions { display:flex; gap:.4rem; }
    .detail-row { display:flex; justify-content:space-between; padding:.4rem 0; border-bottom:1px solid var(--border); font-size:.9rem; }
    .pagination { display:flex; align-items:center; justify-content:center; gap:1rem; padding:1rem; }
    .badge-warning { background:rgba(255,200,0,.15); color:#ffc800; }
  `]
})
export class PurchasesComponent implements OnInit {
  purchases: Purchase[] = []; suppliers: Supplier[] = []; products: Product[] = [];
  loading = false; saving = false; showForm = false; showDetail = false;
  filterStatus = ''; filterFrom = ''; filterTo = '';
  page = 1; totalPages = 1; selected: Purchase | null = null;

  newPurchase = { supplierId: '', invoiceNumber: '', paymentMethod: 'efectivo', notes: '', items: [] as PurchaseFormItem[] };

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.api.getSuppliers({ active: 'true' }).subscribe((s: Supplier[]) => this.suppliers = s);
    this.api.getProducts({ active: 'true', limit: 500 }).subscribe((d: any) => this.products = d.products || d);
    this.load();
  }

  load() {
    this.loading = true;
    const params: any = { page: this.page, limit: 20 };
    if (this.filterStatus) params.status = this.filterStatus;
    if (this.filterFrom)   params.from = this.filterFrom;
    if (this.filterTo)     params.to   = this.filterTo;
    this.api.getPurchases(params).subscribe({
      next: (d: any) => { this.purchases = d.purchases; this.totalPages = d.pages; this.loading = false; },
      error: () => this.loading = false
    });
  }

  changePage(p: number) { this.page = p; this.load(); }

  openForm() {
    this.newPurchase = { supplierId: '', invoiceNumber: '', paymentMethod: 'efectivo', notes: '', items: [] };
    this.addItem(); this.showForm = true;
  }
  closeForm() { this.showForm = false; }

  addItem() { this.newPurchase.items.push({ productId: '', productName: '', quantity: 1, unitCost: 0, updateCost: false }); }
  removeItem(i: number) { this.newPurchase.items.splice(i, 1); }

  onProductSelect(item: PurchaseFormItem) {
    const p = this.products.find(pr => pr._id === item.productId);
    if (p) { item.productName = p.name; item.unitCost = p.purchasePrice; }
  }

  get purchaseTotal() {
    return this.newPurchase.items.reduce((s, i) => s + (i.quantity * i.unitCost), 0);
  }

  savePurchase() {
    if (!this.newPurchase.supplierId || !this.newPurchase.items.length) return;
    this.saving = true;
    this.api.createPurchase(this.newPurchase).subscribe({
      next: () => { this.saving = false; this.closeForm(); this.load(); },
      error: () => this.saving = false
    });
  }

  viewDetail(p: Purchase) { this.selected = p; this.showDetail = true; }

  annul(id: string) {
    if (!confirm('¿Anular esta compra? El stock será revertido.')) return;
    this.api.updatePurchaseStatus(id, 'anulada').subscribe(() => this.load());
  }
}
