import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';

interface FinanceStats {
  pendingInvoices: number;
  overdueInvoices: number;
  totalOutstanding: string;
  totalPaid: string;
  totalInvoices: number;
  agingRecords: number;
  totalMemos: number;
}

interface RecentFinancialActivity {
  type: 'invoice' | 'aging' | 'memo' | 'payment';
  title: string;
  description: string;
  timestamp: Date;
}

interface VendorProfile {
  vendorId?: string;
  lifnr?: string;
}

@Component({
  selector: 'app-finance',
  standalone: true,
  imports: [CommonModule, RouterModule, HttpClientModule],
  templateUrl: './finance.component.html',
  styleUrls: ['./finance.component.css']
})
export class FinanceComponent implements OnInit {
  vendorProfile: VendorProfile | null = null;
  financeStats: FinanceStats | null = null;
  recentFinancialActivities: RecentFinancialActivity[] = [];

  constructor(private router: Router, private http: HttpClient) {}
  
  ngOnInit() {
    this.loadVendorProfile();
    this.loadFinanceStats();
    this.loadRecentFinancialActivities();
  }

  loadVendorProfile() {
    // Get vendor profile from localStorage
    const storedProfile = localStorage.getItem('vendorProfile');
    if (storedProfile) {
      this.vendorProfile = JSON.parse(storedProfile);
    } else {
      // Default profile structure
      this.vendorProfile = {
        vendorId: localStorage.getItem('VendorId') || 'V001',
        lifnr: localStorage.getItem('lifnr') || localStorage.getItem('VendorId') || 'V001'
      };
    }
  }

  loadFinanceStats() {
    // Try to get stored stats first
    const storedStats = localStorage.getItem('financeStats');
    if (storedStats) {
      this.financeStats = JSON.parse(storedStats);
    } else {
      // Initialize with zero values
      this.financeStats = {
        pendingInvoices: 0,
        overdueInvoices: 0,
        totalOutstanding: '$0',
        totalPaid: '$0',
        totalInvoices: 0,
        agingRecords: 0,
        totalMemos: 0
      };
    }
    
    // Fetch real data from APIs
    this.fetchFinanceStatsFromAPI();
  }

  loadRecentFinancialActivities() {
    // Try to get stored activities first
    const storedActivities = localStorage.getItem('recentFinancialActivities');
    if (storedActivities) {
      this.recentFinancialActivities = JSON.parse(storedActivities).map((activity: any) => ({
        ...activity,
        timestamp: new Date(activity.timestamp)
      }));
    } else {
      // Initialize empty
      this.recentFinancialActivities = [];
    }
    
    // Fetch real data from APIs
    this.fetchRecentFinancialActivitiesFromAPI();
  }

  private async fetchFinanceStatsFromAPI() {
    try {
      const vendorId = this.vendorProfile?.vendorId || this.vendorProfile?.lifnr;
      if (!vendorId) return;

      // Fetch aging data
      const agingResponse = await this.http.get<any>(`http://localhost:3000/api/aging/${vendorId}`).toPromise();
      const agingData = agingResponse?.aging || [];

      // Fetch invoice data
      const invoiceResponse = await this.http.get<any>(`http://localhost:3000/api/invoices/${vendorId}`).toPromise();
      const invoiceData = invoiceResponse?.invoices || [];

      // Fetch memo data
      const memoResponse = await this.http.get<any>(`http://localhost:3000/api/memo/${vendorId}`).toPromise();
      const memoData = memoResponse?.memo || [];

      // Calculate stats from real data
      const pendingInvoices = invoiceData.filter((inv: any) => !this.isOverdue(inv)).length;
      const overdueInvoices = invoiceData.filter((inv: any) => this.isOverdue(inv)).length;
      const totalOutstanding = this.calculateTotalOutstanding(invoiceData);
      const totalPaid = this.calculateTotalPaid(agingData);

      this.financeStats = {
        pendingInvoices,
        overdueInvoices,
        totalOutstanding: `$${totalOutstanding.toLocaleString()}`,
        totalPaid: `$${totalPaid.toLocaleString()}`,
        totalInvoices: invoiceData.length,
        agingRecords: agingData.length,
        totalMemos: memoData.length
      };

      // Store in localStorage
      localStorage.setItem('financeStats', JSON.stringify(this.financeStats));

    } catch (error) {
      console.error('Error fetching finance stats:', error);
      // Keep existing stats if API fails
    }
  }

