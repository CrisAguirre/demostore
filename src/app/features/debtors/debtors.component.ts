import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../core/services/api.service';
import { Debtor, DebtorTransaction } from '../../core/models/interfaces';

@Component({
  selector: 'app-debtors',
  template: `
    <div class="page-container">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">👥 Deudores</h1>
          <p class="page-subtitle">Gestión de cuentas por cobrar y créditos a clientes</p>
        </div>
        <div class="header-actions">
          <button class="btn-outline btn-sm" (click)="runMoraCheck()" [disabled]="checkingMora">
            {{ checkingMora ? '⏳ Verificando...' : '🔔 Verificar Mora' }}
          </button>
          <button class="btn-primary" (click)="openForm()">+ Nuevo Deudor</button>
        </div>
      </div>

      <!-- Stat Cards -->
      <div class="grid-4 mb-3">
        <div class="stat-card">
          <div class="stat-icon" style="background:rgba(0,229,255,0.1)">👥</div>
          <div>
            <div class="stat-value">{{ debtors.length }}</div>
            <div class="stat-label">Total Deudores</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:rgba(255,145,0,0.1)">💰</div>
          <div>
            <div class="stat-value">{{ totalDebtAll | currency:'COP':'symbol-narrow':'1.0-0' }}</div>
            <div class="stat-label">Deuda Total</div>
          </div>
        </div>
        <div class="stat-card mora-stat" [class.has-mora]="moraCount > 0">
          <div class="stat-icon" style="background:rgba(255,23,68,0.1)">⚠️</div>
          <div>
            <div class="stat-value">{{ moraCount }}</div>
            <div class="stat-label">En Mora (+30 días)</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:rgba(0,230,118,0.1)">✅</div>
          <div>
            <div class="stat-value">{{ debtFreeCount }}</div>
            <div class="stat-label">Sin Deuda</div>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="filter-bar">
        <input class="form-input" placeholder="🔍 Buscar por nombre, teléfono o código..."
               [(ngModel)]="search" (input)="load()" style="max-width:350px" />
        <select class="form-input sm" [(ngModel)]="filterStatus" (change)="load()">
          <option value="">Todos</option>
          <option value="mora">En mora (+30 días)</option>
          <option value="active">Con deuda activa</option>
        </select>
        <label class="toggle-label">
          <input type="checkbox" [(ngModel)]="showInactive" (change)="load()" />
          Mostrar inactivos
        </label>
      </div>

      <!-- Table -->
      <div class="card table-card">
        <div *ngIf="loading" class="loading-state">Cargando deudores...</div>
        <div *ngIf="!loading && debtors.length === 0" class="empty-state">
          No hay deudores registrados
        </div>
        <table *ngIf="!loading && debtors.length > 0" class="data-table">
          <thead>
            <tr>
              <th>Código</th><th>Nombre</th><th>Teléfono</th><th>Dirección</th>
              <th>Deuda Actual</th><th>Último Pago</th><th>Estado</th><th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let d of debtors" [class.mora-row]="isMora(d)">
              <td><span class="badge badge-cyan">{{ d.code }}</span></td>
              <td><strong>{{ d.name }}</strong></td>
              <td>{{ d.phone || '—' }}</td>
              <td class="address-cell">{{ d.address || '—' }}</td>
              <td class="amount-col">
                <span [class.debt-zero]="d.totalDebt === 0"
                      [class.debt-active]="d.totalDebt > 0">
                  {{ d.totalDebt | currency:'COP':'symbol-narrow':'1.0-0' }}
                </span>
              </td>
              <td>
                <span *ngIf="d.lastPaymentDate">{{ d.lastPaymentDate | date:'dd/MM/yyyy' }}</span>
                <span *ngIf="!d.lastPaymentDate" class="text-muted">Sin pagos</span>
              </td>
              <td>
                <span class="badge badge-green" *ngIf="d.totalDebt === 0">Al día</span>
                <span class="badge badge-mora mora-pulse" *ngIf="isMora(d)"
                      [title]="'Mora: ' + getDaysMora(d) + ' días'">
                  ⚠️ MORA {{ getDaysMora(d) }}d
                </span>
                <span class="badge badge-orange" *ngIf="d.totalDebt > 0 && !isMora(d)">Debe</span>
              </td>
              <td class="actions">
                <button class="btn-icon" title="Ver detalle y transacciones" (click)="viewDetail(d)">👁️</button>
                <button class="btn-icon" title="Editar" (click)="edit(d)">✏️</button>
                <button class="btn-icon btn-icon-danger" title="Desactivar"
                        (click)="remove(d._id)" *ngIf="d.isActive">🗑️</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- ═══════════════ MODAL: New/Edit Debtor ═══════════════ -->
      <div class="modal-overlay" *ngIf="showForm" (click)="closeForm()">
        <div class="modal" (click)="$event.stopPropagation()">
          <h2 class="modal-title">{{ editing ? '✏️ Editar Deudor' : '➕ Nuevo Deudor' }}</h2>
          <div class="form-grid">
            <div class="form-group">
              <label>Consecutivo</label>
              <input class="form-input" [(ngModel)]="form.code" readonly
                     style="color:var(--neon-cyan); font-weight:700" />
              <small class="hint">Generado automáticamente</small>
            </div>
            <div class="form-group">
              <label>Nombre *</label>
              <input class="form-input" [(ngModel)]="form.name" placeholder="Nombre completo del deudor" />
            </div>
            <div class="form-group">
              <label>Teléfono</label>
              <input class="form-input" [(ngModel)]="form.phone" placeholder="300 123 4567" />
            </div>
            <div class="form-group">
              <label>Dirección</label>
              <input class="form-input" [(ngModel)]="form.address" placeholder="Dirección del deudor" />
            </div>
            <div class="form-group" *ngIf="!editing">
              <label>Deuda Inicial</label>
              <input class="form-input" type="number" min="0" [(ngModel)]="form.totalDebt" placeholder="0" />
            </div>
            <div class="form-group">
              <label>Límite de Crédito</label>
              <input class="form-input" type="number" min="0" [(ngModel)]="form.creditLimit" placeholder="0" />
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

      <!-- ═══════════════ MODAL: Detail + Transactions ═══════════════ -->
      <div class="modal-overlay" *ngIf="showDetail" (click)="closeDetail()">
        <div class="modal modal-lg" (click)="$event.stopPropagation()">
          <h2 class="modal-title">📋 Detalle de Deudor</h2>
          <div *ngIf="selected">
            <!-- Debtor Info -->
            <div class="detail-grid">
              <div class="detail-row"><span>Código:</span><strong>{{ selected.code }}</strong></div>
              <div class="detail-row"><span>Nombre:</span><strong>{{ selected.name }}</strong></div>
              <div class="detail-row"><span>Teléfono:</span><strong>{{ selected.phone || '—' }}</strong></div>
              <div class="detail-row"><span>Dirección:</span><strong>{{ selected.address || '—' }}</strong></div>
            </div>

            <!-- Debt Summary Cards -->
            <div class="debt-summary">
              <div class="debt-card debt-card-red">
                <span class="debt-label">Deuda Actual</span>
                <span class="debt-value">{{ selected.totalDebt | currency:'COP':'symbol-narrow':'1.0-0' }}</span>
              </div>
              <div class="debt-card debt-card-violet">
                <span class="debt-label">Límite Crédito</span>
                <span class="debt-value">{{ selected.creditLimit | currency:'COP':'symbol-narrow':'1.0-0' }}</span>
              </div>
              <div class="debt-card debt-card-green">
                <span class="debt-label">Disponible</span>
                <span class="debt-value">{{ (selected.creditLimit - selected.totalDebt) | currency:'COP':'symbol-narrow':'1.0-0' }}</span>
              </div>
            </div>

            <!-- Mora Alert -->
            <div class="mora-banner" *ngIf="isMora(selected)">
              ⚠️ Este cliente tiene <strong>{{ getDaysMora(selected) }} días</strong> de mora sin realizar pagos.
            </div>

            <!-- Transaction Actions -->
            <div class="transaction-actions">
              <button class="btn-success btn-sm" (click)="openTransaction('abono')" [disabled]="selected.totalDebt === 0">
                💵 Abonar
              </button>
              <button class="btn-primary btn-sm" (click)="payFull()" [disabled]="selected.totalDebt === 0">
                ✅ Pagar Todo
              </button>
              <button class="btn-violet btn-sm" (click)="openTransaction('aumento_credito')">
                ➕ Aumentar Crédito
              </button>
              <button class="btn-outline btn-sm" (click)="openTransaction('nueva_deuda')">
                📝 Nueva Deuda
              </button>
            </div>

            <!-- Transaction Input (shown when adding abono/aumento) -->
            <div class="transaction-input" *ngIf="showTransactionInput">
              <div class="transaction-form">
                <span class="tx-type-label">{{ txTypeLabel }}</span>
                <input class="form-input" type="number" min="1"
                       [(ngModel)]="txAmount" placeholder="Monto" />
                <input class="form-input" [(ngModel)]="txNotes" placeholder="Notas (opcional)" />
                <div class="tx-buttons">
                  <button class="btn-outline btn-sm" (click)="cancelTransaction()">Cancelar</button>
                  <button class="btn-primary btn-sm" (click)="submitTransaction()" [disabled]="savingTx">
                    {{ savingTx ? 'Procesando...' : 'Confirmar' }}
                  </button>
                </div>
              </div>
            </div>

            <!-- Transaction History -->
            <div class="tx-history">
              <h3 class="tx-history-title">📜 Historial de Transacciones</h3>
              <div *ngIf="loadingTx" class="loading-state" style="padding:.75rem">Cargando...</div>
              <div *ngIf="!loadingTx && transactions.length === 0" class="empty-state" style="padding:.75rem">
                Sin transacciones registradas
              </div>
              <table *ngIf="!loadingTx && transactions.length > 0" class="data-table">
                <thead>
                  <tr>
                    <th>Fecha/Hora</th><th>Tipo</th><th>Monto</th>
                    <th>Saldo Antes</th><th>Saldo Después</th><th>Notas</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let tx of transactions">
                    <td class="nowrap">{{ tx.createdAt | date:'dd/MM/yyyy HH:mm' }}</td>
                    <td>
                      <span class="badge" [ngClass]="getTxBadgeClass(tx.type)">
                        {{ getTxLabel(tx.type) }}
                      </span>
                    </td>
                    <td class="amount-col">{{ tx.amount | currency:'COP':'symbol-narrow':'1.0-0' }}</td>
                    <td>{{ tx.balanceBefore | currency:'COP':'symbol-narrow':'1.0-0' }}</td>
                    <td>{{ tx.balanceAfter | currency:'COP':'symbol-narrow':'1.0-0' }}</td>
                    <td class="notes-cell">{{ tx.notes || '—' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div class="modal-actions">
            <button class="btn-outline" (click)="closeDetail()">Cerrar</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* Header */
    .header-actions { display: flex; gap: .75rem; align-items: center; flex-wrap: wrap; }
    .page-subtitle { font-size: .85rem; color: var(--text-secondary); margin-top: .25rem; }

    /* Filters */
    .filter-bar { display: flex; gap: .75rem; flex-wrap: wrap; margin-bottom: 1rem; align-items: center; }
    .form-input.sm { max-width: 180px; }
    .toggle-label { display: flex; align-items: center; gap: .4rem; font-size: .85rem;
                    color: var(--text-secondary); cursor: pointer; white-space: nowrap; }

    /* Table */
    .amount-col { font-weight: 600; }
    .debt-active { color: var(--neon-orange); }
    .debt-zero { color: var(--neon-green); }
    .text-muted { color: var(--text-muted); font-size: .8rem; }
    .address-cell { max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .nowrap { white-space: nowrap; }
    .notes-cell { max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: .8rem; }
    .actions { display: flex; gap: .4rem; }

    /* Mora row highlighting */
    .mora-row td { background: rgba(255, 23, 68, 0.03) !important; }
    .mora-row td:first-child { border-left: 3px solid var(--neon-red); }

    /* Mora badge with pulse */
    .badge-mora { background: rgba(255, 23, 68, 0.15); color: #FF1744; }
    .mora-pulse { animation: moraPulse 2s ease-in-out infinite; }
    @keyframes moraPulse {
      0%, 100% { box-shadow: 0 0 0 0 rgba(255, 23, 68, 0.4); }
      50% { box-shadow: 0 0 0 6px rgba(255, 23, 68, 0); }
    }

    /* Stat card mora */
    .mora-stat.has-mora { border-color: rgba(255, 23, 68, 0.3); animation: moraPulseCard 3s ease-in-out infinite; }
    @keyframes moraPulseCard {
      0%, 100% { box-shadow: 0 0 8px rgba(255, 23, 68, 0.1); }
      50% { box-shadow: 0 0 18px rgba(255, 23, 68, 0.25); }
    }

    /* Form */
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .hint { color: var(--text-muted); font-size: .75rem; }
    .modal-lg { max-width: 850px !important; width: 92vw; }

    /* Detail grid */
    .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0; margin-bottom: 1rem; }
    .detail-row { display: flex; justify-content: space-between; padding: .5rem .75rem;
                  border-bottom: 1px solid var(--bg-input); font-size: .9rem; }

    /* Debt summary cards */
    .debt-summary { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: .75rem; margin: 1rem 0; }
    .debt-card { border-radius: 10px; padding: .9rem; text-align: center;
                 display: flex; flex-direction: column; gap: .25rem; }
    .debt-card-red { background: rgba(255, 23, 68, 0.08); border: 1px solid rgba(255, 23, 68, 0.2); }
    .debt-card-violet { background: rgba(124, 77, 255, 0.08); border: 1px solid rgba(124, 77, 255, 0.2); }
    .debt-card-green { background: rgba(0, 230, 118, 0.08); border: 1px solid rgba(0, 230, 118, 0.2); }
    .debt-label { font-size: .7rem; text-transform: uppercase; letter-spacing: .05em;
                  color: var(--text-secondary); font-weight: 600; }
    .debt-value { font-family: 'Outfit', sans-serif; font-size: 1.2rem; font-weight: 700; }
    .debt-card-red .debt-value { color: #FF1744; }
    .debt-card-violet .debt-value { color: #7C4DFF; }
    .debt-card-green .debt-value { color: #00E676; }

    /* Mora banner */
    .mora-banner { background: rgba(255, 23, 68, 0.1); border: 1px solid rgba(255, 23, 68, 0.3);
                   border-radius: 8px; padding: .75rem 1rem; margin: .75rem 0; font-size: .88rem;
                   color: #FF1744; animation: moraPulseCard 2s ease-in-out infinite; }

    /* Transaction actions */
    .transaction-actions { display: flex; gap: .6rem; flex-wrap: wrap; margin: 1rem 0; padding: .75rem 0;
                           border-top: 1px solid var(--bg-input); border-bottom: 1px solid var(--bg-input); }

    /* Transaction input */
    .transaction-input { background: var(--bg-input); border-radius: 10px; padding: 1rem; margin: .75rem 0;
                         animation: fadeInUp 0.2s ease; }
    .transaction-form { display: flex; gap: .75rem; align-items: center; flex-wrap: wrap; }
    .transaction-form .form-input { max-width: 200px; }
    .tx-type-label { font-weight: 700; font-size: .85rem; color: var(--neon-cyan); white-space: nowrap; min-width: 120px; }
    .tx-buttons { display: flex; gap: .5rem; }

    /* Transaction history */
    .tx-history { margin-top: 1rem; }
    .tx-history-title { font-size: 1rem; margin-bottom: .75rem; }

    /* Responsive */
    @media (max-width: 768px) {
      .form-grid { grid-template-columns: 1fr; }
      .detail-grid { grid-template-columns: 1fr; }
      .debt-summary { grid-template-columns: 1fr; }
      .header-actions { flex-direction: column; width: 100%; }
      .header-actions button { width: 100%; }
      .transaction-form { flex-direction: column; }
      .transaction-form .form-input { max-width: 100%; }
    }
  `]
})
export class DebtorsComponent implements OnInit {
  debtors: Debtor[] = [];
  loading = false; saving = false; showForm = false; editing = false;
  search = ''; filterStatus = ''; showInactive = false;
  checkingMora = false;

