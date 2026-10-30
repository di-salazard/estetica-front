import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object 
  ) {}

  canActivate(): boolean {
    if (isPlatformBrowser(this.platformId)) {
      const token = sessionStorage.getItem('authToken');

      if (token) {
        return true;
      }
    }

    this.router.navigate(['/login']); 
    return false;
  }
}