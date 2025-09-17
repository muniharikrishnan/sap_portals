import { Component, OnInit, OnDestroy, Renderer2, Inject, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { EmployeeService, EmployeeProfile } from '../../services/employee.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, HttpClientModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  employeeProfile: EmployeeProfile | null = null;
  employeeId: string = '';
  isDarkMode: boolean = true;
  
  // Dashboard data properties
  todayDate: string = '';
  currentTime: string = '';
  leaveBalance: number = 25;
  lastSalary: string = '85,000';
  pendingTasks: number = 7;
  performanceScore: number = 92;
  successMessage: string | null = null;
  
  // Timer for real-time updates
  private timeInterval: any;

  constructor(
    private router: Router, 
    private http: HttpClient,
    private renderer: Renderer2,
    private employeeService: EmployeeService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    // Initialize dashboard data
    this.initializeDashboard();
    
    // Load dark mode preference from localStorage only in browser
    if (isPlatformBrowser(this.platformId)) {
      this.loadDarkModePreference();
      this.loadEmployeeProfile();
      this.startTimeUpdates();
    }
  }

  ngOnDestroy(): void {
    // Clean up timer
    if (this.timeInterval) {
      clearInterval(this.timeInterval);
    }
  }

  private initializeDashboard(): void {
    this.updateDateTime();
    this.loadDashboardData();
  }

  private updateDateTime(): void {
    const now = new Date();
    
    // Format today's date
    this.todayDate = now.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
    
    // Format current time
    this.currentTime = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }

  private startTimeUpdates(): void {
    // Update time every minute
    this.timeInterval = setInterval(() => {
      this.updateDateTime();
    }, 60000);
  }

  private loadEmployeeProfile(): void {
    const employeeId = localStorage.getItem('employeeId')?.trim();
    if (employeeId) {
      this.employeeId = employeeId;
      this.employeeService.getEmployeeProfile(employeeId).subscribe({
        next: (profile) => {
          console.log('Profile data received:', profile);
          this.employeeProfile = profile;
        },
        error: (error) => {
          console.error('Error fetching profile data:', error);
          // Fallback to basic employee info if profile fetch fails
          this.employeeProfile = {
            fullName: 'Employee',
            gender: '',
            dob: '',
            orgUnit: '',
            position: '',
            department: '',
            compCode: '',
            email: '',
            phone: '',
            address: ''
          };
        }
      });
    }
  }

  private loadDashboardData(): void {
    // Mock dashboard data - in real app, this would come from API
    this.leaveBalance = 25;
    this.lastSalary = '85,000';
    this.pendingTasks = 7;
    this.performanceScore = 92;
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
    this.showSuccessMessage(`Switched to ${this.isDarkMode ? 'Dark' : 'Light'} mode`);
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

  private showSuccessMessage(message: string): void {
    this.successMessage = message;
    setTimeout(() => {
      this.successMessage = null;
    }, 3000);
  }

  // Navigation methods
  navigateToProfile(): void {
    this.router.navigate(['/employee/profile']);
  }

  navigateToLeave(): void {
    this.router.navigate(['/employee/leave']);
  }

  navigateToPayroll(): void {
    this.router.navigate(['/employee/pay']);
  }

  navigateToPerformance(): void {
    this.showSuccessMessage('Performance module coming soon!');
  }

  navigateToTraining(): void {
    this.showSuccessMessage('Training module coming soon!');
  }

  navigateToSupport(): void {
    this.showSuccessMessage('IT Support module coming soon!');
  }

  // Notification handler
  showNotifications(): void {
    this.showSuccessMessage('You have 3 new notifications');
  }

  // Logout functionality
  logout(): void {
    console.log('Logout clicked');
    if (isPlatformBrowser(this.platformId)) {
      localStorage.clear();
    }
    this.showSuccessMessage('Logging out...');
    setTimeout(() => {
      this.router.navigate(['/employee/login']);
    }, 1000);
  }

  // Utility methods for dashboard stats
  refreshDashboard(): void {
    this.showSuccessMessage('Dashboard refreshed!');
    this.loadDashboardData();
    this.updateDateTime();
  }

  // Quick action methods
  quickLeaveRequest(): void {
    this.router.navigate(['/employee/leave']);
  }

  quickPayslipDownload(): void {
    this.router.navigate(['/employee/pay']);
  }

  quickProfileUpdate(): void {
    this.router.navigate(['/employee/profile']);
  }
}
