import { Component, OnInit } from '@angular/core';
import { AccountService } from '../services/account.service';
import { UserService } from '../services/user.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-admin-create-account',
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatRadioModule,
    MatButtonModule,
    MatIconModule,
    RouterModule
  ],
  templateUrl: './admin-create-account.component.html',
  styleUrl: './admin-create-account.component.scss'
})
export class AdminCreateAccountComponent implements OnInit {
  newAccount = { type: '', initialDeposit: 0 };
  selectedUserId: string = '';
  users: any[] = [];
  successMessage: string | null = null;
  errorMessage: string | null = null;

  constructor(
    private accountService: AccountService,
    private userService: UserService
  ) { }

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.userService.getUsers().subscribe(
      (data) => {
        this.users = data;
      },
      (error) => {
        this.errorMessage = 'Error loading users: ' + error.message;
      }
    );
  }

  createAccount(): void {
    if (!this.isFormValid()) {
      this.errorMessage = 'Please fill in all required fields';
      return;
    }

    this.accountService.createAccount(this.selectedUserId, this.newAccount.type, this.newAccount.initialDeposit).subscribe(
      (response) => {
        this.successMessage = 'Account created successfully!';
        this.errorMessage = null;
        this.resetForm();
      },
      (error) => {
        this.errorMessage = 'Error creating account: ' + (error.error?.message || error.message);
        this.successMessage = null;
      }
    );
  }

  isFormValid(): boolean {
    return !!(this.selectedUserId && this.newAccount.type && this.newAccount.initialDeposit >= 0);
  }

  private resetForm(): void {
    this.selectedUserId = '';
    this.newAccount = { type: '', initialDeposit: 0 };
  }
}