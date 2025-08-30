
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
  isExporting: boolean = false;
  searchTerm: string = '';
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

  // Search functionality
  onSearch(): void {
    // Implement search functionality if needed
    console.log('Searching for:', this.searchTerm);
  }

  clearSearch(): void {
    this.searchTerm = '';
    console.log('Search cleared');
  }

  printProfile(): void {
    if (!this.profileData) {
      alert('No profile data available to print');
      return;
    }

    // Create a printable version of the profile
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Customer Profile - ${this.customerId}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .header { text-align: center; margin-bottom: 30px; }
              .section { margin-bottom: 20px; }
              .label { font-weight: bold; }
              .value { margin-left: 10px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Customer Profile</h1>
              <p>Customer ID: ${this.customerId}</p>
            </div>
            <div class="section">
              <div class="label">Name:</div>
              <div class="value">${this.profileData.name1 || 'N/A'}</div>
            </div>
            <div class="section">
              <div class="label">Email:</div>
              <div class="value">${this.profileData.email || 'N/A'}</div>
            </div>
            <div class="section">
              <div class="label">Phone:</div>
              <div class="value">${this.profileData.phone || 'N/A'}</div>
            </div>
            <div class="section">
              <div class="label">Address:</div>
              <div class="value">${this.profileData.street || 'N/A'}</div>
            </div>
            <div class="section">
              <div class="label">City:</div>
              <div class="value">${this.profileData.city || 'N/A'}</div>
            </div>
            <div class="section">
              <div class="label">Country:</div>
              <div class="value">${this.profileData.country || 'N/A'}</div>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  }

  shareProfile(): void {
    if (!this.profileData) {
      alert('No profile data available to share');
      return;
    }

    // Create shareable content
    const shareText = `Customer Profile - ${this.customerId}\nName: ${this.profileData.name1 || 'N/A'}\nEmail: ${this.profileData.email || 'N/A'}`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Customer Profile',
        text: shareText,
        url: window.location.href
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(shareText).then(() => {
        alert('Profile information copied to clipboard!');
      }).catch(() => {
        alert('Unable to copy to clipboard. Please copy manually:\n\n' + shareText);
      });
    }
  }

  changePassword(): void {
    // TODO: Implement password change functionality
    console.log('Change password clicked');
    alert('Password change functionality will be implemented soon!');
  }

  exportProfileData(): void {
    if (!this.profileData) {
      alert('No profile data available to export');
      return;
    }

    this.isExporting = true;
    
    // Create Excel data
    const excelData = this.prepareExcelData();
    
    // Download the Excel file
    const fileName = `Customer_Profile_${this.customerId}_${new Date().toISOString().split('T')[0]}.xlsx`;
    this.downloadExcelFile(excelData, fileName);
    
    // Reset export state
    setTimeout(() => {
      this.isExporting = false;
    }, 1000);
  }

  private prepareExcelData(): any[] {
    // Define headers
    const headers = [
      'Field',
      'Value'
    ];

    // Create data rows with profile information
    const rows = [
      ['Customer ID', this.profileData.kunnr || this.customerId || ''],
      ['Name', this.profileData.name || ''],
      ['Email', this.profileData.email || ''],
      ['Phone', this.profileData.phone || ''],
      ['Address', this.profileData.address || ''],
      ['City', this.profileData.city || ''],
      ['State', this.profileData.state || ''],
      ['Country', this.profileData.country || ''],
      ['Postal Code', this.profileData.postalCode || ''],
      ['Company', this.profileData.company || ''],
      ['Industry', this.profileData.industry || ''],
      ['Created Date', this.profileData.createdDate || ''],
      ['Last Updated', this.profileData.lastUpdated || ''],
      ['Status', this.profileData.status || ''],
      ['Notes', this.profileData.notes || '']
    ];

    // Return data with headers
    return [headers, ...rows];
  }

  private downloadExcelFile(data: any[], fileName: string): void {
    // Convert data to CSV format (Excel can open CSV files)
    const csvContent = data.map(row => 
      row.map((cell: any) => `"${cell}"`).join(',')
    ).join('\n');
    
    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    console.log(`Exported profile data to ${fileName}`);
  }
}

