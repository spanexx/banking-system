import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

interface Activity {
  _id: string;
  user: string;
  action: string;
  metadata: any;
  date: string;
  createdAt: string;
  updatedAt: string;
}

@Component({
  selector: 'app-activity-details-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './activity-details-modal.component.html',
  styleUrl: './activity-details-modal.component.scss'
})
export class ActivityDetailsModalComponent {
  activity: Activity;
  objectKeys = Object.keys;

  constructor(
    public dialogRef: MatDialogRef<ActivityDetailsModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { activity: Activity }
  ) {
    this.activity = data.activity;
  }

  onClose(): void {
    this.dialogRef.close();
  }
}
