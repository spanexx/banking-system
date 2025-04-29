import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router, ActivatedRoute } from '@angular/router';
import { TransferService } from '../services/transfer.service';

@Component({
  selector: 'app-verify-request',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './verify-request.component.html',
  styleUrls: ['./verify-request.component.scss']
})
export class VerifyRequestComponent implements OnInit {
  verifyForm: FormGroup;
  loading = false;
  requestId: string | null = null;

  constructor(
    private fb: FormBuilder,
    private transferService: TransferService,
    private snackBar: MatSnackBar,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.verifyForm = this.fb.group({
      code: ['', [Validators.required, Validators.pattern('^[0-9]{6}$')]]
    });
  }

  ngOnInit() {
    // Get the requestId from route params
    this.requestId = this.route.snapshot.queryParamMap.get('requestId');
    
    if (!this.requestId) {
      this.snackBar.open('No transfer request found', 'Close', {
        duration: 5000,
        panelClass: ['error-snackbar']
      });
      this.router.navigate(['/user/transfers']);
    }
  }

  onSubmit() {
    if (this.verifyForm.valid && this.requestId) {
      this.loading = true;
      const code = this.verifyForm.get('code')?.value;

      this.transferService.verifyTransfer(this.requestId, code).subscribe({
        next: (response) => {
          // Use the message from the response if it exists, otherwise use default message
          console.log(response);
          const successMessage = response.message || 'Transfer completed successfully!';
          this.snackBar.open(successMessage, 'Close', {
            duration: 7000, // Increased duration for international transfer messages
            panelClass: ['success-snackbar']
          });
          this.router.navigate(['/user/transactions']);
        },
        error: (error) => {
          this.snackBar.open(error.error?.message || 'Failed to verify transfer', 'Close', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
          this.loading = false;
        }
      });
    }
  }
}