import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TransactionService } from '../../services/transaction.service';

@Component({
  selector: 'app-card-transaction',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './card-transaction.component.html',
  styleUrl: './card-transaction.component.scss'
})
export class CardTransactionComponent {
  cardTransaction = {
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    amount: 0,
    merchantDetails: '',
    transactionType: 'purchase'
  };

  successMessage: string | null = null;
  errorMessage: string | null = null;

  constructor(private transactionService: TransactionService) {}

  createCardTransaction(): void {
    if (!this.isFormValid()) {
      this.errorMessage = 'Please fill in all required fields';
      return;
    }

    this.transactionService.createCardTransaction(this.cardTransaction).subscribe({
      next: (response) => {
        this.successMessage = 'Card transaction created successfully!';
        this.errorMessage = null;
        this.resetForm();
      },
      error: (error) => {
        this.errorMessage = 'Error creating card transaction: ' + (error.error?.message || error.message);
        this.successMessage = null;
      }
    });
  }

  isFormValid(): boolean {
    const { cardNumber, expiryDate, cvv, amount, merchantDetails, transactionType } = this.cardTransaction;
    return !!(cardNumber && expiryDate && cvv && amount > 0 && merchantDetails && transactionType);
  }

  private resetForm(): void {
    this.cardTransaction = {
      cardNumber: '',
      expiryDate: '',
      cvv: '',
      amount: 0,
      merchantDetails: '',
      transactionType: 'purchase'
    };
  }
}