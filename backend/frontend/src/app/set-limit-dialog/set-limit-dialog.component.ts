import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-set-limit-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    FormsModule
  ],
  templateUrl: './set-limit-dialog.component.html',
  styleUrl: './set-limit-dialog.component.scss'
})
export class SetLimitDialogComponent {
  newLimit: number | null = null;

  constructor(
    public dialogRef: MatDialogRef<SetLimitDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { cardId: string, currentLimit: number | null }
  ) {}

  onCancelClick(): void {
    this.dialogRef.close();
  }

  onSaveClick(): void {
    if (this.newLimit !== null && !isNaN(this.newLimit)) {
      this.dialogRef.close(this.newLimit);
    }
  }
}
