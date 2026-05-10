import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { InventoryComponent } from './inventory.component';

@NgModule({
  declarations: [InventoryComponent],
  imports: [CommonModule, FormsModule, RouterModule.forChild([{ path: '', component: InventoryComponent }])]
})
export class InventoryModule {}
