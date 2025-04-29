import { Component } from '@angular/core';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-cancellation-reason-dialog',
  standalone: true,
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    FormsModule
  ],
  templateUrl: './cancellation-reason-dialog.component.html',
  styleUrl: './cancellation-reason-dialog.component.scss'
})
export class CancellationReasonDialogComponent {
  cancellationReason: string = '';

  constructor(
    public dialogRef: MatDialogRef<CancellationReasonDialogComponent>
  ) {}

  onCancel(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    this.dialogRef.close(this.cancellationReason);
  }
}
