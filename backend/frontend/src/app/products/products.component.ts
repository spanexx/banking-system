import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    RouterModule
  ],
  templateUrl: './products.component.html',
  styleUrl: './products.component.scss'
})
export class ProductsComponent {
  // Add functionality here if needed for product interactions
  learnMore(productType: string) {
    // Implement learn more functionality
    console.log(`Learning more about ${productType}`);
  }

  getStarted() {
    // Implement get started functionality
    console.log('Getting started with premium account');
  }
}
