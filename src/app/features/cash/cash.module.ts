import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CashComponent } from './cash.component';

@NgModule({
  declarations: [CashComponent],
  imports: [CommonModule, FormsModule, RouterModule.forChild([{ path: '', component: CashComponent }])]
})
export class CashModule {}
