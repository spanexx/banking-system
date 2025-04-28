import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NotificationService, Notification } from '../../services/notification.service';
import { AuthService } from '../../services/auth.service';
import { MessageDialogComponent } from '../../shared/components/message-dialog/message-dialog.component';

@Component({
  selector: 'app-notification-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatTooltipModule,
    MatDialogModule
  ],
  templateUrl: './notification-list.component.html',
  styleUrl: './notification-list.component.scss'
})
export class NotificationListComponent implements OnInit {
  notifications: Notification[] = [];
  isLoading = true;
  displayedColumns: string[] = ['type', 'message', 'time', 'status', 'actions'];

  constructor(
    private notificationService: NotificationService,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadNotifications();
  }

  loadNotifications(): void {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      this.isLoading = true;
      this.notificationService.getNotificationsByUserId(currentUser._id).subscribe({
        next: (notifications) => {
          this.notifications = notifications;
          this.isLoading = false;
        },
        error: (error) => {
          this.showError('Error loading notifications: ' + error.message);
          this.isLoading = false;
        }
      });
    }
  }

  viewNotificationDetails(notificationId: string): void {
    this.router.navigate(['user/notifications', notificationId]);
  }

  markAsRead(notification: Notification): void {
    if (!notification.read) {
      this.notificationService.markAsRead(notification.userId).subscribe({
        next: () => {
          this.showSuccess('Notification marked as read');
          this.loadNotifications(); // Reload to get updated list
        },
        error: (error) => {
          this.showError('Error marking notification as read: ' + error.message);
        }
      });
    }
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead().subscribe({
      next: () => {
        this.showSuccess('All notifications marked as read');
        this.loadNotifications(); // Reload to get updated list
      },
      error: (error) => {
        this.showError('Error marking all notifications as read: ' + error.message);
      }
    });
  }

  getNotificationIcon(type: string): string {
    switch (type) {
      case 'info':
        return 'info';
      case 'warning':
        return 'warning';
      case 'success':
        return 'check_circle';
      case 'error':
        return 'error';
      default:
        return 'notifications';
    }
  }

  deleteNotification(notification: Notification, event: Event): void {
    event.stopPropagation(); // Prevent navigation to details
    
    const dialogRef = this.dialog.open(MessageDialogComponent, {
      data: { message: 'Are you sure you want to delete this notification?' }
    });

    dialogRef.afterClosed().subscribe((result: boolean | undefined) => {
      if (result) {
        this.notificationService.deleteNotification(notification._id).subscribe({
          next: () => {
            this.showSuccess('Notification deleted successfully');
            this.loadNotifications(); // Reload the list
          },
          error: (error) => {
            this.showError('Error deleting notification: ' + error.message);
          }
        });
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
