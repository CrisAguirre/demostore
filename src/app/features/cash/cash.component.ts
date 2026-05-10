import { Component, OnInit } from '@angular/core';
import { ApiService } from '@core/services/api.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-cash',
  template: `
    <div class="page-header"><h1>💰 Arqueo de Caja</h1></div>

    <div class="neon-card mb-3" *ngIf="currentCash">
      <div class="flex-between">
        <div>
          <h3>{{ currentCash.open ? '🟢 Caja Abierta' : '🔴 Caja Cerrada' }}</h3>
          <p style="color:var(--text-secondary);font-size:0.85rem" *ngIf="currentCash.open">
            Abierta desde: {{ currentCash.cashClosing?.openedAt | date:'medium' }}<br>
            Monto inicial: \${{ currentCash.cashClosing?.initialAmount | number:'1.0-0' }}<br>
            Ventas acumuladas: \${{ currentCash.currentTotalSales | number:'1.0-0' }} ({{ currentCash.currentTransactions }} transacciones)
          </p>
        </div>
        <div>
          <button class="btn-primary" (click)="openCash()" *ngIf="!currentCash.open">🔓 Abrir Caja</button>
          <button class="btn-danger" (click)="closeCash()" *ngIf="currentCash.open">🔒 Cerrar Caja</button>
        </div>
      </div>
    </div>

    <div class="neon-card" style="animation:none">
      <h3 style="margin-bottom:1rem">📋 Historial de Arqueos</h3>
      <div class="table-wrapper">
        <table class="data-table">
          <thead><tr><th>Fecha</th><th>Cajero</th><th>Inicial</th><th>Ventas</th><th>Esperado</th><th>Real</th><th>Diferencia</th><th>Estado</th></tr></thead>
          <tbody>
            <tr *ngFor="let c of closings">
              <td>{{ c.openedAt | date:'dd/MM/yy HH:mm' }}</td>
              <td>{{ c.user?.name || '-' }}</td>
              <td>\${{ c.initialAmount | number:'1.0-0' }}</td>
              <td>\${{ c.totalSales | number:'1.0-0' }}</td>
              <td>\${{ c.expectedCash | number:'1.0-0' }}</td>
              <td>{{ c.actualCash !== null ? ('$' + (c.actualCash | number:'1.0-0')) : '-' }}</td>
              <td [style.color]="c.difference < 0 ? 'var(--neon-red)' : 'var(--neon-green)'">
                {{ c.difference !== 0 ? ('$' + (c.difference | number:'1.0-0')) : '$0' }}
              </td>
              <td><span [class]="c.status === 'abierta' ? 'badge badge-green' : 'badge badge-violet'">{{ c.status }}</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class CashComponent implements OnInit {
  currentCash: any = null;
  closings: any[] = [];

  constructor(private api: ApiService) {}

  ngOnInit(): void { this.loadData(); }

  loadData(): void {
    this.api.getCurrentCash().subscribe({ next: (res: any) => this.currentCash = res });
    this.api.getCashClosings().subscribe({ next: (res: any) => this.closings = res.closings || [] });
  }

  async openCash(): Promise<void> {
    const { value } = await Swal.fire({
      title: '🔓 Abrir Caja', input: 'number', inputLabel: 'Monto inicial en caja',
      inputPlaceholder: '0', showCancelButton: true, confirmButtonColor: '#00E5FF'
    });
    if (value !== undefined) {
      this.api.openCash(+value).subscribe({ next: () => { this.loadData(); Swal.fire('✅', 'Caja abierta', 'success'); } });
    }
  }

  async closeCash(): Promise<void> {
    const { value } = await Swal.fire({
      title: '🔒 Cerrar Caja',
      html: '<input id="swal-actual" class="swal2-input" type="number" placeholder="Dinero contado en caja"><textarea id="swal-notes" class="swal2-textarea" placeholder="Notas (opcional)"></textarea>',
      showCancelButton: true, confirmButtonText: 'Cerrar Caja', confirmButtonColor: '#FF1744',
      preConfirm: () => ({
        actualCash: +(document.getElementById('swal-actual') as HTMLInputElement).value,
        notes: (document.getElementById('swal-notes') as HTMLTextAreaElement).value
      })
    });
    if (value) {
      this.api.closeCash(this.currentCash.cashClosing._id, value).subscribe({
        next: () => { this.loadData(); Swal.fire('✅', 'Caja cerrada', 'success'); }
      });
    }
  }
}
