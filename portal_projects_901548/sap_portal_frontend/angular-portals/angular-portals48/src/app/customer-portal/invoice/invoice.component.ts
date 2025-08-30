import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http'


@Component({
  selector: 'app-invoice',
  imports: [CommonModule, FormsModule,HttpClientModule],
  templateUrl: './invoice.component.html',
  styleUrls: ['./invoice.component.css']
})
export class InvoiceComponent implements OnInit {
  invoices: any[] = [];
  filteredInvoices: any[] = [];
  downloadingInvoices: Set<string> = new Set(); // Track which invoices are being downloaded
  isLoading: boolean = false;
  isExporting: boolean = false;
  searchTerm: string = '';
  errorMessage: string = '';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    const customerId = localStorage.getItem('customerId');
    if (customerId) {
      this.fetchInvoices(customerId);
    } else {
      console.error('Customer ID not found in local storage');
      this.errorMessage = 'Customer ID not found. Please login again.';
    }
  }

  fetchInvoices(kunnr: string): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    this.http.get<any>(`http://localhost:3001/api/invoices/${kunnr}`).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          this.invoices = response.data;
          this.filteredInvoices = response.data;
        } else {
          console.error('Failed to load invoices');
          this.errorMessage = 'Failed to load invoices. Please try again.';
        }
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error fetching invoices:', error);
        this.errorMessage = 'Error loading invoices. Please check your connection.';
      }
    });
  }

  onSearch(): void {
    if (!this.searchTerm.trim()) {
      this.filteredInvoices = this.invoices;
      return;
    }

    const searchLower = this.searchTerm.toLowerCase();
    this.filteredInvoices = this.invoices.filter(invoice => 
      invoice.vbeln?.toLowerCase().includes(searchLower) ||
      invoice.fkdat?.toLowerCase().includes(searchLower) ||
      invoice.kunag?.toLowerCase().includes(searchLower) ||
      invoice.netwr?.toString().includes(searchLower) ||
      invoice.waerk?.toLowerCase().includes(searchLower) ||
      invoice.fkart?.toLowerCase().includes(searchLower) ||
      invoice.matnr?.toLowerCase().includes(searchLower) ||
      invoice.arktx?.toLowerCase().includes(searchLower) ||
      invoice.ernam?.toLowerCase().includes(searchLower)
    );
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.filteredInvoices = this.invoices;
  }

  refreshInvoices(): void {
    const customerId = localStorage.getItem('customerId');
    if (customerId) {
      this.fetchInvoices(customerId);
    }
  }

  exportInvoiceData(): void {
    this.isExporting = true;
    
    // Simulate export process
    setTimeout(() => {
      this.isExporting = false;
      // Here you would implement actual export logic
      console.log('Exporting invoice data...');
    }, 2000);
  }

  downloadPDF(vbeln: string): void {
    // Prevent multiple downloads of the same invoice
    if (this.downloadingInvoices.has(vbeln)) {
      return;
    }

    // Add to downloading set to show loading state
    this.downloadingInvoices.add(vbeln);

    // Call your backend API
    this.http.get<any>(`http://localhost:3001/api/invoice-data/${vbeln}`).subscribe({
      next: (response) => {
        if (response.success && response.base64) {
          // Convert base64 to PDF and download
          this.downloadBase64PDF(response.base64, response.filename || `Invoice_${vbeln}.pdf`);
        } else {
          console.error('Failed to get PDF data:', response.message);
          alert('Failed to generate PDF. Please try again.');
        }
        // Remove from downloading set
        this.downloadingInvoices.delete(vbeln);
      },
      error: (error) => {
        console.error('Error downloading PDF:', error);
        alert('Error downloading PDF. Please check your connection and try again.');
        // Remove from downloading set
        this.downloadingInvoices.delete(vbeln);
      }
    });
  }

  isDownloading(vbeln: string): boolean {
    return this.downloadingInvoices.has(vbeln);
  }

  private downloadBase64PDF(base64Data: string, filename: string): void {
    try {
      // Convert base64 to binary
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Create blob and download
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      // Create temporary link and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      console.log(`PDF downloaded successfully: ${filename}`);
    } catch (error) {
      console.error('Error creating PDF download:', error);
      alert('Error creating PDF download. Please try again.');
    }
  }
}
