import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { TransferRequestService } from '../../services/transfer-request.service';
import { TransactionService } from '../../services/transaction.service';
import { CancellationReasonDialogComponent } from '../../src/app/admin/cancellation-reason-dialog/cancellation-reason-dialog.component';

@Component({
  selector: 'app-transfer-request-manager',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatDialogModule
  ],
  templateUrl: './transfer-request-manager.component.html',
  styleUrls: ['./transfer-request-manager.component.scss']
})
export class TransferRequestManagerComponent implements OnInit {
  transferRequests: any[] = [];
  displayedColumns: string[] = ['requestId', 'fromAccount', 'toAccount', 'amount', 'status', 'transactionStatus', 'date', 'actions'];
  isLoading = false;
  error: string | null = null;

  constructor(
    private transferRequestService: TransferRequestService,
    private transactionService: TransactionService,
    private snackBar: MatSnackBar,
    public dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadTransferRequests();
  }

  loadTransferRequests(): void {
    this.isLoading = true;
    this.error = null;

    this.transferRequestService.getTransferRequests().subscribe({
      next: (requests) => {
        console.log('Transfer requests loaded:', requests);
        this.transferRequests = requests;

        const transactionFetches = requests.map(request => {
          if (request._id) {
            return this.transactionService.getTransactionByRequestId(request._id).toPromise()
              .then(transaction => {
                console.log(`Transaction for request ${request._id} loaded:`, transaction);
                return {
                  ...request,
                  transactionId: transaction?._id,
                  transactionStatus: transaction?.status || 'N/A'
                };
              })
              .catch(error => {
                console.error(`Error fetching transaction for request ${request._id}:`, error);
                return {
                  ...request,
                  transactionId: undefined,
                  transactionStatus: 'Error'
                };
              });
          } else {
            return Promise.resolve({
              ...request,
              transactionId: undefined,
              transactionStatus: 'N/A'
            });
          }
        });

        Promise.all(transactionFetches).then(updatedRequests => {
          this.transferRequests = updatedRequests;
          this.isLoading = false;
        }).catch(error => {
          console.error('Error processing transactions for requests:', error);
          this.error = 'Failed to load transaction statuses';
          this.isLoading = false;
          this.showError(this.error);
        });
      },
      error: (error) => {
        console.error('Error loading transfer requests:', error);
        const errorMessage = error.error?.message || 'Failed to load transfer requests';
        this.error = errorMessage;
        this.isLoading = false;
        this.showError(errorMessage);
      }
    });
  }

  confirmTransaction(request: any): void {
    if (!request._id) {
      this.showError('Invalid request ID');
      return;
    }

    this.transactionService.getTransactionByRequestId(request._id).subscribe({
      next: (transaction) => {
        if (transaction && transaction._id) {
          this.transactionService.updateTransactionStatus(transaction._id, 'Confirmed').subscribe({
            next: () => {
              this.showSuccess('Transaction status updated to Confirmed');
              const index = this.transferRequests.findIndex(r => r._id === request._id);
              if (index !== -1) {
                this.transferRequests[index].transactionStatus = 'Confirmed';
              }
            },
            error: (error) => {
              console.error('Error updating transaction status:', error);
              this.showError(error.error?.message || 'Failed to update transaction status');
            }
          });
        } else {
          this.showError('No transaction found for this request');
        }
      },
      error: (error) => {
        console.error('Error fetching transaction:', error);
        this.showError('Failed to fetch transaction details');
      }
    });
  }

  rejectTransaction(request: any): void {
    if (!request._id) {
      this.showError('Invalid request ID');
      return;
    }

    // First get the transaction to get its ID
    this.transactionService.getTransactionByRequestId(request._id).subscribe({
      next: (transaction) => {
        if (transaction && transaction._id) {
          const dialogRef = this.dialog.open(CancellationReasonDialogComponent, {
            width: '400px',
            data: {}
          });

          dialogRef.afterClosed().subscribe(result => {
            if (result) {
              this.isLoading = true;
              // Format the description to include transaction ID
              const description = `For transaction ${transaction.transactionId}-${result}`;
              
              // Update transaction status to Cancelled
              this.transactionService.updateTransactionStatus(transaction._id, 'Cancelled').subscribe({
                next: () => {
                  // After updating status, proceed with cancellation and refund
                  this.transactionService.cancelTransferRequestAndReturnFunds(request._id, description).subscribe({
                    next: (response) => {
                      console.log('Cancellation and refund successful:', response);
                      this.showSuccess('Transfer request cancelled and funds returned successfully.');
                      this.loadTransferRequests();
                    },
                    error: (error) => {
                      console.error('Error cancelling transfer request and returning funds:', error);
                      this.showError(error.error?.message || 'Failed to cancel transfer request and return funds.');
                      this.isLoading = false;
                    }
                  });
                },
                error: (error) => {
                  console.error('Error updating transaction status:', error);
                  this.showError('Failed to update transaction status');
                  this.isLoading = false;
                }
              });
            } else {
              console.log('Cancellation reason dialog closed without input.');
            }
          });
        } else {
          this.showError('No transaction found for this request');
          this.isLoading = false;
        }
      },
      error: (error) => {
        console.error('Error fetching transaction:', error);
        this.showError('Failed to fetch transaction details');
        this.isLoading = false;
      }
    });
  }

  deleteRequest(requestId: string | undefined): void {
    if (!requestId) {
      this.showError('Invalid request ID');
      return;
    }

    if (confirm('Are you sure you want to delete this transfer request?')) {
      this.transferRequestService.deleteTransferRequest(requestId).subscribe({
        next: () => {
          this.showSuccess('Transfer request deleted successfully');
          this.loadTransferRequests();
        },
        error: (error) => {
          console.error('Error deleting transfer request:', error);
          this.showError(error.error?.message || 'Failed to delete request');
          this.loadTransferRequests();
        }
      });
    }
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }
}