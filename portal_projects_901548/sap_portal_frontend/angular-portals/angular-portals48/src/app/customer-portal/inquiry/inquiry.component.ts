import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-inquiry',
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './inquiry.component.html',
  styleUrls: ['./inquiry.component.css']
})
export class InquiryComponent implements OnInit {
  inquiries: any[] = [];
  filteredInquiries: any[] = [];
  isLoading: boolean = false;
  isExporting: boolean = false;
  searchTerm: string = '';
  errorMessage: string = '';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    const customerId = localStorage.getItem('customerId');
    if (customerId) {
      this.fetchInquiries(customerId);
    } else {
      console.error('Customer ID not found in local storage');
      this.errorMessage = 'Customer ID not found. Please login again.';
    }
  }

  fetchInquiries(kunnr: string): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    console.log(`Fetching inquiries for customer: ${kunnr}`);
    console.log(`API URL: http://localhost:3001/api/inquiry/${kunnr}`);
    
    this.http.get<any>(`http://localhost:3001/api/inquiry/${kunnr}`).subscribe({
      next: (response) => {
        this.isLoading = false;
        // Handle both response formats: {success: true, data: [...]} or direct array
        if (response.success && response.data) {
          this.inquiries = response.data;
          this.filteredInquiries = response.data;
        } else if (Array.isArray(response)) {
          // Direct array response
          this.inquiries = response;
          this.filteredInquiries = response;
        } else {
          console.error('Failed to load inquiries - unexpected response format:', response);
          this.errorMessage = 'Failed to load inquiries. Please try again.';
        }
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error fetching inquiries:', error);
        this.errorMessage = 'Error loading inquiries. Please check your connection.';
      }
    });
  }

  onSearch(): void {
    if (!this.searchTerm.trim()) {
      this.filteredInquiries = this.inquiries;
      return;
    }

    const searchLower = this.searchTerm.toLowerCase();
    this.filteredInquiries = this.inquiries.filter(inquiry => 
      inquiry.vbeln?.toLowerCase().includes(searchLower) ||
      inquiry.erdat?.toLowerCase().includes(searchLower) ||
      inquiry.auart?.toLowerCase().includes(searchLower) ||
      inquiry.netwr?.toString().includes(searchLower) ||
      inquiry.waerk?.toLowerCase().includes(searchLower) ||
      inquiry.vdate?.toLowerCase().includes(searchLower) ||
      inquiry.posnr?.toLowerCase().includes(searchLower) ||
      inquiry.matnr?.toLowerCase().includes(searchLower) ||
      inquiry.arktx?.toLowerCase().includes(searchLower) ||
      inquiry.kwmeng?.toString().includes(searchLower) ||
      inquiry.vrkme?.toLowerCase().includes(searchLower)
    );
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.filteredInquiries = this.inquiries;
  }

  refreshInquiries(): void {
    const customerId = localStorage.getItem('customerId');
    if (customerId) {
      this.fetchInquiries(customerId);
    }
  }

  exportInquiryData(): void {
    this.isExporting = true;
    
    // Determine which data to export
    const dataToExport = this.searchTerm.trim() ? this.filteredInquiries : this.inquiries;
    const fileName = this.searchTerm.trim() 
      ? `Inquiry_Data_Filtered_${new Date().toISOString().split('T')[0]}.xlsx`
      : `Inquiry_Data_All_${new Date().toISOString().split('T')[0]}.xlsx`;
    
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
      'Inquiry No',
      'Date',
      'Type',
      'Net Value',
      'Currency',
      'Valid Date',
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
      item.auart || '',
      item.netwr || '',
      item.waerk || '',
      item.vdate || '',
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
    
    console.log(`Exported ${data.length - 1} inquiry records to ${fileName}`);
  }
}