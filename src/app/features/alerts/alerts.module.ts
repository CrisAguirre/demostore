import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AlertsComponent } from './alerts.component';

@NgModule({
  declarations: [AlertsComponent],
  imports: [CommonModule, RouterModule.forChild([{ path: '', component: AlertsComponent }])]
})
export class AlertsModule {}
