import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EmployeeService, LeaveRecord } from '../../services/employee.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-leave',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './leave.component.html',
  styleUrl: './leave.component.css'
})
export class LeaveComponent implements OnInit {
  leaveRecords: LeaveRecord[] = [];
  isLoading: boolean = false;
  error: string = '';
  employeeId: string = '';
  
  // Statistics
  totalLeaves: number = 0;
  totalDays: number = 0;
  leaveTypes: { [key: string]: number } = {};

  constructor(
    private employeeService: EmployeeService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.employeeId = this.employeeService.getCurrentEmployeeId() || '';
    
    if (!this.employeeId) {
      // During SSR, localStorage is not available, so we'll handle this in the browser
      if (typeof window !== 'undefined') {
        this.router.navigate(['/employee/login']);
      }
      return;
    }

    this.loadLeaveData();
  }

  /**
   * Load leave data from SAP backend
   */
  loadLeaveData(): void {
    this.isLoading = true;
    this.error = '';

    console.log('Loading leave data for employee ID:', this.employeeId);
    console.log('API URL:', `http://localhost:3002/api/employee-leave`);

    this.employeeService.getEmployeeLeave(this.employeeId).subscribe({
      next: (response) => {
        console.log('Leave data received:', response);
        this.leaveRecords = response.leaves || [];
        this.calculateStatistics();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error fetching leave data:', error);
        console.error('Error status:', error.status);
        console.error('Error message:', error.message);
        
        if (error.status === 404) {
          this.error = 'Leave endpoint not found. Please check if the backend server is running and the route is properly configured.';
        } else if (error.status === 0) {
          this.error = 'Cannot connect to backend server. Please check if the server is running on port 3002.';
        } else {
          this.error = `Failed to load leave data. Error: ${error.status} - ${error.message}`;
        }
        
        this.isLoading = false;
      }
    });
  }

  /**
   * Calculate leave statistics
   */
  private calculateStatistics(): void {
    this.totalLeaves = this.leaveRecords.length;
    this.totalDays = this.leaveRecords.reduce((sum, leave) => {
      return sum + (parseInt(leave.absenceDays) || 0);
    }, 0);

    // Calculate leave types distribution
    this.leaveTypes = {};
    this.leaveRecords.forEach(leave => {
      const type = leave.absenceType || 'Unknown';
      this.leaveTypes[type] = (this.leaveTypes[type] || 0) + 1;
    });
  }

  /**
   * Format date for display
   */
  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  }

  /**
   * Get leave type display name
   */
  getLeaveTypeDisplay(type: string): string {
    const typeMap: { [key: string]: string } = {
      'AL': 'Annual Leave',
      'SL': 'Sick Leave',
      'ML': 'Maternity Leave',
      'PL': 'Paternity Leave',
      'CL': 'Casual Leave',
      'EL': 'Emergency Leave',
      'UL': 'Unpaid Leave'
    };
    
    return typeMap[type] || type || 'Unknown';
  }

  /**
   * Get status color based on leave dates
   */
  getLeaveStatus(startDate: string, endDate: string): { status: string, class: string } {
    const today = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (today < start) {
      return { status: 'Upcoming', class: 'status-upcoming' };
    } else if (today >= start && today <= end) {
      return { status: 'Active', class: 'status-active' };
    } else {
      return { status: 'Completed', class: 'status-completed' };
    }
  }

  /**
   * Refresh leave data
   */
  refreshData(): void {
    this.loadLeaveData();
  }

  /**
   * Get object keys for template iteration
   */
  getObjectKeys(obj: any): string[] {
    return Object.keys(obj);
  }

  /**
   * Track by function for ngFor optimization
   */
  trackByLeave(index: number, leave: LeaveRecord): string {
    return `${leave.employeeId}-${leave.startDate}-${leave.endDate}-${leave.absenceType}`;
  }
}
