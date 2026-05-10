import { Component, OnInit } from '@angular/core';
import { ApiService } from '@core/services/api.service';
import { SettingsService } from '@core/services/settings.service';

@Component({
  selector: 'app-storefront',
  template: `
    <div class="storefront-header">
      <h1>🌐 {{ settingsService.storeName }} — Tienda Virtual</h1>
      <p>Vista previa de lo que verán tus clientes</p>
    </div>

    <div class="pos-categories" style="margin-bottom:1rem;display:flex;gap:0.375rem;overflow-x:auto">
      <button class="cat-btn" [class.active]="!selectedCategory" (click)="selectedCategory='';loadProducts()">Todos</button>
      <button class="cat-btn" *ngFor="let c of categories" [class.active]="selectedCategory === c._id"
              (click)="selectedCategory = c._id; loadProducts()">{{ c.icon }} {{ c.name }}</button>
    </div>

    <div class="grid-4">
      <div class="neon-card" *ngFor="let p of products" style="text-align:center;animation:none">
        <div style="font-size:2.5rem;margin-bottom:0.5rem">📦</div>
        <h4 style="font-size:0.9rem;margin-bottom:0.25rem">{{ p.name }}</h4>
        <p style="font-family:Outfit;font-size:1.2rem;font-weight:700;color:var(--neon-violet)">\${{ p.salePrice | number:'1.0-0' }}</p>
        <span [class]="p.stock > 0 ? 'badge badge-green' : 'badge badge-red'" style="margin-top:0.5rem">
          {{ p.stock > 0 ? 'Disponible' : 'Agotado' }}
        </span>
      </div>
    </div>
    <p *ngIf="products.length === 0" style="text-align:center;padding:3rem;color:var(--text-muted)">No hay productos para mostrar</p>
  `,
  styles: [`
    .storefront-header { text-align: center; margin-bottom: 1.5rem; }
    .storefront-header h1 { font-size: 1.5rem; }
    .storefront-header p { color: var(--text-secondary); font-size: 0.85rem; }
    .cat-btn { padding: 0.375rem 0.75rem; border-radius: 20px; border: 1px solid var(--bg-input); background: #fff; font-size: 0.75rem; white-space: nowrap; cursor: pointer; }
    .cat-btn.active { background: var(--neon-cyan); color: #fff; border-color: var(--neon-cyan); }
  `]
})
export class StorefrontComponent implements OnInit {
  products: any[] = [];
  categories: any[] = [];
  selectedCategory = '';

  constructor(private api: ApiService, public settingsService: SettingsService) {}

  ngOnInit(): void {
    this.loadProducts();
    this.api.getStorefrontCategories().subscribe({ next: (cats: any) => this.categories = cats });
  }

  loadProducts(): void {
    const params: any = {};
    if (this.selectedCategory) params.category = this.selectedCategory;
    this.api.getStorefrontProducts(params).subscribe({
      next: (res: any) => this.products = res.products || []
    });
  }
}
