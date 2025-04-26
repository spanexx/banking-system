import { Component, OnInit } from '@angular/core';
import { UserService } from '../services/user.service';
import { AccountService } from '../services/account.service';
import { ActivityLogService } from '../services/activity-log.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TransactionService } from '../services/transaction.service';
import { Transaction } from '../transaction.model';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ActivityDetailsModalComponent } from './activity-details-modal/activity-details-modal.component';

interface Activity {
  _id: string;
  user: string; // Assuming user is an ID, adjust if it's an object
  action: string;
  metadata: any; // Use a more specific interface if the structure is known
  date: string; // Or Date if you convert it
  createdAt: string; // Or Date
  updatedAt: string; // Or Date
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule
  ],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss'
})
export class AdminDashboardComponent implements OnInit {
  users: any[] = [];
  accounts: any[] = [];
  transactions: Transaction[] = [];
  recentActivities: Activity[] = [];

  totalUsers: number = 0;
  totalAccountsCreatedCurrentMonth: number = 0;
  currentActiveAccountsCount: number = 0; // New property for current active accounts
  totalTransactionsCount: number = 0;
  totalRevenue: number = 0;

  prevMonthTotalUsers: number = 0;
  totalAccountsCreatedPrevMonth: number = 0;
  prevMonthTotalTransactionsCount: number = 0;
  prevMonthTotalRevenue: number = 0;

  userChangePercent: number = 0;
  accountsCreatedChangePercent: number = 0;
  transactionsChangePercent: number = 0;
  revenueChangePercent: number = 0;

  constructor(
    private userService: UserService,
    private accountService: AccountService,
    private transactionService: TransactionService,
    private activityLogService: ActivityLogService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadCurrentUserStats();
    this.loadPreviousMonthStats();
    this.loadRecentActivities();
  }

  loadCurrentUserStats(): void {
    // Load current month's data
    this.loadUsers();
    this.loadAccounts();
    this.loadTransactions();
  }

  loadPreviousMonthStats(): void {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    const prevMonthStartDate = new Date(currentYear, currentMonth - 1, 1);
    const prevMonthEndDate = new Date(currentYear, currentMonth, 0);

    // Load previous month's user count
    this.userService.getUserCountByDateRange(prevMonthStartDate.toISOString(), prevMonthEndDate.toISOString()).subscribe(
      (response: any) => {
        this.prevMonthTotalUsers = response.count;
        this.calculatePercentageChanges();
      },
      (error: any) => {
        console.error('Error fetching previous month user count:', error);
      }
    );

    // Load previous month's account count
    this.accountService.getAccountCountByDateRange(prevMonthStartDate.toISOString(), prevMonthEndDate.toISOString()).subscribe(
      (response: any) => {
        this.totalAccountsCreatedPrevMonth = response.count;
        this.calculatePercentageChanges();
      },
      (error: any) => {
        console.error('Error fetching previous month account count:', error);
      }
    );

    // Load previous month's transactions and calculate revenue
    this.transactionService.getAllTransactions(prevMonthStartDate.toISOString(), prevMonthEndDate.toISOString()).subscribe(
      (transactions: any[]) => {
        this.prevMonthTotalTransactionsCount = transactions.length;
        this.prevMonthTotalRevenue = transactions.reduce((total, transaction) => total + transaction.amount, 0);
        this.calculatePercentageChanges();
      },
      (error: any) => {
        console.error('Error fetching previous month transactions:', error);
      }
    );
  }

  loadUsers(): void {
    this.userService.getActiveUserCount().subscribe(
      (response: any) => {
        this.totalUsers = response.count; // Update totalUsers with active user count
        this.calculatePercentageChanges();
      },
      (error: any) => {
        console.error('Error fetching active user count:', error);
      }
    );
    // Note: We are no longer fetching all users here, so this.users will remain empty.
    // If the list of all users is needed elsewhere, a separate call would be required.
  }

  loadAccounts(): void {
    // Fetch current month's total accounts created
    const today = new Date();
    const currentMonthStartDate = new Date(today.getFullYear(), today.getMonth(), 1);
    const currentMonthEndDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    this.accountService.getAccountCountByDateRange(currentMonthStartDate.toISOString(), currentMonthEndDate.toISOString()).subscribe(
      (response: any) => {
        this.totalAccountsCreatedCurrentMonth = response.count;
        this.calculatePercentageChanges();
      },
      (error: any) => {
        console.error('Error fetching current month account count:', error);
      }
    );

    // Fetch current active accounts count (using the new endpoint)
    this.accountService.getCurrentlyActiveAccountCount().subscribe(
      (response: any) => {
        this.currentActiveAccountsCount = response.count; // Keep this for the main stat display
        // Note: Percentage change for active accounts will compare current active count to previous month's active count.
        // We don't have a backend endpoint for historical active count, so this percentage will be based on total accounts created for now.
        // A more accurate active account change would require backend changes.
        this.calculatePercentageChanges();
      },
      (error: any) => {
        console.error('Error fetching currently active account count:', error);
      }
    );
  }

  loadTransactions(): void {
    // Load current month's transactions
    const today = new Date();
    const currentMonthStartDate = new Date(today.getFullYear(), today.getMonth(), 1);
    const currentMonthEndDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    this.transactionService.getAllTransactions(currentMonthStartDate.toISOString(), currentMonthEndDate.toISOString()).subscribe(
      (transactions: any[]) => {
        this.transactions = transactions;
        this.totalTransactionsCount = transactions.length; // Calculate total transactions
        this.totalRevenue = this.getTotalRevenue(); // Calculate total revenue
        this.calculatePercentageChanges();
      },
      (error: any) => {
        console.error('Error fetching current month transactions:', error);
      }
    );
  }

  loadRecentActivities(): void {
    this.activityLogService.getRecentActivities().subscribe(
      (activities: Activity[]) => {
        this.recentActivities = activities;
      },
      (error: any) => {
        console.error('Error fetching recent activities:', error);
      }
    );
  }

  getTotalRevenue(): number {
    return this.transactions.reduce((total, transaction) => total + transaction.amount, 0);
  }

  calculatePercentageChange(current: number, previous: number): number {
    if (previous === 0) {
      return current > 0 ? 100 : 0;
    }
    return ((current - previous) / previous) * 100;
  }

  calculatePercentageChanges(): void {
    this.userChangePercent = this.calculatePercentageChange(this.totalUsers, this.prevMonthTotalUsers);
    this.accountsCreatedChangePercent = this.calculatePercentageChange(this.totalAccountsCreatedCurrentMonth, this.totalAccountsCreatedPrevMonth);
    this.transactionsChangePercent = this.calculatePercentageChange(this.totalTransactionsCount, this.prevMonthTotalTransactionsCount);
    this.revenueChangePercent = this.calculatePercentageChange(this.totalRevenue, this.prevMonthTotalRevenue);
  }

  getActivityIcon(type: string): string {
    switch (type) {
      case 'Create Account':
        return 'account_balance';
      case 'Create User':
        return 'person_add';
      case 'Transfer':
        return 'sync_alt';
      default:
        return 'info';
    }
  }

  viewActivityDetails(activity: Activity): void {
    this.dialog.open(ActivityDetailsModalComponent, {
      width: '500px',
      data: { activity: activity }
    });
  }
}
