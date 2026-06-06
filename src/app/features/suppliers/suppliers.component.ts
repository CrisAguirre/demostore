import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../core/services/api.service';
import { Supplier } from '../../core/models/interfaces';

@Component({
  selector: 'app-suppliers',
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1 class="page-title">🏭 Proveedores</h1>
          <p class="page-subtitle">Gestión de proveedores y directorio de contactos</p>
        </div>
        <button class="btn-primary" (click)="openForm()">+ Nuevo Proveedor</button>
      </div>

      <!-- Search -->
      <div class="search-bar">
        <input class="form-input" placeholder="🔍 Buscar proveedor..." [(ngModel)]="search"
               (input)="load()" />
        <label class="toggle-label">
          <input type="checkbox" [(ngModel)]="showInactive" (change)="load()" />
          Mostrar inactivos
        </label>
      </div>

      <!-- Table -->
      <div class="card table-card">
        <div *ngIf="loading" class="loading-state">Cargando proveedores...</div>
        <div *ngIf="!loading && suppliers.length === 0" class="empty-state">
          No hay proveedores registrados
        </div>
        <table *ngIf="!loading && suppliers.length > 0" class="data-table">
          <thead>
            <tr>
              <th (click)="sort('code')" class="sortable">Código <span *ngIf="sortColumn === 'code'">{{ sortAsc ? '▲' : '▼' }}</span></th>
              <th (click)="sort('name')" class="sortable">Nombre <span *ngIf="sortColumn === 'name'">{{ sortAsc ? '▲' : '▼' }}</span></th>
              <th (click)="sort('categories')" class="sortable">Categorías <span *ngIf="sortColumn === 'categories'">{{ sortAsc ? '▲' : '▼' }}</span></th>
              <th>NIT/RUT</th><th>Contacto</th><th>Teléfono</th><th>Estado</th><th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let s of suppliers">
              <td><span class="badge badge-cyan">{{ s.code || '—' }}</span></td>
              <td><strong>{{ s.name }}</strong></td>
              <td class="cat-list">
                <span class="badge badge-violet" *ngFor="let cat of (s.categories || [])">{{ cat.icon || '' }} {{ cat.name || cat }}</span>
                <span *ngIf="!s.categories || s.categories.length === 0">—</span>
              </td>
              <td>{{ s.nit || '—' }}</td>
              <td>{{ s.contactName || '—' }}</td>
              <td>{{ s.phone || '—' }}</td>
              <td>
                <span class="badge" [class.badge-green]="s.isActive" [class.badge-red]="!s.isActive">
                  {{ s.isActive ? 'Activo' : 'Inactivo' }}
                </span>
              </td>
              <td class="actions">
                <button class="btn-icon" title="Editar" (click)="edit(s)">✏️</button>
                <button class="btn-icon btn-icon-danger" title="Desactivar"
                        (click)="remove(s._id)" *ngIf="s.isActive">🗑️</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Modal Form -->
      <div class="modal-overlay" *ngIf="showForm" (click)="closeForm()">
        <div class="modal" (click)="$event.stopPropagation()">
          <h2 class="modal-title">{{ editing ? '✏️ Editar Proveedor' : '➕ Nuevo Proveedor' }}</h2>
          <div class="form-grid">
            <div class="form-group">
              <label>Nombre *</label>
              <input class="form-input" [(ngModel)]="form.name" placeholder="Razón social o nombre" />
            </div>
            <div class="form-group" *ngIf="editing">
              <label>Código de Proveedor</label>
              <input class="form-input" [(ngModel)]="form.code" readonly />
              <small style="color:#888; font-size:0.8rem">Código asignado automáticamente</small>
            </div>
            <div class="form-group">
              <label>NIT / RUT / Cédula</label>
              <input class="form-input" [(ngModel)]="form.nit" placeholder="900.123.456-1" />
            </div>
            <div class="form-group full-width">
              <label>Categorías manejadas *</label>
              <select class="form-input" multiple [(ngModel)]="form.categories" style="height: 100px;">
                <option *ngFor="let cat of categories" [value]="cat._id">{{ cat.icon }} {{ cat.name }}</option>
              </select>
              <small style="color:#888; font-size:0.8rem">Mantén presionado Ctrl (o Cmd) para seleccionar múltiples</small>
            </div>
            <div class="form-group">
              <label>Persona de contacto</label>
              <input class="form-input" [(ngModel)]="form.contactName" />
            </div>
            <div class="form-group">
              <label>Teléfono</label>
              <input class="form-input" [(ngModel)]="form.phone" />
            </div>
            <div class="form-group">
              <label>Email</label>
              <input class="form-input" type="email" [(ngModel)]="form.email" />
            </div>
            <div class="form-group full-width">
              <label>Dirección</label>
              <input class="form-input" [(ngModel)]="form.address" />
            </div>
            <div class="form-group full-width">
              <label>Notas</label>
              <textarea class="form-input" rows="2" [(ngModel)]="form.notes"></textarea>
            </div>
          </div>
          <div class="modal-actions">
            <button class="btn-outline" (click)="closeForm()">Cancelar</button>
            <button class="btn-primary" (click)="save()" [disabled]="saving">
              {{ saving ? 'Guardando...' : (editing ? 'Actualizar' : 'Guardar') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .search-bar { display:flex; gap:1rem; align-items:center; margin-bottom:1rem; }
    .toggle-label { display:flex; align-items:center; gap:.4rem; font-size:.85rem; color:var(--text-secondary); cursor:pointer; white-space:nowrap; }
    .form-grid { display:grid; grid-template-columns:1fr 1fr; gap:1rem; }
    .full-width { grid-column: 1 / -1; }
    .actions { display:flex; gap:.4rem; }
    .cat-list { display:flex; flex-wrap:wrap; gap:0.25rem; }
    .sortable { cursor: pointer; user-select: none; transition: background 0.2s; }
    .sortable:hover { background-color: rgba(0, 229, 255, 0.1); color: var(--text-primary); }
  `]
})
export class SuppliersComponent implements OnInit {
  suppliers: Supplier[] = [];
  categories: any[] = [];
  loading = false; saving = false; showForm = false; editing = false;
  search = ''; showInactive = false;
  sortColumn = 'name'; sortAsc = true;

  form: any = {};
  private editingId = '';

  constructor(private api: ApiService) {}

  ngOnInit() { 
    this.load(); 
    this.api.getCategories().subscribe({ next: (cats: any) => this.categories = cats });
  }

  load() {
    this.loading = true;
    const params: any = {};
    if (this.search) params.search = this.search;
    if (!this.showInactive) params.active = 'true';
    this.api.getSuppliers(params).subscribe({
      next: (data: Supplier[]) => { this.suppliers = data; this.applySort(); this.loading = false; },
      error: () => this.loading = false
    });
  }

  openForm() {
    this.form = {}; this.editing = false; this.editingId = ''; this.showForm = true;
  }
  edit(s: Supplier) {
    this.form = JSON.parse(JSON.stringify(s));
    // Convert populated category objects to plain IDs for the <select>
    if (this.form.categories && this.form.categories.length > 0) {
      this.form.categories = this.form.categories.map((c: any) => c._id || c);
    } else {
      this.form.categories = [];
    }
    this.editing = true; 
    this.editingId = s._id; 
    this.showForm = true;
  }
  closeForm() { this.showForm = false; }

  save() {
    if (!this.form.name || !this.form.categories || this.form.categories.length === 0) {
      alert('El Nombre y al menos una Categoría son obligatorios');
      return;
    }
    this.saving = true;
    const obs = this.editing
      ? this.api.updateSupplier(this.editingId, this.form)
      : this.api.createSupplier(this.form);
    obs.subscribe({ 
      next: () => { this.saving = false; this.closeForm(); this.load(); }, 
      error: (err) => { 
        this.saving = false; 
        alert('Error al guardar: ' + (err.error?.message || err.message)); 
      } 
    });
  }

  remove(id: string) {
    if (!confirm('¿Desactivar este proveedor?')) return;
    this.api.deleteSupplier(id).subscribe({
      next: () => this.load(),
      error: (err) => alert('Error al eliminar: ' + (err.error?.message || err.message))
    });
  }

  sort(column: string) {
    if (this.sortColumn === column) {
      this.sortAsc = !this.sortAsc;
    } else {
      this.sortColumn = column;
      this.sortAsc = true;
    }
    this.applySort();
  }

  applySort() {
    this.suppliers.sort((a, b) => {
      let valA: any = '';
      let valB: any = '';
      
      if (this.sortColumn === 'code') {
        valA = parseInt(a.code, 10) || 0;
        valB = parseInt(b.code, 10) || 0;
      } else if (this.sortColumn === 'name') {
        valA = (a.name || '').toLowerCase();
        valB = (b.name || '').toLowerCase();
      } else if (this.sortColumn === 'categories') {
        valA = (a.categories || []).map((c: any) => c.name || '').join(', ').toLowerCase();
        valB = (b.categories || []).map((c: any) => c.name || '').join(', ').toLowerCase();
      }

      if (valA < valB) return this.sortAsc ? -1 : 1;
      if (valA > valB) return this.sortAsc ? 1 : -1;
      return 0;
    });
  }
}
