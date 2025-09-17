
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FinanceAnalyticsComponent } from './finance-analytics/finance-analytics.component';
import { HttpClient } from '@angular/common/http';
import { HttpClientModule } from '@angular/common/http';

interface DashboardStats {
  activeRfqs: number;
  activePOs: number;
  pendingDeliveries: number;
  pendingInvoices: number;
  totalValue: string;
}

interface RecentActivity {
  type: 'rfq' | 'po' | 'delivery' | 'invoice' | 'profile';
  title: string;
  description: string;
  timestamp: Date;
}

interface VendorProfile {
  name: string;
  vendorId?: string;
  lifnr?: string;
  email?: string;
  company?: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FinanceAnalyticsComponent, HttpClientModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  vendorProfile: VendorProfile | null = null;
  dashboardStats: DashboardStats | null = null;
  recentActivities: RecentActivity[] = [];

  constructor(private router: Router, private http: HttpClient) {}

  ngOnInit() {
    this.loadVendorProfile();
    this.loadDashboardStats();
    this.loadRecentActivities();
  }

  loadVendorProfile() {
    // Try to get vendor profile from localStorage or service
    const storedProfile = localStorage.getItem('vendorProfile');
    if (storedProfile) {
      this.vendorProfile = JSON.parse(storedProfile);
    } else {
      // Default profile structure
      const storedId = localStorage.getItem('VendorId') || localStorage.getItem('vendorId') || localStorage.getItem('lifnr');
      this.vendorProfile = {
        name: 'Vendor User',
        vendorId: storedId || 'V001',
        lifnr: storedId || 'V001'
      };
    }
  }

  loadDashboardStats() {
    // In a real app, this would come from your SAP backend service
    // For now, we'll set up the structure for when the service is connected
    const storedStats = localStorage.getItem('dashboardStats');
    if (storedStats) {
      this.dashboardStats = JSON.parse(storedStats);
    } else {
      // Initialize with zero values - will be replaced by actual API calls
      this.dashboardStats = {
        activeRfqs: 0,
        activePOs: 0,
        pendingDeliveries: 0,
        pendingInvoices: 0,
        totalValue: '$0'
      };
      
      // TODO: Replace with actual service calls to SAP backend
      this.fetchDashboardStatsFromAPI();
      // Fetch Purchase Orders count without interrupting other calls
      this.fetchPoCount();
    }
  }

  loadRecentActivities() {
    // In a real app, this would come from your SAP backend service
    const storedActivities = localStorage.getItem('recentActivities');
    if (storedActivities) {
      this.recentActivities = JSON.parse(storedActivities).map((activity: any) => ({
        ...activity,
        timestamp: new Date(activity.timestamp)
      }));
    } else {
      // Initialize empty - will be populated by API calls
      this.recentActivities = [];
      
      // TODO: Replace with actual service calls to SAP backend
      this.fetchRecentActivitiesFromAPI();
    }
  }

  private async fetchDashboardStatsFromAPI() {
    try {
      // TODO: Implement actual API call to your SAP backend
      // Example:
      // const response = await this.vendorService.getDashboardStats(this.vendorProfile?.lifnr);
      // this.dashboardStats = response.data;
      
      // For now, simulate loading
      setTimeout(() => {
        if (this.dashboardStats) {
          // Update with simulated data - remove when real API is connected
          this.dashboardStats = {
            activeRfqs: 5,
            activePOs: this.dashboardStats.activePOs || 0,
            pendingDeliveries: 3,
            pendingInvoices: 7,
            totalValue: '$45,250'
          };
        }
      }, 1000);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  }

  private fetchPoCount(): void {
    const vendorId = this.getVendorId();
    if (!vendorId) {
      return;
    }

    this.http.get<any>(`http://localhost:3000/api/purchase/${vendorId}`).subscribe({
      next: (res) => {
        // Determine rows count from common response shapes
        const rows = Array.isArray(res) ? res.length
          : Array.isArray(res?.purchase) ? res.purchase.length
          : Array.isArray(res?.data) ? res.data.length
          : Array.isArray(res?.items) ? res.items.length
          : Number(res?.count) || 0;

        this.dashboardStats = this.dashboardStats ? {
          ...this.dashboardStats,
          activePOs: rows
        } : {
          activeRfqs: 0,
          activePOs: rows,
          pendingDeliveries: 0,
          pendingInvoices: 0,
          totalValue: '$0'
        };
      },
      error: (err) => {
        console.error('Failed to fetch PO count:', err);
      }
    });
  }

  private getVendorId(): string | null {
    // Prefer profile if present
    if (this.vendorProfile?.lifnr) return this.vendorProfile.lifnr;
    if (this.vendorProfile?.vendorId) return this.vendorProfile.vendorId;

    // Fall back to localStorage keys commonly used in the app
    return localStorage.getItem('VendorId')
      || localStorage.getItem('vendorId')
      || localStorage.getItem('lifnr');
  }

  private async fetchRecentActivitiesFromAPI() {
    try {
      // TODO: Implement actual API call to your SAP backend
      // Example:
      // const response = await this.vendorService.getRecentActivities(this.vendorProfile?.lifnr);
      // this.recentActivities = response.data;
      
      // For now, simulate loading
      setTimeout(() => {
        // Update with simulated data - remove when real API is connected
        this.recentActivities = [
          {
            type: 'rfq',
            title: 'New RFQ Received',
            description: 'RFQ #RFQ-2024-001 requires your quotation',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
          },
          {
            type: 'po',
            title: 'Purchase Order Confirmed',
            description: 'PO #PO-2024-005 has been confirmed',
            timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
          },
          {
            type: 'delivery',
            title: 'Goods Receipt Updated',
            description: 'Delivery #DEL-2024-003 status updated',
            timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
          }
        ];
      }, 1500);
    } catch (error) {
      console.error('Error fetching recent activities:', error);
    }
  }

  getActivityIcon(type: string): string {
    const iconMap: { [key: string]: string } = {
      'rfq': 'fas fa-file-alt',
      'po': 'fas fa-shopping-cart',
      'delivery': 'fas fa-truck',
      'invoice': 'fas fa-file-invoice',
      'profile': 'fas fa-user'
    };
    return iconMap[type] || 'fas fa-info-circle';
  }

  scrollToFinanceAnalytics() {
    const analyticsSection = document.querySelector('.finance-analytics-section');
    if (analyticsSection) {
      analyticsSection.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }
  }

  logout() {
    // Clear stored data
    localStorage.removeItem('vendorProfile');
    localStorage.removeItem('dashboardStats');
    localStorage.removeItem('recentActivities');
    localStorage.removeItem('vendorId');
    localStorage.removeItem('lifnr');
    
    // Navigate to vendor login
    this.router.navigate(['/vendor/login']);
  }
}
