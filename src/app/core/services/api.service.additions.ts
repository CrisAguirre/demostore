// ── MÉTODOS A AGREGAR al final de api.service.ts ────────────────────────────
// (pegar antes del cierre de clase)

  // ── Suppliers ────────────────────────────────────────────────────────────
  getSuppliers(params?: any): Observable<any> {
    return this.cachedGet('suppliers',
      this.http.get(`${this.baseUrl}/suppliers`, { params }),
      5 * 60 * 1000
    );
  }
  getSupplier(id: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/suppliers/${id}`);
  }
  createSupplier(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/suppliers`, data).pipe(
      tap(() => this.preload.invalidate('suppliers'))
    );
  }
  updateSupplier(id: string, data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/suppliers/${id}`, data).pipe(
      tap(() => this.preload.invalidate('suppliers'))
    );
  }
  deleteSupplier(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/suppliers/${id}`).pipe(
      tap(() => this.preload.invalidate('suppliers'))
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
    return this.cachedGet('expense-categories',
      this.http.get(`${this.baseUrl}/expenses/categories`),
      60 * 60 * 1000
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
    return this.cachedGet(k,
      this.http.get(`${this.baseUrl}/finance/summary`, { params }),
      3 * 60 * 1000
    );
  }
  getCashFlow(period?: string): Observable<any> {
    const k = `finance-cashflow:${period ?? 'month'}`;
    const params: any = period ? { period } : undefined;
    return this.cachedGet(k,
      this.http.get(`${this.baseUrl}/finance/cashflow`, { params }),
      3 * 60 * 1000
    );
  }
  getMonthlyPL(months?: number): Observable<any> {
    const k = `finance-monthly-pl:${months ?? 6}`;
    const params: any = months ? { months: months.toString() } : undefined;
    return this.cachedGet(k,
      this.http.get(`${this.baseUrl}/finance/monthly-pl`, { params }),
      5 * 60 * 1000
    );
  }
