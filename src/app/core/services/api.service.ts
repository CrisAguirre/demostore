/**
 * api.service.ts  — cache-aware + módulos financieros
 *
 * Incluye: productos, categorías, ventas, caja, alertas, reportes,
 * storefront, settings, usuarios  +  proveedores, compras, gastos, finanzas.
 */

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PreloadService } from './preload.service';

const TTL = {
  products:          5  * 60 * 1000,
  categories:        10 * 60 * 1000,
  alerts:            2  * 60 * 1000,
  sales:             5  * 60 * 1000,
  reports:           5  * 60 * 1000,
  currentCash:       3  * 60 * 1000,
  settings:          30 * 60 * 1000,
  storefront:        5  * 60 * 1000,
  suppliers:         5  * 60 * 1000,
  expenseCategories: 60 * 60 * 1000,
  finance:           3  * 60 * 1000,
} as const;

@Injectable({ providedIn: 'root' })
export class ApiService {
  private baseUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private preload: PreloadService
  ) {}

  // ── Cache helpers ─────────────────────────────────────────────────────────

  private key(endpoint: string, params?: Record<string, any>): string {
    if (!params || Object.keys(params).length === 0) return endpoint;
    const sorted = Object.keys(params)
      .sort()
      .reduce((acc, k) => ({ ...acc, [k]: params[k] }), {});
    return `${endpoint}:${JSON.stringify(sorted)}`;
  }

  private cachedGet<T>(cacheKey: string, request: Observable<T>, ttl: number): Observable<T> {
    const cached = this.preload.get<T>(cacheKey);
    if (cached !== null) return of(cached);
    return request.pipe(tap(data => this.preload.set(cacheKey, data, ttl)));
  }

  // ── Products ──────────────────────────────────────────────────────────────

  /**
   * Returns ALL active products from cache or /products/all.
   * Both POS and Inventory use this for local-first search.
   */
  getAllProducts(): Observable<any> {
    return this.cachedGet(
      'all-products',
      this.http.get(`${this.baseUrl}/products/all`),
      TTL.products
    );
  }

  getProducts(params?: any): Observable<any> {
    const k = this.key('products', params);
    return this.cachedGet(k, this.http.get(`${this.baseUrl}/products`, { params }), TTL.products);
  }

  getProduct(id: string): Observable<any> {
    return this.cachedGet(`product:${id}`, this.http.get(`${this.baseUrl}/products/${id}`), TTL.products);
  }

  createProduct(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/products`, data).pipe(
      tap(() => { this.preload.invalidatePrefix('products'); this.preload.invalidate('all-products'); })
    );
  }

  updateProduct(id: string, data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/products/${id}`, data).pipe(
      tap(() => { this.preload.invalidatePrefix('products'); this.preload.invalidate(`product:${id}`); this.preload.invalidate('all-products'); })
    );
  }

  deleteProduct(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/products/${id}`).pipe(
      tap(() => { this.preload.invalidatePrefix('products'); this.preload.invalidate(`product:${id}`); this.preload.invalidate('all-products'); })
    );
  }

  updateStock(id: string, data: { quantity: number; type: 'entrada' | 'salida' }): Observable<any> {
    return this.http.patch(`${this.baseUrl}/products/${id}/stock`, data).pipe(
      tap(() => {
        this.preload.invalidatePrefix('products');
        this.preload.invalidate(`product:${id}`);
        this.preload.invalidate('all-products');
        this.preload.invalidatePrefix('alerts');
        this.preload.invalidatePrefix('sales-summary');
      })
    );
  }

  getNextBarcode(categoryId: string, supplierId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/products/next-barcode`, { params: { categoryId, supplierId } });
  }

  // ── Categories ────────────────────────────────────────────────────────────

  getCategories(): Observable<any> {
    return this.cachedGet('categories', this.http.get(`${this.baseUrl}/categories`), TTL.categories);
  }

  createCategory(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/categories`, data).pipe(
      tap(() => this.preload.invalidate('categories'))
    );
  }

  updateCategory(id: string, data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/categories/${id}`, data).pipe(
      tap(() => this.preload.invalidate('categories'))
    );
  }

  deleteCategory(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/categories/${id}`).pipe(
      tap(() => this.preload.invalidate('categories'))
    );
  }

  // ── Sales ─────────────────────────────────────────────────────────────────

  createSale(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/sales`, data).pipe(
      tap(() => {
        this.preload.invalidatePrefix('products');
        this.preload.invalidatePrefix('sales-summary');
        this.preload.invalidatePrefix('top-products');
        this.preload.invalidatePrefix('alerts');
        this.preload.invalidate('current-cash');
        this.preload.invalidatePrefix('finance');
      })
    );
  }

  getSales(params?: any): Observable<any> {
    const k = this.key('sales', params);
    return this.cachedGet(k, this.http.get(`${this.baseUrl}/sales`, { params }), TTL.sales);
  }

  getSale(id: string): Observable<any> {
    return this.cachedGet(`sale:${id}`, this.http.get(`${this.baseUrl}/sales/${id}`), TTL.sales);
  }

  // ── Cash Closings ─────────────────────────────────────────────────────────

  openCash(initialAmount: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/cash-closings/open`, { initialAmount }).pipe(
      tap(() => this.preload.invalidate('current-cash'))
    );
  }

  closeCash(id: string, data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/cash-closings/${id}/close`, data).pipe(
      tap(() => this.preload.invalidate('current-cash'))
    );
  }

  getCashClosings(params?: any): Observable<any> {
    return this.http.get(`${this.baseUrl}/cash-closings`, { params });
  }

  getCurrentCash(): Observable<any> {
    return this.cachedGet('current-cash', this.http.get(`${this.baseUrl}/cash-closings/current`), TTL.currentCash);
  }

  // ── Alerts ────────────────────────────────────────────────────────────────

  getAlerts(params?: any): Observable<any> {
    const k = this.key('alerts', params);
    return this.cachedGet(k, this.http.get(`${this.baseUrl}/alerts`, { params }), TTL.alerts);
  }

  markAlertRead(id: string): Observable<any> {
    return this.http.patch(`${this.baseUrl}/alerts/${id}/read`, {}).pipe(
      tap(() => this.preload.invalidatePrefix('alerts'))
    );
  }

  markAllAlertsRead(): Observable<any> {
    return this.http.patch(`${this.baseUrl}/alerts/read-all`, {}).pipe(
      tap(() => this.preload.invalidatePrefix('alerts'))
    );
  }

  checkStockAlerts(): Observable<any> {
    return this.http.post(`${this.baseUrl}/alerts/check-stock`, {}).pipe(
      tap(() => this.preload.invalidatePrefix('alerts'))
    );
  }

  // ── Reports ───────────────────────────────────────────────────────────────

  getSalesSummary(period?: string): Observable<any> {
    const k = period ? `sales-summary:${period}` : 'sales-summary:month';
    const params: any = period ? { period } : undefined;
    return this.cachedGet(k, this.http.get(`${this.baseUrl}/reports/sales-summary`, { params }), TTL.reports);
  }

  getTopProducts(limit?: number): Observable<any> {
    const k = `top-products:${limit ?? 10}`;
    const params: any = limit ? { limit: limit.toString() } : undefined;
    return this.cachedGet(k, this.http.get(`${this.baseUrl}/reports/top-products`, { params }), TTL.reports);
  }

  getLowRotation(): Observable<any> {
    return this.cachedGet('low-rotation', this.http.get(`${this.baseUrl}/reports/low-rotation`), TTL.reports);
  }

  getSalesByCategory(period?: string): Observable<any> {
    const k = `sales-by-category:${period ?? 'month'}`;
    const params: any = period ? { period } : undefined;
    return this.cachedGet(k, this.http.get(`${this.baseUrl}/reports/sales-by-category`, { params }), TTL.reports);
  }

  getSalesByPayment(period?: string): Observable<any> {
    const k = `sales-by-payment:${period ?? 'month'}`;
    const params: any = period ? { period } : undefined;
    return this.cachedGet(k, this.http.get(`${this.baseUrl}/reports/sales-by-payment`, { params }), TTL.reports);
  }

  getSalesByHour(period?: string): Observable<any> {
    const k = `sales-by-hour:${period ?? 'month'}`;
    const params: any = period ? { period } : undefined;
    return this.cachedGet(k, this.http.get(`${this.baseUrl}/reports/sales-by-hour`, { params }), TTL.reports);
  }

  getInventoryValuation(): Observable<any> {
    return this.cachedGet('inventory-valuation', this.http.get(`${this.baseUrl}/reports/inventory-valuation`), TTL.reports);
  }

  getProfitMargins(): Observable<any> {
    return this.cachedGet('profit-margins', this.http.get(`${this.baseUrl}/reports/profit-margins`), TTL.reports);
  }

  // ── Storefront (Public) ───────────────────────────────────────────────────

  getStorefrontProducts(params?: any): Observable<any> {
    const k = this.key('storefront-products', params);
    return this.cachedGet(k, this.http.get(`${this.baseUrl}/storefront/products`, { params }), TTL.storefront);
  }

  getStorefrontCategories(): Observable<any> {
    return this.cachedGet('storefront-categories', this.http.get(`${this.baseUrl}/storefront/categories`), TTL.storefront);
  }

  checkAvailability(id: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/storefront/products/${id}/availability`);
  }

  // ── Settings ──────────────────────────────────────────────────────────────

  getSettings(): Observable<any> {
    return this.cachedGet('settings', this.http.get(`${this.baseUrl}/settings`), TTL.settings);
  }

  updateSettings(data: FormData): Observable<any> {
    return this.http.put(`${this.baseUrl}/settings`, data).pipe(
      tap(() => this.preload.invalidate('settings'))
    );
  }

  // ── Users (admin) ─────────────────────────────────────────────────────────

  registerUser(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth/register`, data);
  }

  changePassword(data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/auth/change-password`, data);
  }

  // ── Suppliers ────────────────────────────────────────────────────────────

  getSuppliers(params?: any): Observable<any> {
    const k = this.key('suppliers', params);
    return this.cachedGet(k, this.http.get(`${this.baseUrl}/suppliers`, { params }), TTL.suppliers);
  }

  getSupplier(id: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/suppliers/${id}`);
  }

  createSupplier(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/suppliers`, data).pipe(
      tap(() => this.preload.invalidatePrefix('suppliers'))
    );
  }

  updateSupplier(id: string, data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/suppliers/${id}`, data).pipe(
      tap(() => this.preload.invalidatePrefix('suppliers'))
    );
  }

  deleteSupplier(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/suppliers/${id}`).pipe(
      tap(() => this.preload.invalidatePrefix('suppliers'))
    );
  }

  // ── Purchases ─────────────────────────────────────────────────────────────

  getPurchases(params?: any): Observable<any> {
    return this.http.get(`${this.baseUrl}/purchases`, { params });
  }

  getPurchase(id: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/purchases/${id}`);
  }

  createPurchase(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/purchases`, data).pipe(
      tap(() => {
        this.preload.invalidatePrefix('products');
        this.preload.invalidatePrefix('finance');
        this.preload.invalidatePrefix('inventory-valuation');
      })
    );
  }

  updatePurchaseStatus(id: string, status: string): Observable<any> {
    return this.http.patch(`${this.baseUrl}/purchases/${id}/status`, { status }).pipe(
      tap(() => this.preload.invalidatePrefix('products'))
    );
  }

  // ── Expenses ──────────────────────────────────────────────────────────────

  getExpenseCategories(): Observable<any> {
    return this.cachedGet(
      'expense-categories',
      this.http.get(`${this.baseUrl}/expenses/categories`),
      TTL.expenseCategories
    );
  }

  getExpenses(params?: any): Observable<any> {
    return this.http.get(`${this.baseUrl}/expenses`, { params });
  }

  createExpense(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/expenses`, data).pipe(
      tap(() => this.preload.invalidatePrefix('finance'))
    );
  }

  updateExpense(id: string, data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/expenses/${id}`, data).pipe(
      tap(() => this.preload.invalidatePrefix('finance'))
    );
  }

  deleteExpense(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/expenses/${id}`).pipe(
      tap(() => this.preload.invalidatePrefix('finance'))
    );
  }

  // ── Finance / Centro de Inteligencia Financiera ───────────────────────────

  getFinancialSummary(period?: string): Observable<any> {
    const k = `finance-summary:${period ?? 'month'}`;
    const params: any = period ? { period } : undefined;
    return this.cachedGet(k, this.http.get(`${this.baseUrl}/finance/summary`, { params }), TTL.finance);
  }

  getCashFlow(period?: string): Observable<any> {
    const k = `finance-cashflow:${period ?? 'month'}`;
    const params: any = period ? { period } : undefined;
    return this.cachedGet(k, this.http.get(`${this.baseUrl}/finance/cashflow`, { params }), TTL.finance);
  }

  getMonthlyPL(months?: number): Observable<any> {
    const k = `finance-monthly-pl:${months ?? 6}`;
    const params: any = months ? { months: months.toString() } : undefined;
    return this.cachedGet(k, this.http.get(`${this.baseUrl}/finance/monthly-pl`, { params }), TTL.finance);
  }

  // ── Debtors (Deudores) ──────────────────────────────────────────────────

  getDebtors(params?: any): Observable<any> {
    const k = this.key('debtors', params);
    return this.cachedGet(k, this.http.get(`${this.baseUrl}/debtors`, { params }), TTL.suppliers);
  }

  getDebtor(id: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/debtors/${id}`);
  }

  createDebtor(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/debtors`, data).pipe(
      tap(() => this.preload.invalidatePrefix('debtors'))
    );
  }

  updateDebtor(id: string, data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/debtors/${id}`, data).pipe(
      tap(() => this.preload.invalidatePrefix('debtors'))
    );
  }

  deleteDebtor(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/debtors/${id}`).pipe(
      tap(() => this.preload.invalidatePrefix('debtors'))
    );
  }

  addDebtorTransaction(id: string, data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/debtors/${id}/transactions`, data).pipe(
      tap(() => this.preload.invalidatePrefix('debtors'))
    );
  }

  getDebtorTransactions(id: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/debtors/${id}/transactions`);
  }

  getNextDebtorCode(): Observable<any> {
    return this.http.get(`${this.baseUrl}/debtors/next-code`);
  }

  checkDebtorMora(): Observable<any> {
    return this.http.post(`${this.baseUrl}/debtors/check-mora`, {}).pipe(
      tap(() => this.preload.invalidatePrefix('alerts'))
    );
  }
}

