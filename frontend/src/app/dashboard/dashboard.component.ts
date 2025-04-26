import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { TransactionService } from '../services/transaction.service';
import { AuthService } from '../services/auth.service';
import { AccountService } from '../services/account.service';
import { Transaction } from '../transaction.model';

interface Account {
  _id: string;
  accountNumber: string;
  type: string;
  balance: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  recentTransactions: Transaction[] = [];
  accounts: Account[] = [];
  currentUser: any;
  totalIncome: number = 0;
  totalExpense: number = 0;
  loading: boolean = false;
  error: string | null = null;
  monthlyIncome: number = 0;
  monthlyExpenses: number = 0;

  constructor(
    private transactionService: TransactionService,
    private authService: AuthService,
    private accountService: AccountService,
    private router: Router
  ) {}

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    this.loadAccounts();
    this.loadRecentTransactions();
    this.loadTransactionSummary();
  }

  loadAccounts() {
    if (this.currentUser?._id) {
      this.accountService.getAccountsByUserId(this.currentUser._id).subscribe({
        next: (accounts: Account[]) => {
          this.accounts = accounts;
        },
        error: (error: Error) => {
          console.error('Error loading accounts:', error);
          this.error = error.message;
        }
      });
    }
  }

  getTotalBalance(): number {
    return this.accounts.reduce((total, account) => total + account.balance, 0);
  }

  getBalanceChange(): number {
    // This would typically come from comparing current vs previous month balance
    // For now returning a mock value
    return 5.2;
  }

  getBalanceChangeClass(): string {
    const change = this.getBalanceChange();
    return change >= 0 ? 'positive' : 'negative';
  }

  getBalanceChangeIcon(): string {
    const change = this.getBalanceChange();
    return change >= 0 ? 'arrow_upward' : 'arrow_downward';
  }

  getAccountIcon(accountType: string): string {
    switch (accountType.toLowerCase()) {
      case 'savings':
        return 'savings';
      case 'checking':
        return 'account_balance';
      default:
        return 'account_balance_wallet';
    }
  }

  getTransactionTypeClass(type: string): string {
    switch (type.toLowerCase()) {
      case 'deposit':
        return 'credit';
      case 'withdrawal':
      case 'transfer':
        return 'debit';
      default:
        return '';
    }
  }

  getTransactionIcon(type: string): string {
    switch (type.toLowerCase()) {
      case 'deposit':
        return 'arrow_downward';
      case 'withdrawal':
        return 'arrow_upward';
      case 'transfer':
        return 'sync_alt';
      default:
        return 'swap_horiz';
    }
  }

  loadRecentTransactions() {
    this.loading = true;
    if (this.currentUser && this.currentUser._id) {
      this.transactionService.getTransactionsByUserId(this.currentUser._id).subscribe({
        next: (transactions: Transaction[]) => {
          this.recentTransactions = transactions.slice(0, 5); // Get last 5 transactions
          this.loading = false;
        },
        error: (error: Error) => {
          console.error('Error loading recent transactions:', error);
          this.error = error.message;
          this.loading = false;
        }
      });
    }
  }

  loadTransactionSummary() {
    if (!this.currentUser?._id) return;

    // Get the date range for the current month
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();

    this.transactionService.getTransactionsByUserId(
      this.currentUser._id,
      startDate,
      endDate
    ).subscribe({
      next: (transactions: Transaction[]) => {
        // Calculate income (deposits)
        this.totalIncome = transactions
          .filter(t => t.type === 'deposit')
          .reduce((sum: number, t: Transaction) => sum + t.amount, 0);

        // Calculate expenses (withdrawals and transfers)
        this.totalExpense = transactions
          .filter(t => t.type === 'withdrawal' || t.type === 'transfer')
          .reduce((sum: number, t: Transaction) => sum + t.amount, 0);
      },
      error: (error: Error) => {
        console.error('Error loading transaction summary:', error);
        this.error = error.message;
      }
    });
  }

  loadDashboardData(): void {
    this.loading = true;
    this.error = null;
    
    // Load user accounts
    this.loadAccounts();
    
    // Load recent transactions
    this.loadRecentTransactions();
    
    // Load transaction summary
    this.loadTransactionSummary();
    
    // Update loading state when all data is loaded
    this.loading = false;
  }

}
