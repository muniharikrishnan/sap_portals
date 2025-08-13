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

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.loadProfile();
    } else {
      this.errorMessage = 'Browser environment required!';
      this.loading = false;
    }
  }

  loadProfile() {
    // Simulate profile loading - replace with actual API call when ready
    setTimeout(() => {
      this.profile = {
        name: 'Sample Vendor',
        id: 'V001',
        email: 'vendor@example.com',
        phone: '+1-234-567-8900'
      };
      this.loading = false;
    }, 1000);
  }

  goBack(): void {
    this.router.navigate(['/vendor/dashboard']);
  }
}