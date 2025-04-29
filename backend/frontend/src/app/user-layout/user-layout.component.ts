import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
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
import { NotificationService, Notification } from '../services/notification.service';
import { Subscription } from 'rxjs';


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
export class UserLayoutComponent implements OnInit, OnDestroy {
  isSidebarCollapsed = false;
  notificationCount = 0;
  notifications: Notification[] = [];
  userName: string = '';
  private notificationsSubscription: Subscription | undefined;
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
    private router: Router,
    private notificationService: NotificationService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    // Get current user ID and connect to WebSocket
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      this.notificationService.connect(currentUser._id);
    }

    // Load initial notifications
    this.loadNotifications();
    this.subscribeToNotifications();
    this.loadUserProfile();
    this.checkScreenSize();
  }

  ngOnDestroy() {
    // Clean up WebSocket connection and subscriptions
    this.notificationService.disconnect();
    if (this.notificationsSubscription) {
      this.notificationsSubscription.unsubscribe();
    }
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

  subscribeToNotifications() {
    this.notificationsSubscription = this.notificationService.notifications$.subscribe(notifications => {
      this.notifications = notifications;
      this.updateNotificationCount();
    });
  }

  loadNotifications() {
    this.notificationService.getNotifications().subscribe(
      () => {
        // Notifications are updated via the subscription
      },
      error => {
        console.error('Error loading notifications:', error);
      }
    );
  }

  updateNotificationCount() {
    this.notificationCount = this.notifications.filter(n => !n.read).length;
  }

  toggleSidebar() {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
    // On desktop, toggling sidebar doesn't open mobile menu
    if (window.innerWidth <= 768) {
       this.isMobileMenuOpen = !this.isSidebarCollapsed;
    }
    localStorage.setItem('sidebarState', JSON.stringify(this.isSidebarCollapsed));
  }

  markAsRead(notification: Notification) {
    if (!notification.read) {
      this.notificationService.markAsRead(notification._id).subscribe({
        next: () => {
          this.router.navigate(['/user/notifications', notification._id]);
        },
        error: error => {
          console.error('Error marking notification as read:', error);
        }
      });
    } else {
      this.router.navigate(['/user/notifications', notification._id]);
    }
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
    this.notificationService.markAllAsRead().subscribe(
      () => {
        // State updated via subscription
      },
      error => {
        console.error('Error marking all notifications as read:', error);
      }
    );
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
