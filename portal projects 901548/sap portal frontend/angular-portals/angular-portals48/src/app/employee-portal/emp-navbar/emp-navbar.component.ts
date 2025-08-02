import { Component, OnInit, Inject, PLATFORM_ID, Renderer2 } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { EmployeeService } from '../../services/employee.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-emp-navbar',
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './emp-navbar.component.html',
  styleUrl: './emp-navbar.component.css'
})
export class EmpNavbarComponent implements OnInit {
  employeeId: string | null = '';
  isDarkMode: boolean = true;

  constructor(
    private employeeService: EmployeeService,
    private router: Router,
    private renderer: Renderer2,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.employeeId = this.employeeService.getCurrentEmployeeId();
  }

  ngOnInit(): void {
    this.loadThemePreference();
    this.applyTheme();
  }

  private loadThemePreference(): void {
    if (isPlatformBrowser(this.platformId)) {
      try {
        const savedTheme = localStorage.getItem('employeePortalTheme');
        if (savedTheme !== null) {
          this.isDarkMode = savedTheme === 'dark';
        } else {
          // Default to dark mode
          this.isDarkMode = true;
          localStorage.setItem('employeePortalTheme', 'dark');
        }
      } catch (error) {
        console.error('Error accessing localStorage:', error);
        this.isDarkMode = true;
      }
    }
  }

  toggleTheme(): void {
    this.isDarkMode = !this.isDarkMode;
    
    if (isPlatformBrowser(this.platformId)) {
      try {
        localStorage.setItem('employeePortalTheme', this.isDarkMode ? 'dark' : 'light');
      } catch (error) {
        console.error('Error saving theme preference:', error);
      }
    }
    
    this.applyTheme();
  }

  private applyTheme(): void {
    if (isPlatformBrowser(this.platformId)) {
      const body = document.body;
      
      if (this.isDarkMode) {
        this.renderer.addClass(body, 'employee-dark-mode');
        this.renderer.removeClass(body, 'employee-light-mode');
      } else {
        this.renderer.addClass(body, 'employee-light-mode');
        this.renderer.removeClass(body, 'employee-dark-mode');
      }
    }
  }

  logout(): void {
    this.employeeService.logoutEmployee();
    this.router.navigate(['/employee/login']);
  }
}
