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
    
    // Determine which data to export
    const dataToExport = this.searchTerm.trim() ? this.filteredSales : this.salesData;
    const fileName = this.searchTerm.trim() 
      ? `Sales_Data_Filtered_${new Date().toISOString().split('T')[0]}.xlsx`
      : `Sales_Data_All_${new Date().toISOString().split('T')[0]}.xlsx`;
    
    // Create Excel data
    const excelData = this.prepareExcelData(dataToExport);
    
    // Download the Excel file
    this.downloadExcelFile(excelData, fileName);
    
    // Reset export state
    setTimeout(() => {
      this.isExporting = false;
    }, 1000);
  }

  private prepareExcelData(data: any[]): any[] {
    // Define headers
    const headers = [
      'Sales Order',
      'Date',
      'Customer',
      'Net Value',
      'Currency',
      'Status',
      'Item No',
      'Material',
      'Description',
      'Quantity',
      'UOM'
    ];

    // Create data rows
    const rows = data.map(item => [
      item.vbeln || '',
      item.erdat || '',
      item.kunnr || '',
      item.netwr || '',
      item.waerk || '',
      item.status || '',
      item.posnr || '',
      item.matnr || '',
      item.arktx || '',
      item.kwmeng || '',
      item.vrkme || ''
    ]);

    // Return data with headers
    return [headers, ...rows];
  }

  private downloadExcelFile(data: any[], fileName: string): void {
    // Convert data to CSV format (Excel can open CSV files)
    const csvContent = data.map(row => 
      row.map((cell: any) => `"${cell}"`).join(',')
    ).join('\n');
    
    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    console.log(`Exported ${data.length - 1} sales records to ${fileName}`);
  }
}
