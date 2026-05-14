import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { FinanceComponent } from './finance.component';

@NgModule({
  declarations: [FinanceComponent],
  imports: [
    CommonModule, FormsModule,
    RouterModule.forChild([{ path: '', component: FinanceComponent }])
  ]
})
export class FinanceModule {}
