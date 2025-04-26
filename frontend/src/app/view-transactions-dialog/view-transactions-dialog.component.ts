import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-view-transactions-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule
  ],
  templateUrl: './view-transactions-dialog.component.html',
  styleUrl: './view-transactions-dialog.component.scss'
})
export class ViewTransactionsDialogComponent {
  transactions: any[] = [];

  constructor(
    public dialogRef: MatDialogRef<ViewTransactionsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { transactions: any[] }
  ) {
    this.transactions = data.transactions;
  }

  onCloseClick(): void {
    this.dialogRef.close();
  }
}
