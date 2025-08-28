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
  downloadingInvoices: Set<string> = new Set(); // Track which invoices are being downloaded

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    const customerId = localStorage.getItem('customerId');
    if (customerId) {
      this.fetchInvoices(customerId);
    } else {
      console.error('Customer ID not found in local storage');
    }
  }

  fetchInvoices(kunnr: string): void {
    this.http.get<any>(`http://localhost:3001/api/invoices/${kunnr}`).subscribe({
      next: (response) => {
        if (response.success) {
          this.invoices = response.data;
        } else {
          console.error('Failed to load invoices');
        }
      },
      error: (error) => {
        console.error('Error fetching invoices:', error);
      }
    });
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
      console.error('Error processing PDF download:', error);
      alert('Error processing PDF file. Please try again.');
    }
  }

  // Helper method to check if an invoice is being downloaded
  isDownloading(vbeln: string): boolean {
    return this.downloadingInvoices.has(vbeln);
  }
}
