import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // ── Products ──
  getProducts(params?: any): Observable<any> {
    return this.http.get(`${this.baseUrl}/products`, { params });
  }
  getProduct(id: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/products/${id}`);
  }
  createProduct(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/products`, data);
  }
  updateProduct(id: string, data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/products/${id}`, data);
  }
  deleteProduct(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/products/${id}`);
  }
  updateStock(id: string, data: { quantity: number; type: 'entrada' | 'salida' }): Observable<any> {
    return this.http.patch(`${this.baseUrl}/products/${id}/stock`, data);
  }
  getNextBarcode(categoryId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/products/next-barcode`, { params: { categoryId } });
  }

  // ── Categories ──
  getCategories(): Observable<any> {
    return this.http.get(`${this.baseUrl}/categories`);
  }
  createCategory(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/categories`, data);
  }
  updateCategory(id: string, data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/categories/${id}`, data);
  }
  deleteCategory(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/categories/${id}`);
  }

  // ── Sales ──
  createSale(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/sales`, data);
  }
  getSales(params?: any): Observable<any> {
    return this.http.get(`${this.baseUrl}/sales`, { params });
  }
  getSale(id: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/sales/${id}`);
  }

  // ── Cash Closings ──
  openCash(initialAmount: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/cash-closings/open`, { initialAmount });
  }
  closeCash(id: string, data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/cash-closings/${id}/close`, data);
  }
  getCashClosings(params?: any): Observable<any> {
    return this.http.get(`${this.baseUrl}/cash-closings`, { params });
  }
  getCurrentCash(): Observable<any> {
    return this.http.get(`${this.baseUrl}/cash-closings/current`);
  }

  // ── Alerts ──
  getAlerts(params?: any): Observable<any> {
    return this.http.get(`${this.baseUrl}/alerts`, { params });
  }
  markAlertRead(id: string): Observable<any> {
    return this.http.patch(`${this.baseUrl}/alerts/${id}/read`, {});
  }
  markAllAlertsRead(): Observable<any> {
    return this.http.patch(`${this.baseUrl}/alerts/read-all`, {});
  }
  checkStockAlerts(): Observable<any> {
    return this.http.post(`${this.baseUrl}/alerts/check-stock`, {});
  }

  // ── Reports ──
  getSalesSummary(period?: string): Observable<any> {
    const params: any = period ? { period } : undefined;
    return this.http.get(`${this.baseUrl}/reports/sales-summary`, { params });
  }
  getTopProducts(limit?: number): Observable<any> {
    const params: any = limit ? { limit: limit.toString() } : undefined;
    return this.http.get(`${this.baseUrl}/reports/top-products`, { params });
  }
  getLowRotation(): Observable<any> {
    return this.http.get(`${this.baseUrl}/reports/low-rotation`);
  }
  getSalesByCategory(period?: string): Observable<any> {
    const params: any = period ? { period } : undefined;
    return this.http.get(`${this.baseUrl}/reports/sales-by-category`, { params });
  }
  getSalesByPayment(period?: string): Observable<any> {
    const params: any = period ? { period } : undefined;
    return this.http.get(`${this.baseUrl}/reports/sales-by-payment`, { params });
  }
  getSalesByHour(period?: string): Observable<any> {
    const params: any = period ? { period } : undefined;
    return this.http.get(`${this.baseUrl}/reports/sales-by-hour`, { params });
  }
  getInventoryValuation(): Observable<any> {
    return this.http.get(`${this.baseUrl}/reports/inventory-valuation`);
  }
  getProfitMargins(): Observable<any> {
    return this.http.get(`${this.baseUrl}/reports/profit-margins`);
  }

  // ── Storefront (Public) ──
  getStorefrontProducts(params?: any): Observable<any> {
    return this.http.get(`${this.baseUrl}/storefront/products`, { params });
  }
  getStorefrontCategories(): Observable<any> {
    return this.http.get(`${this.baseUrl}/storefront/categories`);
  }
  checkAvailability(id: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/storefront/products/${id}/availability`);
  }

  // ── Settings ──
  getSettings(): Observable<any> {
    return this.http.get(`${this.baseUrl}/settings`);
  }
  updateSettings(data: FormData): Observable<any> {
    return this.http.put(`${this.baseUrl}/settings`, data);
  }

  // ── Users (admin) ──
  registerUser(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth/register`, data);
  }
  changePassword(data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/auth/change-password`, data);
  }
}
