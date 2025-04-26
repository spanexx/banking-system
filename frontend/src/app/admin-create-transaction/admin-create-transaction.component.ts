import { Component, OnInit } from '@angular/core';
import { TransactionService } from '../services/transaction.service';
import { AccountService } from '../services/account.service';
import { UserService } from '../services/user.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { CardTransactionComponent } from './card-transaction/card-transaction.component';

@Component({
  selector: 'app-admin-create-transaction',
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatIconModule,
    RouterModule,
    MatTabsModule,
    CardTransactionComponent
  ],
  templateUrl: './admin-create-transaction.component.html',
  styleUrl: './admin-create-transaction.component.scss'
})
export class AdminCreateTransactionComponent implements OnInit {
  newTransaction = {
    accountId: '',
    receiverIdentifier: '',
    type: '',
    amount: 0,
    date: new Date(),
    time: '',
    description: '',
    bankName: 'SimpliBank',
    accountHolderName: ''
  };
  accounts: any[] = [];
  successMessage: string | null = null;
  errorMessage: string | null = null;

  constructor(
    private transactionService: TransactionService,
    private accountService: AccountService
  ) { }

  ngOnInit(): void {
    this.loadAccounts();
  }

  loadAccounts(): void {
    this.accountService.getAllAccounts().subscribe(
      (data) => {
        this.accounts = data;
      },
      (error) => {
        this.errorMessage = 'Error loading accounts: ' + error.message;
      }
    );
  }

  createTransaction(): void {
    if (!this.isFormValid()) {
      this.errorMessage = 'Please fill in all required fields';
      return;
    }

    // Combine date and time
    let transactionDate = this.newTransaction.date;
    if (this.newTransaction.time) {
      const [hours, minutes] = this.newTransaction.time.split(':').map(Number);
      transactionDate.setHours(hours, minutes);
    }

    const transactionToSend = {
      ...this.newTransaction,
      date: transactionDate,
      bankName: this.newTransaction.bankName || 'SimpliBank',
      accountHolderName: this.newTransaction.accountHolderName || 'International Recipient'
    };

    console.log('Transaction to send:', transactionToSend);

    this.transactionService.createTransaction(transactionToSend).subscribe(
      (response) => {
        this.successMessage = 'Transaction created successfully!';
        this.errorMessage = null;
        this.resetForm();
      },
      (error) => {
        this.errorMessage = 'Error creating transaction: ' + (error.error?.message || error.message);
        this.successMessage = null;
      }
    );
  }

  getAccountNumber(accountId: string): string {
    const account = this.accounts.find(acc => acc._id === accountId);
    return account ? `${account.accountNumber} (${account.type})` : '';
  }

  isFormValid(): boolean {
    const { type, accountId, amount } = this.newTransaction;
    if (!type || !accountId || amount <= 0) return false;
    if (type === 'transfer' && !this.newTransaction.receiverIdentifier) return false;
    return true;
  }

  private resetForm(): void {
    this.newTransaction = {
      accountId: '',
      receiverIdentifier: '',
      type: '',
      amount: 0,
      date: new Date(),
      time: '',
      description: '',
      bankName: 'SimpliBank',
      accountHolderName: ''
    };
  }
}