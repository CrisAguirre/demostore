// src/app/app-routing.module.ts  — REEMPLAZA el original
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { RoleGuard } from './core/guards/role.guard';

const routes: Routes = [
  { path: 'login', loadChildren: () => import('./features/auth/auth.module').then(m => m.AuthModule) },
  {
    path: '', canActivate: [AuthGuard], children: [
      { path: 'dashboard',  loadChildren: () => import('./features/dashboard/dashboard.module').then(m => m.DashboardModule) },
      { path: 'inventory',  loadChildren: () => import('./features/inventory/inventory.module').then(m => m.InventoryModule) },
      { path: 'pos',        loadChildren: () => import('./features/pos/pos.module').then(m => m.PosModule) },
      { path: 'cash',       loadChildren: () => import('./features/cash/cash.module').then(m => m.CashModule) },
      { path: 'reports',    loadChildren: () => import('./features/reports/reports.module').then(m => m.ReportsModule),    canActivate: [RoleGuard], data: { roles: ['admin'] } },
      { path: 'alerts',     loadChildren: () => import('./features/alerts/alerts.module').then(m => m.AlertsModule),      canActivate: [RoleGuard], data: { roles: ['admin'] } },
      { path: 'storefront', loadChildren: () => import('./features/storefront/storefront.module').then(m => m.StorefrontModule) },
      { path: 'settings',   loadChildren: () => import('./features/settings/settings.module').then(m => m.SettingsModule), canActivate: [RoleGuard], data: { roles: ['admin', 'cliente'] } },
      // ── NUEVAS RUTAS ────────────────────────────────────────────────────
      { path: 'suppliers',  loadChildren: () => import('./features/suppliers/suppliers.module').then(m => m.SuppliersModule),  canActivate: [RoleGuard], data: { roles: ['admin'] } },
      { path: 'purchases',  loadChildren: () => import('./features/purchases/purchases.module').then(m => m.PurchasesModule),  canActivate: [RoleGuard], data: { roles: ['admin'] } },
      { path: 'expenses',   loadChildren: () => import('./features/expenses/expenses.module').then(m => m.ExpensesModule),    canActivate: [RoleGuard], data: { roles: ['admin'] } },
      { path: 'finance',    loadChildren: () => import('./features/finance/finance.module').then(m => m.FinanceModule),       canActivate: [RoleGuard], data: { roles: ['admin'] } },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: 'login' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
