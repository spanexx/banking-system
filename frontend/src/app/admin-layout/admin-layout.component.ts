import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { Router, NavigationEnd, NavigationStart } from '@angular/router';
import { filter } from 'rxjs/operators';
import { 
  faUniversity, 
  faRightFromBracket,
  faDashboard,
  faUsers,
  faMoneyBillTransfer,
  faUserPlus,
  faCreditCard,
  faGear,
  faHeadset,
  faExchangeAlt,
  faExchange
} from '@fortawesome/free-solid-svg-icons';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [
    RouterModule, 
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    FaIconComponent
  ],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.scss'
})
export class AdminLayoutComponent implements OnInit {
  isSidebarCollapsed = false;
  isMobileMenuOpen = false;
  isLoading = false;
  adminName: string = 'Admin';

  // Icons
  bankLogo = faUniversity;
  logoutIcon = faRightFromBracket;
  dashboardIcon = faDashboard;
  usersIcon = faUsers;
  transactionsIcon = faMoneyBillTransfer;
  createUserIcon = faUserPlus;
  createAccountIcon = faCreditCard;
  settingsIcon = faGear;
  supportIcon = faHeadset;
  transferRequestsIcon = faExchange;
  cardRequestsIcon = faCreditCard; // Added new icon for card requests management

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    // Handle route change loading states
    this.router.events.pipe(
      filter(event => 
        event instanceof NavigationStart || 
        event instanceof NavigationEnd
      )
    ).subscribe(event => {
      if (event instanceof NavigationStart) {
        this.isLoading = true;
      } else if (event instanceof NavigationEnd) {
        this.isLoading = false;
        // Close mobile menu on navigation
        if (this.isMobileMenuOpen) {
          this.isMobileMenuOpen = false;
          this.isSidebarCollapsed = true;
        }
      }
    });
  }

  ngOnInit() {
    // Restore sidebar state from localStorage
    const savedState = localStorage.getItem('adminSidebarState');
    if (savedState) {
      this.isSidebarCollapsed = JSON.parse(savedState);
    }
    
    // Initial screen size check
    this.checkScreenSize();
    
    // Add window resize listener
    window.addEventListener('resize', () => this.checkScreenSize());
  }

  toggleSidebar() {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
    this.isMobileMenuOpen = !this.isSidebarCollapsed;
    localStorage.setItem('adminSidebarState', JSON.stringify(this.isSidebarCollapsed));
  }

  checkScreenSize() {
    if (window.innerWidth <= 768 && !this.isSidebarCollapsed) {
      this.isSidebarCollapsed = true;
      this.isMobileMenuOpen = false;
      localStorage.setItem('adminSidebarState', 'true');
    }
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}