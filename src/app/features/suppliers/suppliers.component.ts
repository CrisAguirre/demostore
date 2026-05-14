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
              <th>Nombre</th><th>NIT/RUT</th><th>Contacto</th><th>Teléfono</th><th>Email</th><th>Estado</th><th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let s of suppliers">
              <td><strong>{{ s.name }}</strong></td>
              <td>{{ s.nit || '—' }}</td>
              <td>{{ s.contactName || '—' }}</td>
              <td>{{ s.phone || '—' }}</td>
              <td>{{ s.email || '—' }}</td>
              <td>
                <span class="badge" [class.badge-success]="s.isActive" [class.badge-danger]="!s.isActive">
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
          <h2 class="modal-title">{{ editing ? 'Editar Proveedor' : 'Nuevo Proveedor' }}</h2>
          <div class="form-grid">
            <div class="form-group">
              <label>Nombre *</label>
              <input class="form-input" [(ngModel)]="form.name" placeholder="Razón social o nombre" />
            </div>
            <div class="form-group">
              <label>NIT / RUT / Cédula</label>
              <input class="form-input" [(ngModel)]="form.nit" placeholder="900.123.456-1" />
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
    .search-bar { display:flex; gap:1rem; align-items:center; margin-bottom:1rem; }
    .toggle-label { display:flex; align-items:center; gap:.4rem; font-size:.85rem; color:var(--text-secondary); cursor:pointer; white-space:nowrap; }
    .form-grid { display:grid; grid-template-columns:1fr 1fr; gap:1rem; }
    .full-width { grid-column: 1 / -1; }
    .actions { display:flex; gap:.4rem; }
  `]
})
export class SuppliersComponent implements OnInit {
  suppliers: Supplier[] = [];
  loading = false; saving = false; showForm = false; editing = false;
  search = ''; showInactive = false;

  form: Partial<Supplier> = {};
  private editingId = '';

  constructor(private api: ApiService) {}

  ngOnInit() { this.load(); }

  load() {
    this.loading = true;
    const params: any = {};
    if (this.search) params.search = this.search;
    if (!this.showInactive) params.active = 'true';
    this.api.getSuppliers(params).subscribe({
      next: (data: Supplier[]) => { this.suppliers = data; this.loading = false; },
      error: () => this.loading = false
    });
  }

  openForm() {
    this.form = {}; this.editing = false; this.editingId = ''; this.showForm = true;
  }
  edit(s: Supplier) {
    this.form = { ...s }; this.editing = true; this.editingId = s._id; this.showForm = true;
  }
  closeForm() { this.showForm = false; }

  save() {
    if (!this.form.name) return;
    this.saving = true;
    const obs = this.editing
      ? this.api.updateSupplier(this.editingId, this.form)
      : this.api.createSupplier(this.form);
    obs.subscribe({ next: () => { this.saving = false; this.closeForm(); this.load(); }, error: () => this.saving = false });
  }

  remove(id: string) {
    if (!confirm('¿Desactivar este proveedor?')) return;
    this.api.deleteSupplier(id).subscribe(() => this.load());
  }
}
