
import { Component, OnInit, ViewChild, TemplateRef } from '@angular/core';
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
export class ProfileComponent implements OnInit {
  customerId: string = '';
  profileData: any = null;
  errorMessage: string = '';
  isLoading: boolean = false;
  @ViewChild('loadingOrError', { static: true }) loadingOrError!: TemplateRef<any>;

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
    this.isLoading = true;
    this.errorMessage = '';
    
    this.http.get(`http://localhost:3001/api/profile/${this.customerId}`).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        if (res.success) {
          this.profileData = res.data;
        } else {
          this.errorMessage = res.message || 'Unknown error occurred';
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = 'Failed to fetch profile. Server error.';
        console.error(err);
      }
    });
  }

  editProfile(): void {
    // TODO: Implement edit profile functionality
    console.log('Edit profile clicked');
    // For now, show an alert
    alert('Edit profile functionality will be implemented soon!');
  }

  downloadProfile(): void {
    if (!this.profileData) {
      alert('No profile data available to download');
      return;
    }

    // Create a downloadable JSON file with profile data
    const dataStr = JSON.stringify(this.profileData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `customer-profile-${this.customerId}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  }

  goBack(): void {
    this.router.navigate(['/customer/dashboard']);
  }

  // Additional utility methods for enhanced functionality
  // Additional utility methods for enhanced functionality
 refreshProfile(): void {
    // Show loading state
    this.isLoading = true;
    this.errorMessage = '';
    
    // Clear current data to show fresh loading state
    this.profileData = null;
    
    // Add a small delay to show the refresh action
    setTimeout(() => {
      this.fetchProfile();
    }, 500);
    
    // Show user feedback
    console.log('Refreshing profile data...');
  }
  printProfile(): void {
    window.print();
  }

  shareProfile(): void {
    if (navigator.share) {
      navigator.share({
        title: 'Customer Profile',
        text: 'Check out my customer profile',
        url: window.location.href
      }).catch(err => console.log('Error sharing:', err));
    } else {
      // Fallback: copy URL to clipboard
      this.copyToClipboard(window.location.href);
      alert('Profile URL copied to clipboard!');
    }
  }

  changePassword(): void {
    // TODO: Implement change password functionality
    alert('Change password functionality will be implemented soon!');
  }

  copyToClipboard(text: string): void {
    navigator.clipboard.writeText(text).then(() => {
      // Could show a toast notification here
      console.log('Copied to clipboard:', text);
    }).catch(err => {
      console.error('Failed to copy to clipboard:', err);
    });
  }
}

