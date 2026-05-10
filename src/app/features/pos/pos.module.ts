import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { PosComponent } from './pos.component';

@NgModule({
  declarations: [PosComponent],
  imports: [CommonModule, FormsModule, RouterModule.forChild([{ path: '', component: PosComponent }])]
})
export class PosModule {}
