import { Component, OnInit } from '@angular/core';
import { ApiService } from '@core/services/api.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-pos',
  template: `
    <div class="pos-layout">
      <!-- Panel Productos -->
      <div class="pos-products">
        <div class="pos-search">
          <input class="form-input" placeholder="🔍 Buscar producto o escanear código..."
                 [(ngModel)]="searchTerm" (input)="filterProducts()" #searchInput>
        </div>
        <div class="pos-categories">
          <button class="cat-btn" [class.active]="!selectedCategory" (click)="selectedCategory='';filterProducts()">Todos</button>
          <button class="cat-btn" *ngFor="let c of categories" [class.active]="selectedCategory === c._id"
                  (click)="selectedCategory = c._id; filterProducts()">{{ c.icon }} {{ c.name }}</button>
        </div>
        <div class="product-grid">
          <div class="product-tile neon-card" *ngFor="let p of filteredProducts" (click)="addToCart(p)"
               style="padding:0.75rem;cursor:pointer;animation:none">
            <div class="product-tile-name">{{ p.name }}</div>
            <div class="flex-between">
              <span class="product-tile-price">\${{ p.salePrice | number:'1.0-0' }}</span>
              <span class="badge" [class]="p.stock > 0 ? 'badge-green' : 'badge-red'">{{ p.stock }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Panel Carrito -->
      <div class="pos-cart neon-card-violet" style="animation:none">
        <h3 style="margin-bottom:1rem">🛒 Venta Actual</h3>
        <div class="cart-items">
          <div class="cart-item" *ngFor="let item of cart; let i = index">
            <div class="cart-item-info">
              <span class="cart-item-name">{{ item.productName }}</span>
              <span class="cart-item-price">\${{ item.unitPrice | number:'1.0-0' }} c/u</span>
            </div>
            <div class="cart-item-controls">
              <button class="qty-btn" (click)="changeQty(i, -1)">−</button>
              <span class="qty-display">{{ item.quantity }}</span>
              <button class="qty-btn" (click)="changeQty(i, 1)">+</button>
              <span class="cart-item-subtotal">\${{ item.subtotal | number:'1.0-0' }}</span>
              <button class="btn-ghost btn-sm" (click)="removeItem(i)">✕</button>
            </div>
          </div>
          <div *ngIf="cart.length === 0" style="text-align:center;padding:2rem;color:var(--text-muted)">
            Agregue productos para empezar
          </div>
        </div>
        <div class="cart-footer" *ngIf="cart.length > 0">
          <div class="cart-total">
            <span>TOTAL</span>
            <span class="total-amount">\${{ total | number:'1.0-0' }}</span>
          </div>
          <div style="display:flex;gap:0.5rem;margin-top:0.75rem">
            <select class="form-input" [(ngModel)]="paymentMethod" style="flex:1">
              <option value="efectivo">💵 Efectivo</option>
              <option value="transferencia">📱 Transferencia</option>
              <option value="mixto">🔄 Mixto</option>
            </select>
          </div>
          <div style="display:flex;gap:0.5rem;margin-top:0.75rem">
            <button class="btn-danger" style="flex:1" (click)="clearCart()">🗑️ Limpiar</button>
            <button class="btn-success" style="flex:2" (click)="finalizeSale()" [disabled]="processing">
              {{ processing ? '⏳' : '✅' }} Cobrar
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .pos-layout { display: grid; grid-template-columns: 1fr 360px; gap: 1rem; min-height: calc(100vh - 100px); }
    .pos-search { margin-bottom: 0.75rem; }
    .pos-categories {
      display: flex; gap: 0.375rem; overflow-x: auto; padding-bottom: 0.5rem;
      margin-bottom: 0.75rem; scrollbar-width: none;
    }
    .cat-btn {
      padding: 0.375rem 0.75rem; border-radius: 20px; border: 1px solid var(--bg-input);
      background: #fff; font-size: 0.75rem; white-space: nowrap; cursor: pointer;
      transition: all 0.15s;
    }
    .cat-btn.active { background: var(--neon-cyan); color: #fff; border-color: var(--neon-cyan); }
    .product-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 0.5rem;
      max-height: calc(100vh - 240px); overflow-y: auto;
    }
    .product-tile:hover { transform: translateY(-2px); border-color: var(--neon-cyan); }
    .product-tile-name { font-size: 0.82rem; font-weight: 600; margin-bottom: 0.375rem; line-height: 1.3; }
    .product-tile-price { font-family: 'Outfit'; font-weight: 700; color: var(--neon-violet); }
    .pos-cart { display: flex; flex-direction: column; position: sticky; top: 76px; max-height: calc(100vh - 100px); }
    .cart-items { flex: 1; overflow-y: auto; }
    .cart-item {
      padding: 0.6rem 0; border-bottom: 1px solid var(--bg-input);
    }
    .cart-item-info { display: flex; justify-content: space-between; margin-bottom: 0.25rem; }
    .cart-item-name { font-size: 0.82rem; font-weight: 600; }
    .cart-item-price { font-size: 0.75rem; color: var(--text-secondary); }
    .cart-item-controls { display: flex; align-items: center; gap: 0.5rem; }
    .qty-btn {
      width: 26px; height: 26px; border-radius: 6px; border: 1px solid var(--bg-input);
      background: #fff; font-weight: 700; cursor: pointer; font-size: 1rem;
      display: flex; align-items: center; justify-content: center;
    }
    .qty-display { font-weight: 700; min-width: 20px; text-align: center; }
    .cart-item-subtotal { font-family: 'Outfit'; font-weight: 700; margin-left: auto; }
    .cart-total {
      display: flex; justify-content: space-between; align-items: center;
      padding-top: 0.75rem; border-top: 2px solid var(--neon-violet);
      font-weight: 700;
    }
    .total-amount {
      font-family: 'Outfit'; font-size: 1.5rem;
      background: linear-gradient(135deg, var(--neon-cyan), var(--neon-violet));
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    }
    @media (max-width: 768px) {
      .pos-layout { grid-template-columns: 1fr; }
      .pos-cart { position: relative; top: 0; }
    }
  `]
})
export class PosComponent implements OnInit {
  products: any[] = [];
  filteredProducts: any[] = [];
  categories: any[] = [];
  cart: any[] = [];
  searchTerm = '';
  selectedCategory = '';
  paymentMethod = 'efectivo';
  processing = false;

