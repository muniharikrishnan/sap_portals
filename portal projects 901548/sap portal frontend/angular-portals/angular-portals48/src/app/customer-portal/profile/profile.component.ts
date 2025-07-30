import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-customer-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class CustomerProfileComponent implements OnInit {
  customerId: string = '';
  profileData: any = null;
  errorMessage: string = '';

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
    const storedId = localStorage.getItem('customerId');
    if (storedId) {
      this.customerId = storedId;
      this.fetchProfile();
    } else {
      this.errorMessage = 'Customer ID not found in local storage.';
    }
  }

  fetchProfile(): void {
    this.http.get(`http://localhost:3001/api/profile/${this.customerId}`).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.profileData = res.data;
        } else {
          this.errorMessage = res.message || 'Unknown error occurred';
        }
      },
      error: (err) => {
        this.errorMessage = 'Failed to fetch profile. Server error.';
        console.error(err);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/customer/dashboard']);
  }
}
