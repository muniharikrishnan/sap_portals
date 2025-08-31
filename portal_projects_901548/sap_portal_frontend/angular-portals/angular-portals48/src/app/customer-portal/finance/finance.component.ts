import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterOutlet, RouterModule, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-finance',
  imports: [RouterOutlet, RouterModule, CommonModule, FormsModule, HttpClientModule],
  templateUrl: './finance.component.html',
  styleUrl: './finance.component.css'
})
export class FinanceComponent implements OnInit {
  isLoading = false;
  isExporting = false;
  searchTerm = '';
  hasData = true;
  errorMessage = '';
  customerId = '';

  // Finance Statistics - Real data from APIs
  financeStats = {
    pendingInvoices: '0',
    overdueInvoices: '0',
    totalOutstanding: '$0',
    totalPaid: '$0',
    invoiceCount: '0',
    agingCount: '0',
    memoCount: '0',
    overallSalesValue: '$0'
  };

  constructor(private router: Router, private http: HttpClient) {}

  ngOnInit(): void {
    this.customerId = localStorage.getItem('customerId') || '200000';
    this.loadFinanceData();
  }

  loadFinanceData(): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    // Fetch all finance data in parallel
    Promise.all([
      this.fetchInvoiceData(),
      this.fetchAgingData(),
      this.fetchMemoData()
    ]).finally(() => {
      this.isLoading = false;
    });
  }

  private fetchInvoiceData(): Promise<void> {
    return new Promise((resolve) => {
      this.http.get<any>(`http://localhost:3001/api/invoices/${this.customerId}`).subscribe({
        next: (response) => {
          try {
            let invoices = [];
            if (response && response.success && response.data) {
              invoices = response.data;
            } else if (response && Array.isArray(response)) {
              invoices = response;
            } else if (response && response.data && Array.isArray(response.data)) {
              invoices = response.data;
            }
            
            this.financeStats.invoiceCount = invoices.length.toString();
            console.log('Invoice data loaded:', this.financeStats.invoiceCount, 'invoices');
          } catch (error) {
            console.error('Error processing invoice data:', error);
            this.financeStats.invoiceCount = '0';
          }
          resolve();
        },
        error: (error) => {
          console.error('Error fetching invoice data:', error);
          this.financeStats.invoiceCount = '0';
          resolve();
        }
      });
    });
  }

  private fetchAgingData(): Promise<void> {
    return new Promise((resolve) => {
      this.http.get<any>(`http://localhost:3001/api/aging/${this.customerId}`).subscribe({
        next: (response) => {
          try {
            let agingRecords = [];
            if (response && response.success && response.data) {
              agingRecords = response.data;
            } else if (response && Array.isArray(response)) {
              agingRecords = response;
            } else if (response && response.data && Array.isArray(response.data)) {
              agingRecords = response.data;
            }
            
            this.financeStats.agingCount = agingRecords.length.toString();
            console.log('Aging data loaded:', this.financeStats.agingCount, 'records');
          } catch (error) {
            console.error('Error processing aging data:', error);
            this.financeStats.agingCount = '0';
          }
          resolve();
        },
        error: (error) => {
          console.error('Error fetching aging data:', error);
          this.financeStats.agingCount = '0';
          resolve();
        }
      });
    });
  }

  private fetchMemoData(): Promise<void> {
    return new Promise((resolve) => {
      this.http.get<any>(`http://localhost:3001/api/cdmemo/${this.customerId}`).subscribe({
        next: (response) => {
          try {
            let memos = [];
            if (response && response.success && response.data) {
              memos = response.data;
            } else if (response && Array.isArray(response)) {
              memos = response;
            } else if (response && response.data && Array.isArray(response.data)) {
              memos = response.data;
            }
            
            this.financeStats.memoCount = memos.length.toString();
            console.log('Memo data loaded:', this.financeStats.memoCount, 'memos');
          } catch (error) {
            console.error('Error processing memo data:', error);
            this.financeStats.memoCount = '0';
          }
          resolve();
        },
        error: (error) => {
          console.error('Error fetching memo data:', error);
          this.financeStats.memoCount = '0';
          resolve();
        }
      });
    });
  }

  // Search functionality
  onSearch(): void {
    // Implement search functionality if needed
    console.log('Searching for:', this.searchTerm);
  }

  clearSearch(): void {
    this.searchTerm = '';
    console.log('Search cleared');
  }

  refreshFinance(): void {
    this.loadFinanceData();
  }

  exportFinanceData(): void {
    this.isExporting = true;
    
    // Simulate export action
    setTimeout(() => {
      this.isExporting = false;
      console.log('Finance data exported');
    }, 2000);
  }

  goBack(): void {
    // Navigate back to customer dashboard
    this.router.navigate(['/customer/dashboard']);
  }
}
