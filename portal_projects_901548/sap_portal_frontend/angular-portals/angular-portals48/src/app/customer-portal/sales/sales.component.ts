import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-sales',
  imports: [CommonModule,FormsModule, HttpClientModule],
  templateUrl: './sales.component.html',
  styleUrls: ['./sales.component.css']
})
export class SalesComponent implements OnInit {
  salesData: any[] = [];
  filteredSales: any[] = [];
  isLoading = false;
  isExporting = false;
  errorMessage = '';
  searchTerm = '';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    const customerId = localStorage.getItem('customerId');
    if (customerId) {
      this.fetchSalesData(customerId);
    } else {
      this.errorMessage = 'Customer ID not found.';
    }
  }

  fetchSalesData(kunnr: string): void {
    this.isLoading = true;
    this.http.get<any>(`http://localhost:3001/api/sales/${kunnr}`).subscribe({
      next: (res) => {
        if (res.success) {
          this.salesData = res.data;
          this.filteredSales = res.data; // Initialize filtered data
        } else {
          this.errorMessage = 'No sales data found.';
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.errorMessage = 'Error fetching sales data.';
        this.isLoading = false;
      }
    });
  }

  // Search functionality
  onSearch(): void {
    if (!this.searchTerm.trim()) {
      this.filteredSales = this.salesData;
      return;
    }

    const searchLower = this.searchTerm.toLowerCase();
    this.filteredSales = this.salesData.filter(item => 
      item.vbeln?.toLowerCase().includes(searchLower) ||
      item.ernam?.toLowerCase().includes(searchLower) ||
      item.matnr?.toLowerCase().includes(searchLower) ||
      item.arktx?.toLowerCase().includes(searchLower) ||
      item.auart?.toLowerCase().includes(searchLower)
    );
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.filteredSales = this.salesData;
  }

  refreshSales(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.searchTerm = '';
    
    const customerId = localStorage.getItem('customerId');
    if (customerId) {
      this.fetchSalesData(customerId);
    } else {
      this.errorMessage = 'Customer ID not found.';
      this.isLoading = false;
    }
  }

  exportSalesData(): void {
    if (!this.salesData.length) {
      alert('No sales data available to export');
      return;
    }

    this.isExporting = true;
    
    // Create CSV content
    const headers = ['Sales Order', 'Date', 'Customer', 'Net Value', 'Currency', 'Status', 'Item No', 'Material', 'Description', 'Quantity', 'UOM'];
    const csvContent = [
      headers.join(','),
      ...this.salesData.map(item => [
        item.vbeln || '',
        item.erdat || '',
        item.ernam || '',
        item.netwr || '',
        item.waerk || '',
        item.auart || '',
        item.posnr || '',
        item.matnr || '',
        item.arktx || '',
        item.kwmeng || '',
        item.vrkme || ''
      ].join(','))
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sales-data-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
    
    this.isExporting = false;
  }
}
