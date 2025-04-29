import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router, RouterModule } from '@angular/router';
import { SupportMessageService } from '../services/support-message.service';

interface AccountRequestData {
  name: string;
  email: string;
  subject: string;
  message: string;
  phone: string;
  address: string;
  dob: string;
  password: string;
  accountType: string;
  image: string | null;
  messageType: string;
}

@Component({
  selector: 'app-open-account-request',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    MatProgressBarModule,
    MatSnackBarModule,
    RouterModule
  ],
  templateUrl: './open-account-request.component.html',
  styleUrl: './open-account-request.component.scss'
})
export class OpenAccountRequestComponent implements OnInit {
  accountForm: FormGroup;
  loading = false;
  imagePreview: string | null = null;

  constructor(
    private fb: FormBuilder,
    private supportMessageService: SupportMessageService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {
    this.accountForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [
        Validators.required, 
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/)
      ]],
      phone: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      address: ['', [Validators.required, Validators.minLength(5)]],
      dob: ['', [Validators.required]],
      accountType: ['', [Validators.required]],
      image: [null, [Validators.required]],
      imageFile: [null]
    });
  }

  ngOnInit() {
    // Initialize any required data
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      if (file.type.match(/image\/*/) && file.size <= 5 * 1024 * 1024) {
        this.accountForm.patchValue({ imageFile: file });
        
        const reader = new FileReader();
        reader.onload = () => {
          this.imagePreview = reader.result as string;
          this.accountForm.patchValue({ image: reader.result });
          this.accountForm.get('image')?.markAsTouched();
        };
        reader.readAsDataURL(file);
      } else {
        this.snackBar.open('Please select a valid image file under 5MB', 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    }
  }

  onSubmit() {
    if (this.accountForm.valid) {
      this.loading = true;
      const formData = this.accountForm.value;
      
      const messageData: AccountRequestData = {
        name: formData.name,
        email: formData.email,
        subject: 'New Account Opening Request',
        message: `New account opening request from ${formData.name}.\n\nAccount Details:\n- Account Type: ${formData.accountType}\n- Phone: ${formData.phone}\n- Address: ${formData.address}\n- Date of Birth: ${formData.dob ? new Date(formData.dob).toLocaleDateString() : 'Not provided'}`,
        phone: formData.phone,
        address: formData.address,
        dob: formData.dob,
        password: formData.password,
        accountType: formData.accountType,
        image: formData.image,
        messageType: 'account-request'
      };

      // Creating a FormData object to handle file upload
      const formDataToSend = new FormData();
      (Object.keys(messageData) as Array<keyof AccountRequestData>).forEach(key => {
        if (key === 'image' && formData.imageFile) {
          formDataToSend.append('image', formData.imageFile);
        } else {
          formDataToSend.append(key, messageData[key] as string);
        }
      });

      this.supportMessageService.createGuestSupportMessage(formDataToSend).subscribe({
        next: (res) => {
          console.log('Account request submitted successfully:', res);
          this.loading = false;
          this.snackBar.open('Account request submitted successfully! We will review your application and contact you soon.', 'Close', {
            duration: 5000,
            horizontalPosition: 'end',
            panelClass: ['success-snackbar']
          });
          this.router.navigate(['/']);
        },
        error: (error) => {
          this.loading = false;
          console.error('Error submitting account request:', error);
          this.snackBar.open(error.error?.message || 'Failed to submit account request. Please try again.', 'Close', {
            duration: 5000,
            horizontalPosition: 'end',
            panelClass: ['error-snackbar']
          });
        }
      });
    } else {
      this.markFormGroupTouched(this.accountForm);
    }
  }

  getErrorMessage(controlName: string): string {
    const control = this.accountForm.get(controlName);
    if (control?.hasError('required')) {
      return `${controlName.charAt(0).toUpperCase() + controlName.slice(1)} is required`;
    }
    if (control?.hasError('email')) {
      return 'Please enter a valid email address';
    }
    if (control?.hasError('minlength')) {
      return `Minimum length is ${control.errors?.['minlength'].requiredLength} characters`;
    }
    if (control?.hasError('pattern')) {
      return 'Please enter a valid phone number (10 digits)';
    }
    return '';
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }
}