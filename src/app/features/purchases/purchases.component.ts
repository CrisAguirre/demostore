import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../core/services/api.service';
import { Purchase, Supplier, Product } from '../../core/models/interfaces';

interface PurchaseFormItem {
  productId: string; productName: string; quantity: number; unitCost: number; updateCost: boolean;
  stock: number;
}

@Component({
  selector: 'app-purchases',
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1 class="page-title">🛍️ Compras a Proveedores</h1>
          <p class="page-subtitle">Registro de órdenes de compra, entrada de mercancía y actualización de inventario</p>
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
                <button class="btn-icon" title="Ver detalle" (click)="viewDetail(p)">👁️</button>
                <button class="btn-icon btn-icon-danger" title="Anular compra y revertir inventario" *ngIf="p.status!=='anulada'" (click)="annul(p._id)">❌</button>
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

      <!-- ═══════════════ MODAL: New Purchase ═══════════════ -->
      <div class="modal-overlay" *ngIf="showForm" (click)="closeForm()">
        <div class="modal modal-xl" (click)="$event.stopPropagation()">
          <h2 class="modal-title">📦 Generar Orden de Compra</h2>
          <p class="modal-subtitle">Los productos recibidos actualizarán automáticamente el inventario.</p>
          
          <div class="form-grid-header">
            <div class="form-group">
              <label>Proveedor *</label>
              <select class="form-input" [(ngModel)]="newPurchase.supplierId" (change)="onSupplierSelect()">
                <option value="">Seleccionar proveedor...</option>
                <option *ngFor="let s of suppliers" [value]="s._id">{{ s.name }}</option>
              </select>
            </div>
            <div class="form-group">
              <label>N° Factura / Orden</label>
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
          </div>

          <div class="purchase-layout" *ngIf="newPurchase.supplierId">
            
            <!-- Left: Product Catalog (Supplier's products) -->
            <div class="catalog-section">
              <h3 class="section-title">Catálogo del Proveedor</h3>
              <input class="form-input search-catalog" placeholder="🔍 Buscar producto..." [(ngModel)]="catalogSearch" />
              
              <div class="product-grid">
                <div *ngIf="filteredCatalog.length === 0" class="empty-catalog">
                  No se encontraron productos para este proveedor.
                </div>
                <div class="product-card" *ngFor="let p of filteredCatalog" 
                     [class.selected]="isProductInCart(p._id)"
                     (click)="toggleProduct(p)">
                  <div class="prod-check">
                    <span *ngIf="isProductInCart(p._id)">✅</span>
                  </div>
                  <div class="prod-info">
                    <div class="prod-name">{{ p.name }}</div>
                    <div class="prod-stock">Stock actual: {{ p.stock }}</div>
                    <div class="prod-price">{{ p.purchasePrice | currency:'COP':'symbol-narrow':'1.0-0' }}</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Right: Cart / Selected Items -->
            <div class="cart-section">
              <h3 class="section-title">Carrito de Compra ({{ newPurchase.items.length }})</h3>
              
              <div *ngIf="newPurchase.items.length === 0" class="empty-cart">
                Selecciona productos del catálogo para agregarlos a la orden.
              </div>

              <div class="cart-items" *ngIf="newPurchase.items.length > 0">
                <div class="cart-item" *ngFor="let item of newPurchase.items; let i=index">
                  <div class="item-header">
                    <strong>{{ item.productName }}</strong>
                    <button class="btn-icon btn-icon-danger btn-sm" (click)="removeItem(i)">✕</button>
                  </div>
                  <div class="item-controls">
                    <div class="control-group">
                      <label>Cant.</label>
                      <input class="form-input num-input" type="number" min="1" [(ngModel)]="item.quantity" />
                    </div>
                    <div class="control-group">
                      <label>Costo Unit.</label>
                      <input class="form-input num-input" type="number" min="0" [(ngModel)]="item.unitCost" />
                    </div>
                    <div class="control-group total">
                      <label>Subtotal</label>
                      <div class="subtotal-val">{{ (item.quantity * item.unitCost) | currency:'COP':'symbol-narrow':'1.0-0' }}</div>
                    </div>
                  </div>
                  <div class="item-options">
                    <label class="toggle-label sm" title="Actualizará el precio de costo en el inventario">
                      <input type="checkbox" [(ngModel)]="item.updateCost" />
                      Actualizar costo en sistema
                    </label>
                    <span class="stock-hint">Stock post-compra: {{ item.stock + item.quantity }}</span>
                  </div>
                </div>
              </div>

              <div class="cart-footer" *ngIf="newPurchase.items.length > 0">
                <div class="purchase-total">
                  <span>Total Orden:</span>
                  <strong>{{ purchaseTotal | currency:'COP':'symbol-narrow':'1.0-0' }}</strong>
                </div>
              </div>
            </div>

          </div>

          <div class="form-group" style="margin-top: 1rem;" *ngIf="newPurchase.supplierId">
            <label>Notas adicionales</label>
            <input class="form-input" [(ngModel)]="newPurchase.notes" placeholder="Observaciones de la compra..." />
          </div>

          <div class="modal-actions">
            <button class="btn-secondary" (click)="closeForm()">Cancelar</button>
            <button class="btn-primary" (click)="savePurchase()" [disabled]="saving || newPurchase.items.length === 0 || !newPurchase.supplierId">
              {{ saving ? 'Guardando...' : '🛒 Confirmar Compra y Actualizar Inventario' }}
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
              <thead><tr><th>Producto</th><th>Cant. ingresada</th><th>Costo unit.</th><th>Subtotal</th></tr></thead>
              <tbody>
                <tr *ngFor="let it of selected.items">
                  <td>{{ it.productName }}</td>
                  <td><span class="badge badge-success">+{{ it.quantity }}</span></td>
                  <td>{{ it.unitCost | currency:'COP':'symbol-narrow':'1.0-0' }}</td>
                  <td>{{ it.subtotal | currency:'COP':'symbol-narrow':'1.0-0' }}</td>
                </tr>
              </tbody>
            </table>
            <div class="purchase-total-detail">
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
    
    .modal-xl { max-width: 1000px !important; width: 95vw; }
    .modal-subtitle { font-size: 0.9rem; color: var(--neon-cyan); margin-top: -0.5rem; margin-bottom: 1.5rem; }
    
    .form-grid-header { display:grid; grid-template-columns: 2fr 1fr 1fr; gap:1rem; margin-bottom:1.5rem; }
    @media(max-width: 768px) { .form-grid-header { grid-template-columns: 1fr; } }
    
    /* Layout split */
    .purchase-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; border-top: 1px solid var(--border); padding-top: 1.5rem; }
    @media(max-width: 768px) { .purchase-layout { grid-template-columns: 1fr; } }
    
    .section-title { font-size: 1.1rem; margin-bottom: 1rem; color: var(--text-primary); border-bottom: 1px solid var(--border); padding-bottom: 0.5rem; }
    
    /* Catalog */
    .catalog-section { background: rgba(0,0,0,0.1); border-radius: 8px; padding: 1rem; border: 1px solid var(--border); }
    .search-catalog { margin-bottom: 1rem; width: 100%; }
    .product-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 0.75rem; max-height: 400px; overflow-y: auto; padding-right: 0.5rem; }
    .product-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: 8px; padding: 0.75rem; cursor: pointer; transition: all 0.2s; position: relative; }
    .product-card:hover { border-color: var(--neon-cyan); transform: translateY(-2px); }
    .product-card.selected { border-color: var(--neon-cyan); background: rgba(0, 229, 255, 0.05); }
    .prod-check { position: absolute; top: 0.5rem; right: 0.5rem; font-size: 0.8rem; }
    .prod-name { font-weight: 600; font-size: 0.85rem; margin-bottom: 0.25rem; line-height: 1.2; }
    .prod-stock { font-size: 0.75rem; color: var(--text-muted); margin-bottom: 0.25rem; }
    .prod-price { font-size: 0.85rem; color: var(--neon-green); font-weight: 600; }
    .empty-catalog { grid-column: 1 / -1; text-align: center; color: var(--text-muted); padding: 2rem 0; font-size: 0.9rem; }
    
    /* Cart */
    .cart-section { background: var(--bg-card); border-radius: 8px; padding: 1rem; border: 1px solid rgba(0, 229, 255, 0.1); display: flex; flex-direction: column; }
    .empty-cart { text-align: center; color: var(--text-muted); padding: 3rem 1rem; font-size: 0.9rem; border: 1px dashed var(--border); border-radius: 8px; margin-top: 1rem; }
    .cart-items { max-height: 330px; overflow-y: auto; padding-right: 0.5rem; flex: 1; }
    .cart-item { border: 1px solid var(--border); border-radius: 8px; padding: 0.75rem; margin-bottom: 0.75rem; background: rgba(0,0,0,0.2); }
    .item-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; font-size: 0.9rem; }
    .btn-sm { width: 24px; height: 24px; font-size: 0.7rem; }
    .item-controls { display: flex; gap: 0.75rem; margin-bottom: 0.5rem; }
    .control-group { flex: 1; display: flex; flex-direction: column; gap: 0.2rem; }
    .control-group label { font-size: 0.7rem; color: var(--text-secondary); }
    .num-input { padding: 0.3rem 0.5rem; height: auto; font-size: 0.85rem; }
    .subtotal-val { font-family: 'Outfit', sans-serif; font-weight: 600; font-size: 0.9rem; padding-top: 0.4rem; color: var(--neon-cyan); }
    .item-options { display: flex; justify-content: space-between; align-items: center; margin-top: 0.5rem; border-top: 1px dashed var(--border); padding-top: 0.5rem; }
    .toggle-label.sm { font-size: 0.75rem; }
    .stock-hint { font-size: 0.75rem; color: var(--neon-green); font-weight: 600; }
    
    .cart-footer { margin-top: 1rem; padding-top: 1rem; border-top: 2px solid var(--border); text-align: right; }
    .purchase-total { font-size: 1.2rem; display: flex; justify-content: flex-end; align-items: center; gap: 1rem; }
    .purchase-total span { color: var(--text-secondary); font-size: 0.9rem; text-transform: uppercase; }
    .purchase-total strong { color: var(--neon-cyan); font-family: 'Outfit', sans-serif; }
    
    /* General */
    .amount-col { font-weight:600; color:var(--neon-cyan); }
    .actions { display:flex; gap:.4rem; }
    .detail-row { display:flex; justify-content:space-between; padding:.4rem 0; border-bottom:1px solid var(--border); font-size:.9rem; }
    .pagination { display:flex; align-items:center; justify-content:center; gap:1rem; padding:1rem; }
    .badge-warning { background:rgba(255,200,0,.15); color:#ffc800; }
    .purchase-total-detail { text-align:right; font-size:1.1rem; padding-top:.5rem; margin-top: 1rem; border-top: 1px solid var(--border); }
  `]
})
export class PurchasesComponent implements OnInit {
  purchases: Purchase[] = []; suppliers: Supplier[] = []; products: Product[] = [];
  loading = false; saving = false; showForm = false; showDetail = false;
  filterStatus = ''; filterFrom = ''; filterTo = '';
  page = 1; totalPages = 1; selected: Purchase | null = null;

  newPurchase = { supplierId: '', invoiceNumber: '', paymentMethod: 'efectivo', notes: '', items: [] as PurchaseFormItem[] };
  
  // Catalog state
  supplierProducts: Product[] = [];
  catalogSearch = '';

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.api.getSuppliers({ active: 'true' }).subscribe((s: Supplier[]) => this.suppliers = s);
    // Cargar todos los productos una vez para filtrar localmente
    this.api.getProducts({ active: 'true', limit: 1000 }).subscribe((d: any) => this.products = d.products || d);
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
    this.supplierProducts = [];
    this.catalogSearch = '';
    this.showForm = true;
  }
  closeForm() { this.showForm = false; }

  onSupplierSelect() {
    this.newPurchase.items = []; // Reset cart
    this.catalogSearch = '';
    const sid = this.newPurchase.supplierId;
    if (!sid) {
      this.supplierProducts = [];
      return;
    }
    // Filtrar productos cuyo supplier._id o supplier coincida
    this.supplierProducts = this.products.filter(p => {
      if (!p.supplier) return false;
      const pSid = typeof p.supplier === 'object' ? p.supplier._id : p.supplier;
      return pSid === sid;
    });
  }

  get filteredCatalog(): Product[] {
    if (!this.catalogSearch) return this.supplierProducts;
    const term = this.catalogSearch.toLowerCase();
    return this.supplierProducts.filter(p => p.name.toLowerCase().includes(term) || p.barcode?.toLowerCase().includes(term));
  }

  isProductInCart(productId: string): boolean {
    return this.newPurchase.items.some(item => item.productId === productId);
  }

  toggleProduct(p: Product) {
    const idx = this.newPurchase.items.findIndex(item => item.productId === p._id);
    if (idx >= 0) {
      this.newPurchase.items.splice(idx, 1);
    } else {
      this.newPurchase.items.push({
        productId: p._id,
        productName: p.name,
        quantity: 1,
        unitCost: p.purchasePrice,
        updateCost: true,
        stock: p.stock
      });
    }
  }

  removeItem(i: number) { 
    this.newPurchase.items.splice(i, 1); 
  }

  get purchaseTotal() {
    return this.newPurchase.items.reduce((s, i) => s + ((i.quantity || 0) * (i.unitCost || 0)), 0);
  }

  savePurchase() {
    if (!this.newPurchase.supplierId || !this.newPurchase.items.length) {
      alert("Selecciona un proveedor y al menos un producto.");
      return;
    }
    this.saving = true;
    this.api.createPurchase(this.newPurchase).subscribe({
      next: () => { 
        this.saving = false; 
        this.closeForm(); 
        // Actualizar el inventario localmente para la próxima vez que se abra
        this.api.getProducts({ active: 'true', limit: 1000 }).subscribe((d: any) => this.products = d.products || d);
        this.load(); 
      },
      error: (err) => {
        this.saving = false;
        alert("Error al registrar la compra: " + (err.error?.message || err.message));
      }
    });
  }

  viewDetail(p: Purchase) { this.selected = p; this.showDetail = true; }

  annul(id: string) {
    if (!confirm('¿Anular esta compra? ATENCIÓN: Las cantidades ingresadas de estos productos se descontarán automáticamente del inventario actual.')) return;
    this.api.updatePurchaseStatus(id, 'anulada').subscribe(() => {
      // Recargar catálogo local
      this.api.getProducts({ active: 'true', limit: 1000 }).subscribe((d: any) => this.products = d.products || d);
      this.load();
    });
  }
}
