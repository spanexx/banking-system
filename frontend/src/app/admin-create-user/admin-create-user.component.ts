import { Component } from '@angular/core';
import { UserService } from '../services/user.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-admin-create-user',
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    RouterModule
  ],
  templateUrl: './admin-create-user.component.html',
  styleUrl: './admin-create-user.component.scss'
})
export class AdminCreateUserComponent {
  newUser = { name: '', email: '', password: '' };
  successMessage: string | null = null;
  errorMessage: string | null = null;

  constructor(private userService: UserService) { }

  createUser(): void {
    if (!this.isFormValid()) {
      this.errorMessage = 'Please fill in all required fields';
      return;
    }

    this.userService.createUser(this.newUser).subscribe(
      (response) => {
        this.successMessage = 'User created successfully!';
        this.errorMessage = null;
        this.newUser = { name: '', email: '', password: '' };
      },
      (error) => {
        this.errorMessage = 'Error creating user: ' + (error.error?.message || error.message);
        this.successMessage = null;
      }
    );
  }

  private isFormValid(): boolean {
    return !!(this.newUser.name && this.newUser.email && this.newUser.password);
  }
}