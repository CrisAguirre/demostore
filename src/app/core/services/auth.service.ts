/**
 * auth.service.ts  (modified — triggers preload after every login)
 *
 * Changes vs original:
 *  - Injects PreloadService
 *  - After every successful login / registerClient / loginGuest,
 *    chains a preload() call so the cache is ready before the user
 *    sees any component.
 *  - Starts keep-alive on login, stops it on logout.
 *  - Clears the cache on logout.
 */

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, switchMap, tap } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { AuthResponse, User } from '../models/interfaces';
import { PreloadService } from './preload.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router,
    private preloadSvc: PreloadService
  ) {
    this.loadUser();
    // If the user is already logged in (page refresh), restart keep-alive
    if (this.isLoggedIn) {
      this.preloadSvc.startKeepAlive();
    }
  }

  private loadUser(): void {
    const user = localStorage.getItem('user');
    if (user) {
      this.currentUserSubject.next(JSON.parse(user));
    }
  }

  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  get isLoggedIn(): boolean {
    return !!this.getToken();
  }

  getToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  // ── Login ─────────────────────────────────────────────────────────────────

  login(email: string, password: string): Observable<any> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, { email, password }).pipe(
      tap(res => {
        this._saveSession(res);
      }),
      // After token is saved, fire preload so data is ready before routing
      switchMap(() => this.preloadSvc.preload()),
      tap(() => this.preloadSvc.startKeepAlive())
    );
  }

  registerClient(data: any): Observable<any> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register-client`, data).pipe(
      tap(res => this._saveSession(res)),
      switchMap(() => this.preloadSvc.preload()),
      tap(() => this.preloadSvc.startKeepAlive())
    );
  }

  loginGuest(): Observable<any> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login-guest`, {}).pipe(
      tap(res => this._saveSession(res)),
      switchMap(() => this.preloadSvc.preload()),
      tap(() => this.preloadSvc.startKeepAlive())
    );
  }

  // ── Other auth methods (unchanged) ────────────────────────────────────────

  updateProfile(data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/update-profile`, data).pipe(
      tap((res: any) => {
        const updatedUser = { ...this.currentUser, ...res.user };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        this.currentUserSubject.next(updatedUser);
      })
    );
  }

  refreshToken(): Observable<{ accessToken: string; refreshToken: string }> {
    const refreshToken = localStorage.getItem('refreshToken');
    return this.http.post<{ accessToken: string; refreshToken: string }>(
      `${this.apiUrl}/refresh`, { refreshToken }
    ).pipe(
      tap(res => {
        localStorage.setItem('accessToken', res.accessToken);
        localStorage.setItem('refreshToken', res.refreshToken);
      })
    );
  }

  logout(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
    this.preloadSvc.stopKeepAlive();
    this.preloadSvc.clear();          // wipe cached data on logout
    this.router.navigate(['/login']);
  }

  hasRole(...roles: string[]): boolean {
    return !!this.currentUser && roles.includes(this.currentUser.role);
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private _saveSession(res: AuthResponse): void {
    localStorage.setItem('accessToken', res.accessToken);
    localStorage.setItem('refreshToken', res.refreshToken);
    localStorage.setItem('user', JSON.stringify(res.user));
    this.currentUserSubject.next(res.user);
  }
}
