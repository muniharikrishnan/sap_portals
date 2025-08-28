import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { AuthService } from '../../auth.service'; // ✅ Import AuthService

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  lifnr = '';
  password = '';
  rememberMe = false; 
  errorMessage = '';

  constructor(
    private http: HttpClient,
    private router: Router,
    private authService: AuthService // ✅ Inject AuthService
  ) {}

  login() {
    this.errorMessage = '';

    if (!this.lifnr || !this.password) {
      this.errorMessage = 'Please enter Vendor ID and Password';
      return;
    }

    const payload = {
      lifnr: this.lifnr,
      password: this.password.trim()
    };

    this.http.post<any>('http://localhost:3000/api/vendor-login', payload).subscribe({
      next: (res) => {
        if (res.status === 'success') {
          // ✅ Store in AuthService
  
          localStorage.setItem('VendorId', this.lifnr);

          this.router.navigate(['/vendor']);
        } else {
          this.errorMessage = res.message || 'Invalid credentials';
        }
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Server error during login';
      }
    });
  }
}
