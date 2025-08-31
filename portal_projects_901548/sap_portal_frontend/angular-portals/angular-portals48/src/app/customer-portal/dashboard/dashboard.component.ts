import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterModule, CommonModule, HttpClientModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  // Real data properties
  totalInquiries: number = 0;
  totalSalesValue: string = '$0';
  pendingDeliveries: number = 0;
  customerId: string = '200000';
  isLoading: boolean = false;
  errorMessage: string = '';

  constructor(
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  logout() {
    localStorage.clear();
    this.router.navigate(['/customer/login']);
  }

  private loadDashboardData(): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    const customerId = localStorage.getItem('customerId') || '200000';
    
    // Fetch all data in parallel
    Promise.all([
      this.fetchInquiryData(customerId),
      this.fetchSalesData(customerId),
      this.fetchDeliveryData(customerId)
    ]).finally(() => {
      this.isLoading = false;
    });
  }

  private fetchInquiryData(kunnr: string): Promise<void> {
    return new Promise((resolve) => {
      this.http.get<any>(`http://localhost:3001/api/inquiry/${kunnr}`).subscribe({
        next: (response) => {
          try {
            let inquiries = [];
            if (response && response.success && response.data) {
              inquiries = response.data;
            } else if (response && Array.isArray(response)) {
              inquiries = response;
            } else if (response && response.data && Array.isArray(response.data)) {
              inquiries = response.data;
            }
            this.totalInquiries = inquiries.length;
            console.log('Inquiry data loaded:', this.totalInquiries, 'inquiries');
          } catch (error) {
            console.error('Error processing inquiry data:', error);
            this.totalInquiries = 0;
          }
          resolve();
        },
        error: (error) => {
          console.error('Error fetching inquiry data:', error);
          this.totalInquiries = 0;
          resolve();
        }
      });
    });
  }

  private fetchSalesData(kunnr: string): Promise<void> {
    return new Promise((resolve) => {
      this.http.get<any>(`http://localhost:3001/api/sales/${kunnr}`).subscribe({
        next: (response) => {
          try {
            let salesData = [];
            if (response && response.success && response.data) {
              salesData = response.data;
            } else if (response && Array.isArray(response)) {
              salesData = response;
            } else if (response && response.data && Array.isArray(response.data)) {
              salesData = response.data;
            }
            
            // Calculate total net value from the Net Value column
            const totalValue = salesData.reduce((sum: number, sale: any) => {
              // Try different possible field names for net value
              const netValue = parseFloat(sale.netwr || sale.netValue || sale.net_value || sale.amount || 0);
              return sum + (isNaN(netValue) ? 0 : netValue);
            }, 0);
            
            this.totalSalesValue = this.formatCurrency(totalValue);
            console.log('Sales data loaded:', this.totalSalesValue, 'from', salesData.length, 'records');
          } catch (error) {
            console.error('Error processing sales data:', error);
            this.totalSalesValue = '$0';
          }
          resolve();
        },
        error: (error) => {
          console.error('Error fetching sales data:', error);
          this.totalSalesValue = '$0';
          resolve();
        }
      });
    });
  }

  private fetchDeliveryData(customerId: string): Promise<void> {
    return new Promise((resolve) => {
      this.http.get<any>(`http://localhost:3001/api/delivery/${customerId}`).subscribe({
        next: (response) => {
          try {
            let deliveryData = [];
            if (response && response.success && response.data) {
              deliveryData = response.data;
            } else if (response && Array.isArray(response)) {
              deliveryData = response;
            } else if (response && response.data && Array.isArray(response.data)) {
              deliveryData = response.data;
            }
            
            // Calculate pending deliveries (delivery date is in the future)
            const currentDate = new Date();
            this.pendingDeliveries = deliveryData.filter((delivery: any) => {
              if (!delivery.lfdat) return false;
              
              // Handle different date formats
              let deliveryDate: Date;
              if (typeof delivery.lfdat === 'string') {
                // Try to parse the date string
                deliveryDate = new Date(delivery.lfdat);
              } else if (delivery.lfdat instanceof Date) {
                deliveryDate = delivery.lfdat;
              } else {
                return false;
              }
              
              // Check if the date is valid and in the future
              return !isNaN(deliveryDate.getTime()) && deliveryDate > currentDate;
            }).length;
            
            console.log('Delivery data loaded:', this.pendingDeliveries, 'pending deliveries from', deliveryData.length, 'records');
          } catch (error) {
            console.error('Error processing delivery data:', error);
            this.pendingDeliveries = 0;
          }
          resolve();
        },
        error: (error) => {
          console.error('Error fetching delivery data:', error);
          this.pendingDeliveries = 0;
          resolve();
        }
      });
    });
  }

  private formatCurrency(value: number): string {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`;
    }
    return `$${value.toFixed(0)}`;
  }

  refreshDashboard(): void {
    this.loadDashboardData();
  }

  // Getter for customer ID to use in template
  get customerIdDisplay(): string {
    return localStorage.getItem('customerId') || '200000';
  }
}