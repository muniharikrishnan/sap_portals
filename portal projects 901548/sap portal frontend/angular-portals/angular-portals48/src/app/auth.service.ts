import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  getVendorId(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem('VendorId');
    }
    return null;
  }

  setVendorId(lifnr: string): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('VendorId', lifnr);
    }
  }

  logout(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('VendorId');
    }
  }
}

