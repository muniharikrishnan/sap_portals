// ```typescript
import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID, ViewChild, ElementRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { EmployeeService, LeaveRecord } from '../../services/employee.service';
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';

// Register Chart.js components
Chart.register(...registerables);

interface ChartData {
  labels: string[];
  datasets: any[];
}

interface LeaveAnalytics {
  totalLeaves: number;
  totalDays: number;
  leaveTypes: { [key: string]: number };
  monthlyTrends: { [key: string]: number };
  durationDistribution: { [key: string]: number };
  statusBreakdown: { [key: string]: number };
  quarterlyComparison: { [key: string]: number };
}

@Component({
  selector: 'app-leave-visual',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './leave-visual.component.html',
  styleUrl: './leave-visual.component.css'
})
export class LeaveVisualComponent implements OnInit, OnDestroy {
  @ViewChild('pieChart', { static: false }) pieChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('barChart', { static: false }) barChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('lineChart', { static: false }) lineChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('donutChart', { static: false }) donutChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('columnChart', { static: false }) columnChartRef!: ElementRef<HTMLCanvasElement>;

  leaveRecords: LeaveRecord[] = [];
  isLoading: boolean = false;
  error: string = '';
  employeeId: string = '';
  
  // Chart instances
  pieChart: Chart | null = null;
  barChart: Chart | null = null;
  lineChart: Chart | null = null;
  donutChart: Chart | null = null;
  columnChart: Chart | null = null;

  // Analytics data
  analytics: LeaveAnalytics = {
    totalLeaves: 0,
    totalDays: 0,
    leaveTypes: {},
    monthlyTrends: {},
    durationDistribution: {},
    statusBreakdown: {},
    quarterlyComparison: {}
  };

  // Chart colors matching the teal theme
  chartColors = {
    primary: '#14b8a6',
    secondary: '#0d9488',
    accent: '#5eead4',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
    purple: '#8b5cf6',
    pink: '#ec4899',
    orange: '#f97316'
  };

  constructor(
    private employeeService: EmployeeService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    this.employeeId = this.employeeService.getCurrentEmployeeId() || '';
    
    if (!this.employeeId) {
      if (typeof window !== 'undefined') {
        this.router.navigate(['/employee/login']);
      }
      return;
    }

    this.loadLeaveData();
  }

  ngOnDestroy(): void {
    this.destroyCharts();
  }

