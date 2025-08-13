
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
  showDashboardPreview: boolean = false;
  isAuthenticating: boolean = false;
  loginSuccess: boolean = false;

  constructor(private http: HttpClient, private router: Router, @Inject(PLATFORM_ID) private platformId: Object) {}

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  onLogin() {
    if (!this.customerId || !this.password) {
      this.errorMessage = 'Please fill in all required fields';
      return;
    }

    // Start authentication process
    this.isLoading = true;
    this.isAuthenticating = true;
    this.errorMessage = '';
    this.loginSuccess = false;

    const payload = {
      username: this.customerId,  // Match server.js key
      password: this.password
    };

    // Simulate authentication delay for better UX
    setTimeout(() => {
      this.http.post<any>('http://localhost:3001/api/login', payload).subscribe({
        next: (res) => {
          this.isAuthenticating = false;
          
          if (res.status && res.message === 'Successful') {
            this.loginSuccess = true;
            console.log('Login successful');
            
            if (isPlatformBrowser(this.platformId)) {
              localStorage.setItem('customerId', this.customerId);
            }
            
            // Show success message for 2 seconds before redirecting
            setTimeout(() => {
              this.isLoading = false;
              this.loginSuccess = false;
              this.router.navigate(['/customer']); // Navigate to cus-navbar
            }, 2000);
            
          } else {
            this.isLoading = false;
            this.errorMessage = 'Invalid credentials or SAP login failed';
          }
        },
        error: (err) => {
          this.isLoading = false;
          this.isAuthenticating = false;
          this.loginSuccess = false;
          this.errorMessage = 'Server error. Please try again later.';
          console.error('Login Error:', err);
        }
      });
    }, 1500); // 1.5 second delay to show authentication process
  }
}


