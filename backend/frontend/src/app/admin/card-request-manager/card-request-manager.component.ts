import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RequestCardService } from '../../services/request-card.service';

@Component({
  selector: 'app-card-request-manager',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  templateUrl: './card-request-manager.component.html',
  styleUrl: './card-request-manager.component.scss'
})
export class CardRequestManagerComponent implements OnInit {
  pendingRequests: any[] = [];
  displayedColumns: string[] = ['user', 'accountType', 'cardType', 'requestDate', 'status', 'actions'];
  isLoading = false;
  error: string | null = null;

  constructor(
    private requestCardService: RequestCardService,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.getPendingRequests();
  }

  getPendingRequests(): void {
    this.isLoading = true;
    this.error = null;
    
    this.requestCardService.getPendingCardRequests().subscribe({
      next: (requests) => {
        this.pendingRequests = requests;
        this.isLoading = false;
      },
      error: (error) => {
        this.error = error.message || 'Failed to load card requests';
        this.isLoading = false;
        if (this.error) {
          this.showError(this.error);
        }
      }
    });
  }

  updateRequestStatus(requestId: string, status: 'Approved' | 'Rejected'): void {
    this.isLoading = true;
    // Convert status to lowercase before sending to backend
    this.requestCardService.updateCardRequestStatus(requestId, status.toLowerCase()).subscribe({
      next: (response) => {
        this.showSuccess(`Card request ${status.toLowerCase()}`);
        this.getPendingRequests();
      },
      error: (error) => {
        this.error = error.error?.message || `Failed to ${status.toLowerCase()} request`;
        this.isLoading = false;
        if (this.error) {
          this.showError(this.error);
        }
      }
    });
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
