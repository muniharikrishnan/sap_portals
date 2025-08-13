import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { RouterModule, Router } from '@angular/router';

interface VendorProfile {
  companyName?: string;
  vendorId?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  fax?: string;
  website?: string;
  address?: string;
  industryType?: string;
  registrationNumber?: string;
  taxId?: string;
  registrationDate?: Date | string;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, HttpClientModule, RouterModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  profile: any = null;
  loading = true;
  errorMessage = '';
  vendorProfile: VendorProfile | null = null;
  isEditing: boolean = false;

  constructor(
    private http: HttpClient,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      try {
        const vendorId = localStorage.getItem('VendorId')?.trim();
        if (vendorId) {
          const url = `http://localhost:3000/api/vendor-profile/${vendorId}`;
          this.http.get<any>(url).subscribe({
            next: (data) => {
              this.profile = data.profile;
              this.loading = false;
            },
            error: (err) => {
              this.errorMessage = 'Error fetching profile.';
              this.loading = false;
            }
          });
        } else {
          this.errorMessage = 'VendorId not found in localStorage.';
          this.loading = false;
        }
      } catch (error) {
        this.errorMessage = 'Error accessing browser storage!';
        this.loading = false;
      }
    } else {
      this.errorMessage = 'Browser environment required!';
      this.loading = false;
    }
    this.loadVendorProfile();
  }

  loadVendorProfile() {
    // Try to get vendor profile from localStorage or service
    const storedProfile = localStorage.getItem('vendorProfile');
    if (storedProfile) {
      this.vendorProfile = JSON.parse(storedProfile);
    } else {
      // Default profile structure
      this.vendorProfile = {
        companyName: 'Sample Company Ltd.',
        vendorId: localStorage.getItem('VendorId') || 'V001',
        contactPerson: 'John Doe',
        email: 'contact@company.com',
        phone: '+1-234-567-8900',
        fax: '+1-234-567-8901',
        website: 'www.company.com',
        address: '123 Business Street, City, State 12345',
        industryType: 'Technology',
        registrationNumber: 'REG123456789',
        taxId: 'TAX987654321',
        registrationDate: new Date('2020-01-15')
      };
    }
  }

  editProfile() {
    this.isEditing = !this.isEditing;
    // You can add more edit functionality here
    console.log('Edit profile clicked');
  }

  saveProfile() {
    if (this.vendorProfile) {
      localStorage.setItem('vendorProfile', JSON.stringify(this.vendorProfile));
      this.isEditing = false;
      console.log('Profile saved');
    }
  }

  cancelEdit() {
    this.isEditing = false;
    this.loadVendorProfile(); // Reload original data
  }

  goBack(): void {
    this.router.navigate(['/vendor/dashboard']);
  }
}