import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { RouterModule, Router } from '@angular/router';

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
  }

  goBack(): void {
    this.router.navigate(['/vendor/dashboard']);
  }
}
