import { Component, OnInit } from '@angular/core';
import { ApiService } from '@core/services/api.service';
import { SettingsService } from '@core/services/settings.service';
import { AuthService } from '@core/services/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-settings',
  template: `
    <div class="page-header">
      <h1>{{ isAdmin ? '⚙️ Configuración del Establecimiento' : '👤 Mi Perfil' }}</h1>
    </div>

    <div *ngIf="isAdmin" class="grid-2">
      <div class="neon-card">
        <h3 style="margin-bottom:1rem">🏪 Datos del Negocio</h3>
        <div class="form-group">
          <label class="form-label">Nombre del Establecimiento</label>
          <input class="form-input" [(ngModel)]="storeName">
        </div>
        <div class="form-group">
          <label class="form-label">Teléfono</label>
          <input class="form-input" [(ngModel)]="phone">
        </div>
        <div class="form-group">
          <label class="form-label">Dirección</label>
          <input class="form-input" [(ngModel)]="address">
        </div>
        <div class="form-group">
          <label class="form-label">WhatsApp (con código país: 573...)</label>
          <input class="form-input" [(ngModel)]="whatsappNumber" placeholder="573137733408">
        </div>
        <button class="btn-primary" (click)="saveSettings()">💾 Guardar Cambios</button>
      </div>
      <div class="neon-card-violet">
        <h3 style="margin-bottom:1rem">🖼️ Logo</h3>
        <div style="text-align:center;padding:1rem">
          <img *ngIf="currentLogo" [src]="currentLogo" alt="Logo actual" style="max-height:120px;margin:0 auto 1rem;border-radius:12px">
          <p *ngIf="!currentLogo" style="color:var(--text-muted);margin-bottom:1rem">Sin logo configurado</p>
          <input type="file" accept="image/*" (change)="onFileSelected($event)" #fileInput style="display:none">
          <button class="btn-outline" (click)="fileInput.click()">📤 Subir Logo</button>
          <p *ngIf="selectedFile" style="font-size:0.8rem;margin-top:0.5rem;color:var(--neon-green)">
            ✅ {{ selectedFile.name }}
          </p>
        </div>
      </div>
    </div>

    <div *ngIf="isCliente" class="grid-2">
      <div class="neon-card">
        <h3 style="margin-bottom:1rem">📝 Datos Personales</h3>
        <div class="form-group">
          <label class="form-label">Nombre</label>
          <input class="form-input" [(ngModel)]="userProfile.name">
        </div>
        <div class="form-group">
          <label class="form-label">Teléfono / Celular</label>
          <input class="form-input" [(ngModel)]="userProfile.phone">
        </div>
        <div class="form-group">
          <label class="form-label">Dirección</label>
          <input class="form-input" [(ngModel)]="userProfile.address">
        </div>
        <button class="btn-primary" (click)="saveProfile()">💾 Actualizar Perfil</button>
      </div>
    </div>
  `
})
export class SettingsComponent implements OnInit {
  isAdmin = false;
  isCliente = false;

  // Admin settings
  storeName = ''; phone = ''; address = ''; whatsappNumber = '';
  currentLogo = '';
  selectedFile: File | null = null;

  // Cliente profile
  userProfile = { name: '', phone: '', address: '' };

  constructor(private api: ApiService, private settingsService: SettingsService, private auth: AuthService) {}

  ngOnInit(): void {
    const role = this.auth.currentUser?.role;
    if (role === 'admin') {
      this.isAdmin = true;
      this.api.getSettings().subscribe({
        next: (s: any) => {
          this.storeName = s.storeName; this.phone = s.phone;
          this.address = s.address; this.whatsappNumber = s.whatsappNumber;
          this.currentLogo = s.logoUrl;
        }
      });
    } else if (role === 'cliente') {
      this.isCliente = true;
      const user = this.auth.currentUser;
      if (user) {
        this.userProfile.name = user.name || '';
        this.userProfile.phone = user.phone || '';
        this.userProfile.address = user.address || '';
      }
    }
  }

  onFileSelected(event: any): void { this.selectedFile = event.target.files[0]; }

  saveSettings(): void {
    const formData = new FormData();
    formData.append('storeName', this.storeName);
    formData.append('phone', this.phone);
    formData.append('address', this.address);
    formData.append('whatsappNumber', this.whatsappNumber);
    if (this.selectedFile) formData.append('logo', this.selectedFile);

    this.api.updateSettings(formData).subscribe({
      next: () => {
        this.settingsService.loadSettings();
        Swal.fire('✅', 'Configuración actualizada', 'success');
      },
      error: () => Swal.fire('❌', 'Error al guardar', 'error')
    });
  }

  saveProfile(): void {
    this.auth.updateProfile(this.userProfile).subscribe({
      next: () => {
        Swal.fire('✅', 'Perfil actualizado', 'success');
      },
      error: () => Swal.fire('❌', 'Error al actualizar perfil', 'error')
    });
  }
}
