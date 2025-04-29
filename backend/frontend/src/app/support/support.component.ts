import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { SupportMessageService } from '../services/support-message.service';

@Component({
  selector: 'app-support',
  standalone: true,
  imports: [
    CommonModule,
    MatTabsModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    ReactiveFormsModule,
    MatSnackBarModule
  ],
  templateUrl: './support.component.html',
  styleUrl: './support.component.scss'
})
export class SupportComponent {
  contactForm: FormGroup;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private supportMessageService: SupportMessageService
  ) {
    this.contactForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      subject: ['', Validators.required],
      message: ['', Validators.required]
    });
  }

  onSubmit() {
    if (this.contactForm.valid) {
      this.loading = true;
      const messageData = this.contactForm.value;

      this.supportMessageService.createSupportMessage(messageData).subscribe({
        next: () => {
          this.loading = false;
          this.snackBar.open('Message sent successfully! We\'ll get back to you soon.', 'Close', {
            duration: 5000,
            horizontalPosition: 'end',
            panelClass: ['success-snackbar']
          });
          this.contactForm.reset();
        },
        error: (error) => {
          this.loading = false;
          console.error('Error sending message:', error);
          this.snackBar.open('Failed to send message. Please try again.', 'Close', {
            duration: 5000,
            horizontalPosition: 'end',
            panelClass: ['error-snackbar']
          });
        }
      });
    }
  }
}