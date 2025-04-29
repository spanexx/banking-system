import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AccountService } from '../services/account.service';
import { TransactionService } from '../services/transaction.service';
import { TransferService } from '../services/transfer.service';
import { AuthService } from '../services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-transfers',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    RouterModule
  ],
  templateUrl: './transfers.component.html',
  styleUrl: './transfers.component.scss'
})
export class TransfersComponent implements OnInit {
  transferForm: FormGroup;
  accounts: any[] = [];
  showPreview: boolean = false;
  loading: boolean = false;

  constructor(
    private fb: FormBuilder,
    private accountService: AccountService,
    private transferService: TransferService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {
    this.transferForm = this.fb.group({
      fromAccount: ['', Validators.required],
      toAccount: ['', [
        Validators.required, 
        Validators.pattern('^[A-Z]{2}[0-9]{2}[A-Z0-9]{4,}$|^[0-9]{8,}$')
      ]],
      amount: ['', [Validators.required, Validators.min(0.01)]],
      description: [''],
      bankName: ['SimpliBank'],
      accountHolderName: ['']
    });

    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras.state?.['accountId']) {
      this.transferForm.patchValue({
        fromAccount: navigation.extras.state['accountId']
      });
    }
  }

  ngOnInit() {
    this.loadUserAccounts();
    this.setupFormValidation();
  }

  loadUserAccounts() {
    const userId = this.authService.getCurrentUser()?._id;
    if (userId) {
      this.accountService.getAccountsByUserId(userId).subscribe({
        next: (accounts) => {
          this.accounts = accounts;
        },
        error: (error) => {
          this.snackBar.open('Error loading accounts', 'Close', {
            duration: 3000,
            panelClass: ['error-snackbar']
          });
          console.error('Error loading accounts:', error);
        }
      });
    }
  }

  setupFormValidation() {
    this.transferForm.get('fromAccount')?.valueChanges.subscribe(() => {
      this.validateAmount();
    });

    this.transferForm.get('amount')?.valueChanges.subscribe(() => {
      this.validateAmount();
    });
  }

  validateAmount() {
    const amount = this.transferForm.get('amount')?.value;
    const accountId = this.transferForm.get('fromAccount')?.value;
    const selectedAccount = this.accounts.find(acc => acc.accountNumber === accountId); // Find by account number

    if (selectedAccount && amount > selectedAccount.balance) {
      this.transferForm.get('amount')?.setErrors({ insufficientFunds: true });
    }
  }

  getSelectedAccountDetails(): string {
    const accountId = this.transferForm.get('fromAccount')?.value;
    const account = this.accounts.find(acc => acc._id === accountId);
    console.log('Selected account:', account);
    return account ? `${account.accountNumber} (${account.type}) - Balance: ${account.balance}` : '';
  }

  previewTransfer() {
    if (this.transferForm.valid) {
      this.showPreview = true;
    }
  }

  resetForm() {
    this.transferForm.reset();
    this.showPreview = false;
  }

  onSubmit() {
    if (this.transferForm.valid && this.showPreview) {
      this.loading = true;
      const formValue = this.transferForm.value;
      console.log('Form value:', formValue);

      this.transferService.createTransferRequest({
        fromAccountId: formValue.fromAccount!,
        toAccount: formValue.toAccount!,
        amount: formValue.amount!,
        description: formValue.description || undefined,
        bankName: formValue.bankName || 'SimpliBank',
        accountHolderName: formValue.accountHolderName || 'International Recipient'
      }).subscribe({
        next: (response) => {
          const message = response.message || 'Transfer request created. Please verify the transfer.';
          this.snackBar.open(message, 'Close', {
            duration: 5000,
            panelClass: ['success-snackbar']
          });
          this.router.navigate(['/user/verify-request'], {
            queryParams: { requestId: response.requestId }
          });
        },
        error: (error) => {
          console.error('Transfer request error:', error);
          this.snackBar.open(error.error?.message || 'Failed to create transfer request', 'Close', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
          this.loading = false;
        }
      });
    }
  }
}
