import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { filter, map, take } from 'rxjs';
import { AuthService } from './auth.service';

export const adminGuard = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.appUser$.pipe(
    filter(user => user !== null),
    take(1),
    map(user => {
      if (user?.role === 'admin') return true;
      return router.createUrlTree(['/lists']);
    })
  );
};
