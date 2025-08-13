
import { Component, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-cus-login',
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './cus-login.component.html',
  styleUrls: ['./cus-login.component.css']
})
export class CusLoginComponent {
  customerId: string = '';
  password: string = '';
  errorMessage: string = '';
  showPassword: boolean = false;
  isLoading: boolean = false;

  constructor(private http: HttpClient, private router: Router, @Inject(PLATFORM_ID) private platformId: Object) {}

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  onLogin() {
    if (!this.customerId || !this.password) {
      this.errorMessage = 'Please fill in all required fields';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const payload = {
      username: this.customerId,  // Match server.js key
      password: this.password
    };

    this.http.post<any>('http://localhost:3001/api/login', payload).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.status && res.message === 'Successful') {
          console.log('Login successful');
          if (isPlatformBrowser(this.platformId)) {
            localStorage.setItem('customerId', this.customerId);
          }
          this.router.navigate(['/customer']); // Navigate to cus-navbar
        } else {
          this.errorMessage = 'Invalid credentials or SAP login failed';
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = 'Server error. Please try again later.';
        console.error('Login Error:', err);
      }
    });
  }
}


