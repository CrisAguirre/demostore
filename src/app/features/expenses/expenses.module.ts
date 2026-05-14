import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ExpensesComponent } from './expenses.component';

@NgModule({
  declarations: [ExpensesComponent],
  imports: [
    CommonModule, FormsModule,
    RouterModule.forChild([{ path: '', component: ExpensesComponent }])
  ]
})
export class ExpensesModule {}
