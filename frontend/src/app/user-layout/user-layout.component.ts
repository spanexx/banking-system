import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { 
  faUniversity, 
  faRightFromBracket, 
  faUser, 
  faBell, 
  faChevronDown,
  faDashboard,
  faPiggyBank,
  faPaperPlane,
  faHistory,
  faCreditCard,
  faStore,
  faGear,
  faCircleInfo,
  faInfoCircle,
  faExclamationTriangle,
  faCheckCircle,
  faTimesCircle,
  faHeadset
} from '@fortawesome/free-solid-svg-icons';
import { AuthService } from '../services/auth.service';
import { Router, NavigationEnd, NavigationStart } from '@angular/router';
import { filter } from 'rxjs/operators';

interface Notification {
  id: string;
  type: 'info' | 'warning' | 'success' | 'error';
  message: string;
  time: Date;
  read: boolean;
}

@Component({
  selector: 'app-user-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatBadgeModule,
    MatDividerModule,
    FaIconComponent
  ],
  templateUrl: './user-layout.component.html',
  styleUrl: './user-layout.component.scss'
})
export class UserLayoutComponent implements OnInit {
  isSidebarCollapsed = false;
  notificationCount = 0;
  notifications: Notification[] = [];
  userName: string = '';
  userAvatar: string = 'assets/images/default-avatar.png';
  userProfileIcon = faUser;
  bankLogo = faUniversity;
  logoutIcon = faRightFromBracket;
  bellIcon = faBell;
  chevronIcon = faChevronDown;

  // Navigation icons
  dashboardIcon = faDashboard;
  accountsIcon = faPiggyBank;
  transfersIcon = faPaperPlane;
  transactionsIcon = faHistory;
  cardsIcon = faCreditCard;
  productsIcon = faStore;

  // Profile menu icons
  settingsIcon = faGear;
  aboutIcon = faCircleInfo;

  supportIcon = faHeadset;

  isMobileMenuOpen = false;
  isLoading = false;

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
    this.loadUserProfile();
    this.loadNotifications();

    // Check for saved sidebar state
    const savedState = localStorage.getItem('sidebarState');
    if (savedState) {
      this.isSidebarCollapsed = JSON.parse(savedState);
    }

    // Check screen size on init
    this.checkScreenSize();

    // Listen for window resize events
    window.addEventListener('resize', () => this.checkScreenSize());
  }

  loadUserProfile() {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.userName = user.name;
      if (user.avatar) {
        this.userAvatar = user.avatar;
      }
    }
  }

  loadNotifications() {
    // Mock notifications - replace with actual API call
    this.notifications = [
      {
        id: '1',
        type: 'info',
        message: 'Your account statement is ready',
        time: new Date(),
        read: false
      },
      {
        id: '2',
        type: 'success',
        message: 'Transfer completed successfully',
        time: new Date(Date.now() - 3600000),
        read: false
      }
    ];
    this.updateNotificationCount();
  }

  updateNotificationCount() {
    this.notificationCount = this.notifications.filter(n => !n.read).length;
  }

  toggleSidebar() {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
    this.isMobileMenuOpen = !this.isSidebarCollapsed;
    localStorage.setItem('sidebarState', JSON.stringify(this.isSidebarCollapsed));
  }

  checkScreenSize() {
    if (window.innerWidth <= 768 && !this.isSidebarCollapsed) {
      this.isSidebarCollapsed = true;
      localStorage.setItem('sidebarState', 'true');
    }
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

  getNotificationTypeIcon(type: string) {
    switch (type) {
      case 'info':
        return faInfoCircle;
      case 'warning':
        return faExclamationTriangle;
      case 'success':
        return faCheckCircle;
      case 'error':
        return faTimesCircle;
      default:
        return faBell;
    }
  }

  markAllRead() {
    this.notifications.forEach(notification => {
      notification.read = true;
    });
    this.updateNotificationCount();
  }

  async logout() {
    try {
      await this.authService.logout();
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('Error during logout:', error);
    }
  }
}
