import { Component, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupportMessageService } from '../../services/support-message.service';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { SelectionModel } from '@angular/cdk/collections';
import { ImagePreviewDialogComponent } from './image-preview-dialog.component'; // Import the new dialog component

interface SupportMessage {
  _id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'open' | 'in-progress' | 'closed';
  createdAt: Date;
  updatedAt: Date;
  messageType?: string;
  metadata?: {
    phone?: string;
    address?: string;
    dob?: string;
    accountType?: string;
    identificationDocument?: string;
  };
}

@Component({
  selector: 'app-support-messages',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatCardModule,
    MatCheckboxModule,
    MatChipsModule,
    MatProgressBarModule,
    MatTooltipModule,
    MatDialogModule,
    MatSnackBarModule
  ],
  templateUrl: './support-messages.component.html',
  styleUrl: './support-messages.component.scss'
})
export class SupportMessagesComponent implements OnInit {
  displayedColumns: string[] = ['select', 'name', 'email', 'subject', 'status', 'createdAt', 'actions'];
  dataSource = new MatTableDataSource<SupportMessage>([]);
  selection = new SelectionModel<SupportMessage>(true, []);
  loading = true;
  error: string | null = null;
  selectedMessage: SupportMessage | null = null;

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild('messageDialog') messageDialog!: TemplateRef<any>;

  constructor(
    private supportMessageService: SupportMessageService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.fetchSupportMessages();
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
  }

  fetchSupportMessages(): void {
    this.loading = true;
    this.error = null;

    this.supportMessageService.getSupportMessages().subscribe({
      next: (messages) => {
        this.dataSource.data = messages;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching support messages:', err);
        this.error = 'Failed to load support messages. Please try again.';
        this.loading = false;
      }
    });
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  isAllSelected(): boolean {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  masterToggle(): void {
    if (this.isAllSelected()) {
      this.selection.clear();
    } else {
      this.dataSource.data.forEach(row => this.selection.select(row));
    }
  }

  viewMessage(message: SupportMessage): void {
    this.selectedMessage = message;
    this.dialog.open(this.messageDialog, {
      width: '600px',
      maxHeight: '80vh'
    });
  }

  // New method to preview the identification document image
  previewImage(filename: string): void {
    this.loading = true;
    this.supportMessageService.getImage(filename).subscribe({
      next: (imageBlob) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          this.dialog.open(ImagePreviewDialogComponent, {
            data: { imageUrl: reader.result as string },
            width: '600px',
            maxHeight: '80vh'
          });
          this.loading = false;
        };
        reader.readAsDataURL(imageBlob);
      },
      error: (err) => {
        console.error('Error fetching image:', err);
        this.loading = false;
        this.snackBar.open('Failed to load image', 'Close', {
          duration: 3000,
          horizontalPosition: 'end',
          panelClass: ['error-snackbar']
        });
      }
    });
  }


  updateMessageStatus(messageId: string, status: 'in-progress' | 'closed'): void {
    this.loading = true;
    this.supportMessageService.updateSupportMessage(messageId, { status }).subscribe({
      next: (updatedMessage) => {
        const index = this.dataSource.data.findIndex(m => m._id === messageId);
        if (index !== -1) {
          this.dataSource.data[index] = updatedMessage;
          this.dataSource._updateChangeSubscription();
        }
        this.loading = false;
        this.snackBar.open(`Message marked as ${status}`, 'Close', {
          duration: 3000,
          horizontalPosition: 'end'
        });
      },
      error: (err) => {
        console.error('Error updating message status:', err);
        this.loading = false;
        this.snackBar.open('Failed to update message status', 'Close', {
          duration: 3000,
          horizontalPosition: 'end',
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  deleteMessage(message: SupportMessage): void {
    if (confirm(`Are you sure you want to delete this message from ${message.name}?`)) {
      this.loading = true;
      this.supportMessageService.deleteSupportMessage(message._id).subscribe({
        next: () => {
          this.dataSource.data = this.dataSource.data.filter(m => m._id !== message._id);
          this.loading = false;
          this.snackBar.open('Message deleted successfully', 'Close', {
            duration: 3000,
            horizontalPosition: 'end'
          });
        },
        error: (err) => {
          console.error('Error deleting message:', err);
          this.loading = false;
          this.snackBar.open('Failed to delete message', 'Close', {
            duration: 3000,
            horizontalPosition: 'end',
            panelClass: ['error-snackbar']
          });
        }
      });
    }
  }

  deleteSelectedMessages(): void {
    const selectedIds = this.selection.selected.map(message => message._id);
    if (selectedIds.length === 0) return;

    if (confirm(`Are you sure you want to delete ${selectedIds.length} messages?`)) {
      this.loading = true;
      this.supportMessageService.deleteManySupportMessages(selectedIds).subscribe({
        next: () => {
          this.dataSource.data = this.dataSource.data.filter(m => !selectedIds.includes(m._id));
          this.selection.clear();
          this.loading = false;
          this.snackBar.open(`${selectedIds.length} messages deleted successfully`, 'Close', {
            duration: 3000,
            horizontalPosition: 'end'
          });
        },
        error: (err) => {
          console.error('Error deleting messages:', err);
          this.loading = false;
          this.snackBar.open('Failed to delete messages', 'Close', {
            duration: 3000,
            horizontalPosition: 'end',
            panelClass: ['error-snackbar']
          });
        }
      });
    }
  }
}
