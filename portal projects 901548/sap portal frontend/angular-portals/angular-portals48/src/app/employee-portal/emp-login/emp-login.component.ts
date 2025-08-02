import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';
import { EmployeeService } from '../../services/employee.service';

@Component({
  selector: 'app-emp-login',
  imports: [FormsModule, CommonModule, HttpClientModule],
  templateUrl: './emp-login.component.html',
  styleUrl: './emp-login.component.css'
})
export class EmpLoginComponent {
  employeeId: string = '';
  password: string = '';
  errorMessage: string = '';
  successMessage: string = '';
  isLoading: boolean = false;
  showPassword: boolean = false;
  employeeIdInvalid: boolean = false;
  passwordInvalid: boolean = false;
  
  // New properties for enhanced UI
  employeeIdFocused: boolean = false;
  passwordFocused: boolean = false;
  rememberMe: boolean = false;

  constructor(
    private employeeService: EmployeeService, 
    private router: Router
  ) {}

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  showForgotPassword(event: Event): void {
    event.preventDefault();
    // For now, show a message - in real app, this would open a forgot password modal/page
    this.errorMessage = '';
    this.successMessage = 'Please contact IT Support at support@kaartech.com for password reset assistance.';
    
    // Clear the message after 5 seconds
    setTimeout(() => {
      this.successMessage = '';
    }, 5000);
  }

  async login(): Promise<void> {
    // Reset messages
    this.errorMessage = '';
    this.successMessage = '';
    this.employeeIdInvalid = false;
    this.passwordInvalid = false;

    // Basic validation
    if (!this.employeeId.trim()) {
      this.employeeIdInvalid = true;
      this.errorMessage = 'Employee ID is required';
      return;
    }

    if (!this.password.trim()) {
      this.passwordInvalid = true;
      this.errorMessage = 'Password is required';
      return;
    }

    if (this.employeeId.length < 3) {
      this.employeeIdInvalid = true;
      this.errorMessage = 'Employee ID must be at least 3 characters';
      return;
    }

    if (this.password.length < 6) {
      this.passwordInvalid = true;
      this.errorMessage = 'Password must be at least 6 characters';
      return;
    }

    this.isLoading = true;

    try {
      // Use the employee service for login
      this.employeeService.loginEmployee(this.employeeId, this.password).subscribe({
        next: (response) => {
          if (response && response.status === 'Login Successful') {
            this.successMessage = 'Login successful! Redirecting to dashboard...';
            
            // Store employee session using the service
            this.employeeService.setEmployeeSession(response.employeeId, {
              rememberMe: this.rememberMe,
              loginTime: new Date().toISOString()
            });
            
            // Redirect to employee dashboard after a short delay
            setTimeout(() => {
              this.router.navigate(['/employee/dashboard']);
            }, 2000);
          } else {
            this.errorMessage = 'Invalid credentials. Please check your Employee ID and password.';
          }
        },
        error: (error: any) => {
          this.handleLoginError(error);
        },
        complete: () => {
          this.isLoading = false;
        }
      });
    } catch (error: any) {
      this.handleLoginError(error);
      this.isLoading = false;
    }
  }

  private handleLoginError(error: any): void {
    console.error('Login error:', error);
    
    if (error.status === 500) {
      this.errorMessage = 'Server error. Please try again later or contact IT support.';
    } else if (error.status === 401) {
      this.errorMessage = 'Invalid credentials. Please check your Employee ID and password.';
    } else if (error.status === 403) {
      this.errorMessage = 'Access denied. Your account may be locked. Please contact IT support.';
    } else if (error.status === 0) {
      this.errorMessage = 'Unable to connect to server. Please check your internet connection.';
    } else if (error.status === 404) {
      this.errorMessage = 'Login service unavailable. Please try again later.';
    } else {
      this.errorMessage = error.error?.error || error.error?.message || 'Login failed. Please try again.';
    }
  }

  // Clear error messages when user starts typing
  onEmployeeIdChange(): void {
    if (this.employeeIdInvalid) {
      this.employeeIdInvalid = false;
      this.errorMessage = '';
    }
  }

  onPasswordChange(): void {
    if (this.passwordInvalid) {
      this.passwordInvalid = false;
      this.errorMessage = '';
    }
  }

  // Enhanced user experience methods
  onEmployeeIdFocus(): void {
    this.employeeIdFocused = true;
  }

  onEmployeeIdBlur(): void {
    this.employeeIdFocused = false;
  }

  onPasswordFocus(): void {
    this.passwordFocused = true;
  }

  onPasswordBlur(): void {
    this.passwordFocused = false;
  }

  // Handle Enter key press for better UX
  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.login();
    }
  }

  // Clear all messages
  clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }

  // Demo login for testing (can be removed in production)
  quickLogin(demoId: string = '00000004'): void {
    this.employeeId = demoId;
    this.password = 'password123';
    this.login();
  }
}