  private async fetchRecentFinancialActivitiesFromAPI() {
    try {
      const vendorId = this.vendorProfile?.vendorId || this.vendorProfile?.lifnr;
      if (!vendorId) return;

      const activities: RecentFinancialActivity[] = [];

      // Get recent invoices
      const invoiceResponse = await this.http.get<any>(`http://localhost:3000/api/invoices/${vendorId}`).toPromise();
      const recentInvoices = (invoiceResponse?.invoices || []).slice(0, 3);
      
      recentInvoices.forEach((invoice: any) => {
        activities.push({
          type: 'invoice',
          title: `Invoice ${invoice.invoiceNo || 'N/A'} Created`,
          description: `Amount: $${invoice.totalAmount || 0} - ${invoice.description || 'No description'}`,
          timestamp: new Date(invoice.invoiceDate ? this.parseSAPDate(invoice.invoiceDate) : Date.now())
        });
      });

      // Get recent aging updates
      const agingResponse = await this.http.get<any>(`http://localhost:3000/api/aging/${vendorId}`).toPromise();
      const recentAging = (agingResponse?.aging || []).slice(0, 2);
      
      recentAging.forEach((aging: any) => {
        activities.push({
          type: 'aging',
          title: `Payment ${aging.paymentDoc || 'N/A'} Updated`,
          description: `Aging: ${this.getAgingText(aging.aging || 0)} - Amount: $${aging.amountPaid || 0}`,
          timestamp: new Date(aging.paymentDate ? this.parseSAPDate(aging.paymentDate) : Date.now())
        });
      });

      // Sort by timestamp and take latest 5
      this.recentFinancialActivities = activities
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, 5);

      // Store in localStorage
      localStorage.setItem('recentFinancialActivities', JSON.stringify(this.recentFinancialActivities));

    } catch (error) {
      console.error('Error fetching recent activities:', error);
      // Keep existing activities if API fails
    }
  }

  private calculateTotalOutstanding(invoices: any[]): number {
    return invoices.reduce((total, inv) => {
      const amount = parseFloat(inv.totalAmount) || 0;
      return total + amount;
    }, 0);
  }

  private calculateTotalPaid(agingData: any[]): number {
    return agingData.reduce((total, aging) => {
      const amount = parseFloat(aging.amountPaid) || 0;
      return total + amount;
    }, 0);
  }

  private isOverdue(invoice: any): boolean {
    if (!invoice.dueDate) return false;
    const due = new Date(this.parseSAPDate(invoice.dueDate));
    return due < new Date();
  }

  private parseSAPDate(sapDate: string): Date {
    const match = /\/Date\((\d+)\)\//.exec(sapDate);
    if (match) {
      const timestamp = parseInt(match[1], 10);
      return new Date(timestamp);
    }
    return new Date(sapDate);
  }

  private getAgingText(aging: number): string {
    if (aging < 0) {
      return `Early ${Math.abs(aging)}d`;
    } else if (aging === 0) {
      return 'On Time';
    } else {
      return `Overdue ${aging}d`;
    }
  }

  getActivityIcon(type: string): string {
    const iconMap: { [key: string]: string } = {
      'invoice': 'fas fa-file-invoice',
      'aging': 'fas fa-clock',
      'memo': 'fas fa-sticky-note',
      'payment': 'fas fa-credit-card'
    };
    return iconMap[type] || 'fas fa-info-circle';
  }
  
  goTo(path: string) {
    this.router.navigate([`/vendor/finance/${path}`]);
  }

  goBack() {
    this.router.navigate(['/vendor/dashboard']);
  }
}
