/**
 * preload.service.ts
 *
 * Three responsibilities:
 *
 *  1. WARMUP  – pings /api/health the moment the app loads so Render's
 *               free-tier server wakes up before the user hits "Login".
 *
 *  2. PRELOAD – right after a successful login, calls GET /api/preload
 *               (a single request that runs ALL common queries in parallel
 *               on the backend) and stores every response in an in-memory
 *               cache with per-key TTLs.
 *
 *  3. KEEP-ALIVE – once logged in, pings /api/health every 13 min so
 *                  Render never spins the server down.
 *
 * ApiService reads from this cache before making any HTTP call.
 */

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

// ── TTLs (milliseconds) ──────────────────────────────────────────────────────
const TTL = {
  settings:     30 * 60 * 1000,  // 30 min — rarely changes
  categories:   10 * 60 * 1000,  // 10 min
  products:      5 * 60 * 1000,  //  5 min — stock fluctuates
  alerts:        2 * 60 * 1000,  //  2 min — time-sensitive
  salesSummary:  5 * 60 * 1000,  //  5 min
  topProducts:   5 * 60 * 1000,
  currentCash:   3 * 60 * 1000,
} as const;

interface CacheEntry<T = unknown> {
  data: T;
  expiresAt: number;
}

@Injectable({ providedIn: 'root' })
export class PreloadService {
  private readonly apiUrl   = environment.apiUrl;
  private cache             = new Map<string, CacheEntry>();
  private keepAliveTimer: ReturnType<typeof setInterval> | null = null;

  constructor(private http: HttpClient) {}

  // ── 1. Warmup ──────────────────────────────────────────────────────────────
  /**
   * Fire-and-forget ping to /api/health so Render wakes up.
   * Called from AppComponent.ngOnInit() — before the user even logs in.
   */
  warmup(): void {
    this.http.get(`${this.apiUrl}/health`).subscribe({
      next: () => console.log('🔥 Server warmed up'),
      error: ()  => console.warn('⚠️ Warmup ping failed (server may still be starting)')
    });
  }

  // ── 2. Preload ─────────────────────────────────────────────────────────────
  /**
   * ONE request → everything. Call this inside auth.service.ts right after
   * the login/register tap() so the token is already in localStorage.
   */
  preload(): Observable<any> {
    return this.http.get(`${this.apiUrl}/preload`).pipe(
      tap((payload: any) => {
        // Cache each slice with its own TTL
        this.set('settings',                   payload.settings,    TTL.settings);
        this.set('categories',                 payload.categories,  TTL.categories);
        // Products: keyed to match what POS requests → { active:'true', limit:200 }
        this.set('products:{"active":"true","limit":200}',
                                               payload.products,    TTL.products);
        // Alerts: unread filter
        this.set('alerts:{"read":"false"}',    payload.alerts,      TTL.alerts);
        // Sales summaries
        this.set('sales-summary:day',          payload.salesDay,    TTL.salesSummary);
        this.set('sales-summary:week',         payload.salesWeek,   TTL.salesSummary);
        // Top products
        this.set('top-products:5',             payload.topProducts, TTL.topProducts);
        // Current cash
        this.set('current-cash',               payload.currentCash, TTL.currentCash);

        console.log('✅ Preload complete — cache populated');
      })
    );
  }

  // ── 3. Keep-alive ──────────────────────────────────────────────────────────
  startKeepAlive(): void {
    if (this.keepAliveTimer) return; // already running
    this.keepAliveTimer = setInterval(() => {
      this.http.get(`${this.apiUrl}/health`).subscribe({
        error: () => console.warn('Keep-alive ping failed')
      });
    }, 13 * 60 * 1000); // every 13 minutes
  }

  stopKeepAlive(): void {
    if (this.keepAliveTimer) {
      clearInterval(this.keepAliveTimer);
      this.keepAliveTimer = null;
    }
  }

  // ── Cache primitives ───────────────────────────────────────────────────────
  get<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return entry.data;
  }

  set<T>(key: string, data: T, ttlMs: number): void {
    this.cache.set(key, { data, expiresAt: Date.now() + ttlMs });
  }

  /** Remove one or more exact keys */
  invalidate(...keys: string[]): void {
    keys.forEach(k => this.cache.delete(k));
  }

  /** Remove all keys that start with a given prefix */
  invalidatePrefix(prefix: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) this.cache.delete(key);
    }
  }

  /** Wipe everything (e.g. on logout) */
  clear(): void {
    this.cache.clear();
  }
}
