
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

  constructor(
    private employeeService: EmployeeService,
    private router: Router,
    private renderer: Renderer2,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.employeeId = this.employeeService.getCurrentEmployeeId();
  }

  ngOnInit(): void {
    this.applyDarkTheme();
  }

  private applyDarkTheme(): void {
    if (isPlatformBrowser(this.platformId)) {
      const body = document.body;
      
      // Always apply dark mode theme
      this.renderer.addClass(body, 'employee-theme');
      this.renderer.addClass(body, 'employee-dark-mode');
      this.renderer.removeClass(body, 'employee-light-mode');
    }
  }

  logout(): void {
    this.employeeService.logoutEmployee();
    this.router.navigate(['/employee/login']);
  }
}



