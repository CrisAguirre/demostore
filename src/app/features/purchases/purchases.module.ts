import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { PurchasesComponent } from './purchases.component';

@NgModule({
  declarations: [PurchasesComponent],
  imports: [
    CommonModule, FormsModule,
    RouterModule.forChild([{ path: '', component: PurchasesComponent }])
  ]
})
export class PurchasesModule {}
