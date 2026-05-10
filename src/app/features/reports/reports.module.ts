import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReportsComponent } from './reports.component';

@NgModule({
  declarations: [ReportsComponent],
  imports: [CommonModule, RouterModule.forChild([{ path: '', component: ReportsComponent }])]
})
export class ReportsModule {}
