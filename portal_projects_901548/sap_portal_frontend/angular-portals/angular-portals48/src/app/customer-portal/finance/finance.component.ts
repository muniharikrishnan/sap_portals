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

  // Finance Statistics - Updated to match vendor finance structure
  financeStats = {
    pendingInvoices: '8',
    overdueInvoices: '0',
    totalOutstanding: '$4,000',
    totalPaid: '$105.04',
    invoiceCount: '8',
    agingCount: '8',
    memoCount: '8',
    overallSalesValue: '$12.3K'
  };

  constructor(private router: Router, private http: HttpClient) {}

  ngOnInit(): void {
    this.customerId = localStorage.getItem('customerId') || '200000';
    this.loadFinanceData();
  }

  loadFinanceData(): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    // Simulate loading finance data
    setTimeout(() => {
      this.isLoading = false;
      // In a real application, you would fetch data from your backend
      // this.http.get(`http://localhost:3001/api/finance/${this.customerId}`).subscribe({
      //   next: (res: any) => {
      //     this.isLoading = false;
      //     if (res.success) {
      //       this.financeStats = res.data;
      //     } else {
      //       this.errorMessage = res.message || 'Failed to load finance data';
      //     }
      //   },
      //   error: (err) => {
      //     this.isLoading = false;
      //     this.errorMessage = 'Error loading finance data';
      //     console.error(err);
      //   }
      // });
    }, 1000);
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
    this.isLoading = true;
    
    // Simulate refresh action
    setTimeout(() => {
      this.isLoading = false;
      console.log('Finance data refreshed');
    }, 1000);
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
