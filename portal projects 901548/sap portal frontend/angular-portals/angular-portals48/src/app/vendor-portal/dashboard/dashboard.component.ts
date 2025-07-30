import { Component, OnInit, Renderer2, Inject, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, HttpClientModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  vendorProfile: any = null;
  isDarkMode: boolean = true; // Default to dark mode

  constructor(
    private router: Router, 
    private http: HttpClient,
    private renderer: Renderer2,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    // Load dark mode preference from localStorage only in browser
    if (isPlatformBrowser(this.platformId)) {
      this.loadDarkModePreference();
      
      const vendorId = localStorage.getItem('VendorId')?.trim();
      if (vendorId) {
        const url = `http://localhost:3000/api/vendor-profile/${vendorId}`;
        this.http.get<any>(url).subscribe({
          next: (data) => this.vendorProfile = data.profile,
          error: (err) => console.error('Error fetching profile:', err)
        });
      }
    }
  }

  // Load dark mode preference from localStorage
  loadDarkModePreference(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    try {
      const savedMode = localStorage.getItem('darkMode');
      if (savedMode !== null) {
        this.isDarkMode = savedMode === 'true';
      } else {
        // Default to dark mode if no preference is saved
        this.isDarkMode = true;
        localStorage.setItem('darkMode', 'true');
      }
      this.applyTheme();
    } catch (error) {
      console.error('Error accessing localStorage:', error);
      // Fallback to default dark mode
      this.isDarkMode = true;
      this.applyTheme();
    }
  }

  // Toggle dark mode
  toggleDarkMode(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.isDarkMode = !this.isDarkMode;
    
    try {
      localStorage.setItem('darkMode', this.isDarkMode.toString());
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
    
    this.applyTheme();
  }

  // Apply the current theme
  applyTheme(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    if (this.isDarkMode) {
      this.renderer.addClass(document.body, 'dark-mode');
      this.renderer.removeClass(document.body, 'light-mode');
    } else {
      this.renderer.addClass(document.body, 'light-mode');
      this.renderer.removeClass(document.body, 'dark-mode');
    }
  }

  logout() {
    console.log('Logout clicked');
    if (isPlatformBrowser(this.platformId)) {
      localStorage.clear();
    }
    this.router.navigate(['/login']);
  }
}