  get total(): number {
    return this.cart.reduce((sum, item) => sum + item.subtotal, 0);
  }

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.api.getProducts({ limit: 200, active: 'true' }).subscribe({
      next: (res: any) => { this.products = res.products; this.filteredProducts = [...this.products]; }
    });
    this.api.getCategories().subscribe({ next: (cats: any) => this.categories = cats });
  }

  filterProducts(): void {
    this.filteredProducts = this.products.filter(p => {
      const matchSearch = !this.searchTerm ||
        p.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        p.barcode?.includes(this.searchTerm);
      const matchCat = !this.selectedCategory ||
        (p.category?._id || p.category) === this.selectedCategory;
      return matchSearch && matchCat;
    });
  }

  addToCart(product: any): void {
    if (product.stock <= 0) return;
    const existing = this.cart.find(i => i.product === product._id);
    if (existing) {
      if (existing.quantity >= product.stock) return;
      existing.quantity++;
      existing.subtotal = existing.quantity * existing.unitPrice;
    } else {
      this.cart.push({
        product: product._id,
        productName: product.name,
        quantity: 1,
        unitPrice: product.salePrice,
        subtotal: product.salePrice
      });
    }
  }

  changeQty(index: number, delta: number): void {
    const item = this.cart[index];
    item.quantity += delta;
    if (item.quantity <= 0) { this.cart.splice(index, 1); return; }
    item.subtotal = item.quantity * item.unitPrice;
  }

  removeItem(index: number): void { this.cart.splice(index, 1); }
  clearCart(): void { this.cart = []; }

  finalizeSale(): void {
    this.processing = true;
    this.api.createSale({
      items: this.cart.map(i => ({ product: i.product, quantity: i.quantity })),
      paymentMethod: this.paymentMethod
    }).subscribe({
      next: () => {
        this.processing = false;
        Swal.fire({ icon: 'success', title: '✅ Venta Registrada', text: `Total: $${this.total.toLocaleString('es-CO')}`, confirmButtonColor: '#00E5FF' });
        this.cart = [];
        this.ngOnInit(); // Recargar productos con stock actualizado
      },
      error: (err: any) => {
        this.processing = false;
        Swal.fire('❌ Error', err.error?.message || 'Error al procesar venta', 'error');
      }
    });
  }
}
