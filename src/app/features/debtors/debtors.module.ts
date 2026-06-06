import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DebtorsComponent } from './debtors.component';

@NgModule({
  declarations: [DebtorsComponent],
  imports: [
    CommonModule, FormsModule,
    RouterModule.forChild([{ path: '', component: DebtorsComponent }])
  ]
})
export class DebtorsModule {}
