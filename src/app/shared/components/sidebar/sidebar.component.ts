import { Component } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-sidebar',
  template: `
    <aside class="sidebar" [class.collapsed]="collapsed">
      <button class="toggle-btn desktop-only" (click)="collapsed = !collapsed">
        {{ collapsed ? '☰' : '✕' }}
      </button>
      <nav class="sidebar-nav">
        <a *ngFor="let item of menuItems" [routerLink]="item.route" routerLinkActive="active"
           class="nav-item" [title]="item.label">
          <span class="nav-icon">{{ item.icon }}</span>
          <span class="nav-label" *ngIf="!collapsed">{{ item.label }}</span>
        </a>
      </nav>
    </aside>
  `,
  styles: [`
    .sidebar {
      width: 220px; min-height: calc(100vh - 60px);
      background: var(--bg-sidebar);
      border-right: 1px solid rgba(0,229,255,0.08);
      padding: 1rem 0; transition: width 0.25s ease;
      display: flex; flex-direction: column;
      position: sticky; top: 60px;
    }
    .sidebar.collapsed { width: 60px; }
    .toggle-btn {
      align-self: flex-end; margin: 0 0.75rem 1rem;
      background: none; border: none; font-size: 1.1rem;
      cursor: pointer; color: var(--text-secondary);
      width: 32px; height: 32px; border-radius: 6px;
      transition: background 0.15s;
    }
    .toggle-btn:hover { background: var(--bg-input); }
    .sidebar-nav { display: flex; flex-direction: column; gap: 2px; }
    .nav-item {
      display: flex; align-items: center; gap: 0.75rem;
      padding: 0.65rem 1rem; margin: 0 0.5rem;
      border-radius: 8px; font-size: 0.85rem; font-weight: 500;
      color: var(--text-secondary); transition: all 0.15s;
      white-space: nowrap; overflow: hidden;
    }
    .nav-item:hover {
      background: rgba(0,229,255,0.06); color: var(--text-primary);
    }
    .nav-item.active {
      background: rgba(0,229,255,0.1); color: #00B8D4;
      font-weight: 600;
      border-left: 3px solid var(--neon-cyan);
    }
    .nav-icon { font-size: 1.2rem; min-width: 24px; text-align: center; }
    .nav-label { transition: opacity 0.2s; }
    .collapsed .nav-label { opacity: 0; width: 0; overflow: hidden; }
    .collapsed .nav-item { justify-content: center; padding: 0.65rem; }
    @media (max-width: 768px) {
      .sidebar { width: 64px; flex-shrink: 0; }
      .desktop-only { display: none; }
      .nav-label { display: none; }
      .nav-item { justify-content: center; padding: 0.85rem 0; margin: 0.15rem 0.25rem; }
      .nav-icon { font-size: 1.4rem; }
      .nav-item.active { border-left: none; border-bottom: 3px solid var(--neon-cyan); border-radius: 6px; }
    }
  `]
})
export class SidebarComponent {
  collapsed = false;
  menuItems: { icon: string; label: string; route: string }[] = [];

  constructor(private auth: AuthService) {
    const role = this.auth.currentUser?.role;

    if (role === 'cliente') {
      this.menuItems = [
        { icon: '📊', label: 'Mis Compras', route: '/dashboard' },
        { icon: '🌐', label: 'Tienda Virtual', route: '/storefront' },
        { icon: '⚙️', label: 'Mi Perfil', route: '/settings' }
      ];
    } else if (role === 'invitado') {
      this.menuItems = [
        { icon: '📊', label: 'Mis Compras', route: '/dashboard' },
        { icon: '🌐', label: 'Tienda Virtual', route: '/storefront' }
      ];
    } else {
      this.menuItems = [
        { icon: '📊', label: 'Dashboard', route: '/dashboard' },
        { icon: '📦', label: 'Inventario', route: '/inventory' },
        { icon: '🛒', label: 'Punto de Venta', route: '/pos' },
        { icon: '💰', label: 'Caja', route: '/cash' },
      ];
      if (role === 'admin') {
        this.menuItems.push(
          { icon: '📈', label: 'Reportes', route: '/reports' },
          { icon: '🔔', label: 'Alertas', route: '/alerts' },
          { icon: '🌐', label: 'Tienda Virtual', route: '/storefront' },
          { icon: '⚙️', label: 'Configuración', route: '/settings' }
        );
      }
    }
  }
}