  form: any = {};
  private editingId = '';

  // Detail modal
  showDetail = false;
  selected: Debtor | null = null;
  transactions: DebtorTransaction[] = [];
  loadingTx = false;

  // Transaction input
  showTransactionInput = false;
  txType: string = '';
  txAmount: number = 0;
  txNotes: string = '';
  savingTx = false;

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.load();
    // Auto-check mora on module load
    this.api.checkDebtorMora().subscribe();
  }

  load() {
    this.loading = true;
    const params: any = {};
    if (this.search) params.search = this.search;
    if (!this.showInactive) params.active = 'true';
    if (this.filterStatus === 'mora') params.status = 'mora';
    this.api.getDebtors(params).subscribe({
      next: (data: Debtor[]) => {
        let result = data;
        if (this.filterStatus === 'active') {
          result = data.filter(d => d.totalDebt > 0);
        }
        this.debtors = result;
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  // ── Stats ───────────────────────────────────────────────────────────────

  get totalDebtAll(): number {
    return this.debtors.reduce((s, d) => s + d.totalDebt, 0);
  }

  get moraCount(): number {
    return this.debtors.filter(d => this.isMora(d)).length;
  }

  get debtFreeCount(): number {
    return this.debtors.filter(d => d.totalDebt === 0).length;
  }

  // ── Mora helpers ────────────────────────────────────────────────────────

  isMora(d: Debtor): boolean {
    if (d.totalDebt <= 0) return false;
    const refDate = d.lastPaymentDate ? new Date(d.lastPaymentDate) : new Date(d.createdAt);
    const daysDiff = Math.floor((Date.now() - refDate.getTime()) / (1000 * 60 * 60 * 24));
    return daysDiff > 30;
  }

  getDaysMora(d: Debtor): number {
    const refDate = d.lastPaymentDate ? new Date(d.lastPaymentDate) : new Date(d.createdAt);
    return Math.floor((Date.now() - refDate.getTime()) / (1000 * 60 * 60 * 24));
  }

  runMoraCheck() {
    this.checkingMora = true;
    this.api.checkDebtorMora().subscribe({
      next: (res: any) => {
        this.checkingMora = false;
        alert(`Verificación completa: ${res.overdueCount} deudor(es) en mora.`);
        this.load();
      },
      error: () => { this.checkingMora = false; }
    });
  }

  // ── CRUD Form ───────────────────────────────────────────────────────────

  openForm() {
    this.form = { name: '', phone: '', address: '', totalDebt: 0, creditLimit: 0, code: '...' };
    this.editing = false;
    this.editingId = '';
    // Fetch next code
    this.api.getNextDebtorCode().subscribe({
      next: (res: any) => this.form.code = res.nextCode,
      error: () => this.form.code = 'DEU-???'
    });
    this.showForm = true;
  }

  edit(d: Debtor) {
    this.form = { name: d.name, phone: d.phone, address: d.address, creditLimit: d.creditLimit, code: d.code };
    this.editing = true;
    this.editingId = d._id;
    this.showForm = true;
  }

  closeForm() { this.showForm = false; }

  save() {
    if (!this.form.name) { alert('El nombre es obligatorio'); return; }
    this.saving = true;
    const obs = this.editing
      ? this.api.updateDebtor(this.editingId, this.form)
      : this.api.createDebtor(this.form);
    obs.subscribe({
      next: () => { this.saving = false; this.closeForm(); this.load(); },
      error: (err) => {
        this.saving = false;
        alert('Error al guardar: ' + (err.error?.message || err.message));
      }
    });
  }

  remove(id: string) {
    if (!confirm('¿Desactivar este deudor?')) return;
    this.api.deleteDebtor(id).subscribe({
      next: () => this.load(),
      error: (err) => alert('Error: ' + (err.error?.message || err.message))
    });
  }

  // ── Detail Modal ────────────────────────────────────────────────────────

  viewDetail(d: Debtor) {
    this.selected = null;
    this.transactions = [];
    this.showDetail = true;
    this.showTransactionInput = false;
    this.loadingTx = true;

    // Fetch full debtor (with transactions)
    this.api.getDebtor(d._id).subscribe({
      next: (debtor: Debtor) => {
        this.selected = debtor;
        this.loadTransactions(d._id);
      },
      error: () => { this.loadingTx = false; }
    });
  }

  loadTransactions(id: string) {
    this.loadingTx = true;
    this.api.getDebtorTransactions(id).subscribe({
      next: (res: any) => { this.transactions = res.transactions; this.loadingTx = false; },
      error: () => this.loadingTx = false
    });
  }

  closeDetail() { this.showDetail = false; this.selected = null; }

  // ── Transaction Actions ─────────────────────────────────────────────────

  get txTypeLabel(): string {
    const labels: Record<string, string> = {
      'abono': '💵 Abono parcial:',
      'aumento_credito': '➕ Aumentar crédito:',
      'nueva_deuda': '📝 Nueva deuda:'
    };
    return labels[this.txType] || '';
  }

  openTransaction(type: string) {
    this.txType = type;
    this.txAmount = 0;
    this.txNotes = '';
    this.showTransactionInput = true;
  }

  cancelTransaction() {
    this.showTransactionInput = false;
  }

  submitTransaction() {
    if (!this.selected || this.txAmount <= 0) {
      alert('Ingresa un monto válido');
      return;
    }
    this.savingTx = true;
    this.api.addDebtorTransaction(this.selected._id, {
      type: this.txType,
      amount: this.txAmount,
      notes: this.txNotes
    }).subscribe({
      next: (debtor: Debtor) => {
        this.selected = debtor;
        this.savingTx = false;
        this.showTransactionInput = false;
        this.loadTransactions(debtor._id);
        this.load(); // Refresh list
      },
      error: (err) => {
        this.savingTx = false;
        alert('Error: ' + (err.error?.message || err.message));
      }
    });
  }

  payFull() {
    if (!this.selected || this.selected.totalDebt === 0) return;
    if (!confirm(`¿Registrar pago completo de ${this.selected.totalDebt.toLocaleString('es-CO')} COP?`)) return;
    this.savingTx = true;
    this.api.addDebtorTransaction(this.selected._id, {
      type: 'pago_completo',
      amount: this.selected.totalDebt,
      notes: 'Pago completo de la deuda'
    }).subscribe({
      next: (debtor: Debtor) => {
        this.selected = debtor;
        this.savingTx = false;
        this.loadTransactions(debtor._id);
        this.load();
      },
      error: (err) => {
        this.savingTx = false;
        alert('Error: ' + (err.error?.message || err.message));
      }
    });
  }

  // ── Transaction helpers ─────────────────────────────────────────────────

  getTxLabel(type: string): string {
    const labels: Record<string, string> = {
      'abono': 'Abono',
      'pago_completo': 'Pago Total',
      'aumento_credito': 'Aumento Crédito',
      'nueva_deuda': 'Nueva Deuda'
    };
    return labels[type] || type;
  }

  getTxBadgeClass(type: string): string {
    const classes: Record<string, string> = {
      'abono': 'badge-green',
      'pago_completo': 'badge-cyan',
      'aumento_credito': 'badge-violet',
      'nueva_deuda': 'badge-orange'
    };
    return classes[type] || 'badge-cyan';
  }
}
