import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { authGuard } from './guards/auth.guard';
import { AdminLayoutComponent } from './admin-layout/admin-layout.component';
import { AdminDashboardComponent } from './admin-dashboard/admin-dashboard.component';
import { AdminCreateUserComponent } from './admin-create-user/admin-create-user.component';
import { AdminCreateAccountComponent } from './admin-create-account/admin-create-account.component';
import { AdminCreateTransactionComponent } from './admin-create-transaction/admin-create-transaction.component';
import { AdminUsersComponent } from './admin-users/admin-users.component';
import { TransactionsComponent } from './transactions/transactions.component';
import { UserLayoutComponent } from './user-layout/user-layout.component';
import { TransfersComponent } from './transfers/transfers.component';
import { CardsComponent } from './cards/cards.component';
import { ProductsComponent } from './products/products.component';
import { VerifyRequestComponent } from './verify-request/verify-request.component';
import { HomeComponent } from './home/home.component';
import { SupportComponent } from './support/support.component';
import { SupportMessagesComponent } from './admin/support-messages/support-messages.component';
import { OpenAccountRequestComponent } from './open-account-request/open-account-request.component';
import { TransferRequestManagerComponent } from './admin/transfer-request-manager/transfer-request-manager.component';
import { CardRequestManagerComponent } from './admin/card-request-manager/card-request-manager.component';
import { NotFoundComponent } from './not-found/not-found.component';
import { NotificationListComponent } from './notifications/notification-list/notification-list.component';
import { NotificationDetailComponent } from './notifications/notification-detail/notification-detail.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'products', component: ProductsComponent },
  { path: 'support', component: SupportComponent },
  {
    path: 'open-account',
    component: OpenAccountRequestComponent
  },
  {
    path: 'user',
    component: UserLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'transactions', component: TransactionsComponent },
      { path: 'transfers', component: TransfersComponent },
      { path: 'verify-request', component: VerifyRequestComponent },
      { path: 'cards', component: CardsComponent },
      { path: 'products', component: ProductsComponent },
      { path: 'support', component: SupportComponent },
      {path: 'notifications', component: NotificationListComponent},
      {path: 'notifications/:id', component: NotificationDetailComponent},
    ]
  },
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: AdminDashboardComponent },
      { path: 'users', component: AdminUsersComponent },
      { path: 'create-user', component: AdminCreateUserComponent },
      { path: 'create-account', component: AdminCreateAccountComponent },
      { path: 'create-transaction', component: AdminCreateTransactionComponent },
      { path: 'support-messages', component: SupportMessagesComponent },
      { path: 'transfer-requests', component: TransferRequestManagerComponent },
      { path: 'card-requests', component: CardRequestManagerComponent }
    ]
  },
  { path: '**', component: NotFoundComponent }
];