  /**
   * Load leave data from SAP backend
   */
  loadLeaveData(): void {
    this.isLoading = true;
    this.error = '';

    console.log('Loading leave data for visualization:', this.employeeId);

    this.employeeService.getEmployeeLeave(this.employeeId).subscribe({
      next: (response) => {
        console.log('Leave data received for visualization:', response);
        this.leaveRecords = response.leaves || [];
        this.processAnalytics();
        this.isLoading = false;
        
        // Create charts after data is loaded and view is initialized
        setTimeout(() => {
          this.createCharts();
        }, 100);
      },
      error: (error) => {
        console.error('Error fetching leave data for visualization:', error);
        
        if (error.status === 404) {
          this.error = 'Leave endpoint not found. Please check if the backend server is running.';
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
   * Process leave data for analytics
   */
  private processAnalytics(): void {
    this.analytics.totalLeaves = this.leaveRecords.length;
    this.analytics.totalDays = this.leaveRecords.reduce((sum, leave) => {
      return sum + (parseInt(leave.absenceDays) || 0);
    }, 0);

    // Process leave types
    this.analytics.leaveTypes = {};
    this.leaveRecords.forEach(leave => {
      const type = this.getLeaveTypeDisplay(leave.absenceType || 'Unknown');
      this.analytics.leaveTypes[type] = (this.analytics.leaveTypes[type] || 0) + 1;
    });

    // Process monthly trends
    this.analytics.monthlyTrends = {};
    this.leaveRecords.forEach(leave => {
      const date = new Date(leave.startDate);
      const monthYear = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      this.analytics.monthlyTrends[monthYear] = (this.analytics.monthlyTrends[monthYear] || 0) + 1;
    });

    // Process duration distribution
    this.analytics.durationDistribution = {};
    this.leaveRecords.forEach(leave => {
      const days = parseInt(leave.absenceDays) || 0;
      let category = '';
      
      if (days === 1) category = '1 Day';
      else if (days <= 3) category = '2-3 Days';
      else if (days <= 7) category = '4-7 Days';
      else if (days <= 14) category = '1-2 Weeks';
      else category = '2+ Weeks';
      
      this.analytics.durationDistribution[category] = (this.analytics.durationDistribution[category] || 0) + 1;
    });

    // Process status breakdown
    this.analytics.statusBreakdown = {};
    this.leaveRecords.forEach(leave => {
      const status = this.getLeaveStatus(leave.startDate, leave.endDate).status;
      this.analytics.statusBreakdown[status] = (this.analytics.statusBreakdown[status] || 0) + 1;
    });

    // Process quarterly comparison
    this.analytics.quarterlyComparison = {};
    this.leaveRecords.forEach(leave => {
      const date = new Date(leave.startDate);
      const quarter = `Q${Math.floor(date.getMonth() / 3) + 1} ${date.getFullYear()}`;
      this.analytics.quarterlyComparison[quarter] = (this.analytics.quarterlyComparison[quarter] || 0) + 1;
    });
  }

  /**
   * Create all charts
   */
  private createCharts(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this.createPieChart();
    this.createBarChart();
    this.createLineChart();
    this.createDonutChart();
    this.createColumnChart();
  }

  /**
   * Create pie chart for leave types distribution
   */
  private createPieChart(): void {
    if (!this.pieChartRef?.nativeElement) return;

    const ctx = this.pieChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const labels = Object.keys(this.analytics.leaveTypes);
    const data = Object.values(this.analytics.leaveTypes);
    const colors = [
      this.chartColors.primary,
      this.chartColors.secondary,
      this.chartColors.accent,
      this.chartColors.success,
      this.chartColors.warning,
      this.chartColors.info,
      this.chartColors.purple,
      this.chartColors.pink
    ];

    this.pieChart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: colors.slice(0, labels.length),
          borderColor: '#1e293b',
          borderWidth: 2,
          hoverBorderWidth: 3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: '#ffffff',
              font: { size: 12 },
              padding: 15
            }
          },
          tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
            titleColor: '#ffffff',
            bodyColor: '#ffffff',
            borderColor: this.chartColors.primary,
            borderWidth: 1
          }
        }
      }
    });
  }

  /**
   * Create bar chart for duration distribution
   */
  private createBarChart(): void {
    if (!this.barChartRef?.nativeElement) return;

    const ctx = this.barChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const labels = Object.keys(this.analytics.durationDistribution);
    const data = Object.values(this.analytics.durationDistribution);

    this.barChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Number of Leaves',
          data: data,
          backgroundColor: this.chartColors.primary,
          borderColor: this.chartColors.secondary,
          borderWidth: 1,
          borderRadius: 8,
          borderSkipped: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: {
              color: '#ffffff',
              font: { size: 12 }
            }
          },
          tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
            titleColor: '#ffffff',
            bodyColor: '#ffffff',
            borderColor: this.chartColors.primary,
            borderWidth: 1
          }
        },
        scales: {
          x: {
            ticks: { color: '#ffffff' },
            grid: { color: 'rgba(255, 255, 255, 0.1)' }
          },
          y: {
            ticks: { color: '#ffffff' },
            grid: { color: 'rgba(255, 255, 255, 0.1)' }
          }
        }
      }
    });
  }

  /**
   * Create line chart for monthly trends
   */
  private createLineChart(): void {
    if (!this.lineChartRef?.nativeElement) return;

    const ctx = this.lineChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const labels = Object.keys(this.analytics.monthlyTrends);
    const data = Object.values(this.analytics.monthlyTrends);

    this.lineChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Leaves Taken',
          data: data,
          borderColor: this.chartColors.primary,
          backgroundColor: `${this.chartColors.primary}20`,
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: this.chartColors.primary,
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 6,
          pointHoverRadius: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: {
              color: '#ffffff',
              font: { size: 12 }
            }
          },
          tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
            titleColor: '#ffffff',
            bodyColor: '#ffffff',
            borderColor: this.chartColors.primary,
            borderWidth: 1
          }
        },
        scales: {
          x: {
            ticks: { color: '#ffffff' },
            grid: { color: 'rgba(255, 255, 255, 0.1)' }
          },
          y: {
            ticks: { color: '#ffffff' },
            grid: { color: 'rgba(255, 255, 255, 0.1)' }
          }
        }
      }
    });
  }

  /**
   * Create donut chart for status breakdown
   */
  private createDonutChart(): void {
    if (!this.donutChartRef?.nativeElement) return;

    const ctx = this.donutChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const labels = Object.keys(this.analytics.statusBreakdown);
    const data = Object.values(this.analytics.statusBreakdown);
    const colors = [this.chartColors.success, this.chartColors.warning, this.chartColors.info];

    this.donutChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: colors.slice(0, labels.length),
          borderColor: '#1e293b',
          borderWidth: 2,
          hoverBorderWidth: 3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '60%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: '#ffffff',
              font: { size: 12 },
              padding: 15
            }
          },
          tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
            titleColor: '#ffffff',
            bodyColor: '#ffffff',
            borderColor: this.chartColors.primary,
            borderWidth: 1
          }
        }
      }
    });
  }

  /**
   * Create column chart for quarterly comparison
   */
  private createColumnChart(): void {
    if (!this.columnChartRef?.nativeElement) return;

    const ctx = this.columnChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const labels = Object.keys(this.analytics.quarterlyComparison);
    const data = Object.values(this.analytics.quarterlyComparison);

    this.columnChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Leaves per Quarter',
          data: data,
          backgroundColor: this.chartColors.accent,
          borderColor: this.chartColors.primary,
          borderWidth: 1,
          borderRadius: 8,
          borderSkipped: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: {
              color: '#ffffff',
              font: { size: 12 }
            }
          },
          tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
            titleColor: '#ffffff',
            bodyColor: '#ffffff',
            borderColor: this.chartColors.primary,
            borderWidth: 1
          }
        },
        scales: {
          x: {
            ticks: { color: '#ffffff' },
            grid: { color: 'rgba(255, 255, 255, 0.1)' }
          },
          y: {
            ticks: { color: '#ffffff' },
            grid: { color: 'rgba(255, 255, 255, 0.1)' }
          }
        }
      }
    });
  }

  /**
   * Destroy all chart instances
   */
  private destroyCharts(): void {
    if (this.pieChart) {
      this.pieChart.destroy();
      this.pieChart = null;
    }
    if (this.barChart) {
      this.barChart.destroy();
      this.barChart = null;
    }
    if (this.lineChart) {
      this.lineChart.destroy();
      this.lineChart = null;
    }
    if (this.donutChart) {
      this.donutChart.destroy();
      this.donutChart = null;
    }
    if (this.columnChart) {
      this.columnChart.destroy();
      this.columnChart = null;
    }
  }

  /**
   * Refresh data and recreate charts
   */
  refreshData(): void {
    this.destroyCharts();
    this.loadLeaveData();
  }

  /**
   * Export chart as image
   */
  exportChart(chartType: string): void {
    let chart: Chart | null = null;
    
    switch (chartType) {
      case 'pie': chart = this.pieChart; break;
      case 'bar': chart = this.barChart; break;
      case 'line': chart = this.lineChart; break;
      case 'donut': chart = this.donutChart; break;
      case 'column': chart = this.columnChart; break;
    }

    if (chart) {
      const url = chart.toBase64Image();
      const link = document.createElement('a');
      link.download = `leave-${chartType}-chart.png`;
      link.href = url;
      link.click();
    }
  }

  /**
   * Get leave type display name
   */
  private getLeaveTypeDisplay(type: string): string {
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
   * Get status based on leave dates
   */
  private getLeaveStatus(startDate: string, endDate: string): { status: string, class: string } {
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
   * Get object keys for template iteration
   */
  getObjectKeys(obj: any): string[] {
    return Object.keys(obj);
  }

  /**
   * Get most used leave type
   */
  getMostUsedLeaveType(): string {
    const keys = Object.keys(this.analytics.leaveTypes);
    if (keys.length === 0) return 'N/A';
    return keys.reduce((a, b) => this.analytics.leaveTypes[a] > this.analytics.leaveTypes[b] ? a : b);
  }

  /**
   * Get maximum leave type count
   */
  getMaxLeaveTypeCount(): number {
    const values = Object.values(this.analytics.leaveTypes);
    return values.length > 0 ? Math.max(...values) : 0;
  }

  /**
   * Get peak leave month
   */
  getPeakLeaveMonth(): string {
    const keys = Object.keys(this.analytics.monthlyTrends);
    if (keys.length === 0) return 'N/A';
    return keys.reduce((a, b) => this.analytics.monthlyTrends[a] > this.analytics.monthlyTrends[b] ? a : b);
  }

  /**
   * Get completion percentage
   */
  getCompletionPercentage(): number {
    if (this.analytics.totalLeaves === 0) return 0;
    const completed = this.analytics.statusBreakdown['Completed'] || 0;
    return Math.round((completed / this.analytics.totalLeaves) * 100);
  }
}
