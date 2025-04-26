import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const user = localStorage.getItem('user');
  // console.log('User from localStorage:', user);
  if (!auth.currentUserToken || !user) {
    router.navigate(['/login']);
    return false;
  }

  const userObj = JSON.parse(user);
  // console.log('User object:', userObj);
  if (userObj.role === 'user') {
    // Redirect to a non-admin page or show an access denied message
    // For now, redirecting to dashboard
    router.navigate(['/dashboard']);
    return false;
  }

  return true;
};
