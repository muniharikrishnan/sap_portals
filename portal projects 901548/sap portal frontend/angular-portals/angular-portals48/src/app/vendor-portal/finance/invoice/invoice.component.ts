import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-invoice',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule],
  templateUrl: './invoice.component.html',
  styleUrls: ['./invoice.component.css']
})
export class InvoiceComponent implements OnInit {
  isLoading: boolean = false;
  currentPage: number = 1;
  itemsPerPage: number = 10;
  Math = Math;

  get filteredInvoices(): any[] {
    return this.filteredInvoiceData;
  }

  get paginatedInvoices(): any[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredInvoices.slice(startIndex, endIndex);
  }

  onSearchChange(): void {
    this.currentPage = 1;
  }

  sortField: string = '';
  sortAscending: boolean = true;
  sortData(field: string): void {
    if (this.sortField === field) {
      this.sortAscending = !this.sortAscending;
    } else {
      this.sortField = field;
      this.sortAscending = true;
    }
  }

  get sortedInvoiceData(): any[] {
    let data = this.filteredInvoiceData;
    if (this.sortField) {
      data = [...data].sort((a, b) => {
        const aValue = a[this.sortField];
        const bValue = b[this.sortField];
        if (aValue == null && bValue == null) return 0;
        if (aValue == null) return this.sortAscending ? -1 : 1;
        if (bValue == null) return this.sortAscending ? 1 : -1;
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return this.sortAscending ? aValue - bValue : bValue - aValue;
        }
        return this.sortAscending
          ? String(aValue).localeCompare(String(bValue))
          : String(bValue).localeCompare(String(aValue));
      });
    }
    return data;
  }

  trackByInvoice(index: number, item: any): any {
    return item.id || index;
  }

  changePage(offset: number): void {
    const totalPages = Math.ceil(this.filteredInvoices.length / this.itemsPerPage);
    this.currentPage = Math.max(1, Math.min(this.currentPage + offset, totalPages));
  }

  isOverdue(invoice: any): boolean {
    if (!invoice.dueDate) return false;
    const due = new Date(invoice.dueDate);
    return due < new Date();
  }
  invoiceData: any[] = [];
  errorMessage: string = '';
  loading: boolean = false;
  searchTerm: string = '';

  get filteredInvoiceData() {
    if (!this.searchTerm) return this.invoiceData;
    const term = this.searchTerm.toLowerCase();
    return this.invoiceData.filter(inv =>
      (inv.invoiceNo && inv.invoiceNo.toString().toLowerCase().includes(term)) ||
      (inv.invoiceDate && this.formatDate(inv.invoiceDate).toLowerCase().includes(term)) ||
      (inv.poNo && inv.poNo.toString().toLowerCase().includes(term)) ||
      (inv.poItem && inv.poItem.toString().toLowerCase().includes(term)) ||
      (inv.materialNo && inv.materialNo.toString().toLowerCase().includes(term)) ||
      (inv.description && inv.description.toLowerCase().includes(term)) ||
      (inv.quantity && inv.quantity.toString().toLowerCase().includes(term)) ||
      (inv.unit && inv.unit.toLowerCase().includes(term)) ||
      (inv.unitPrice && inv.unitPrice.toString().toLowerCase().includes(term)) ||
      (inv.totalAmount && inv.totalAmount.toString().toLowerCase().includes(term)) ||
      (inv.currency && inv.currency.toLowerCase().includes(term))
    );
  }

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
    const vendorId = localStorage.getItem('VendorId');
    if (!vendorId) {
      this.errorMessage = 'Vendor ID not found. Please login again.';
      return;
    }
    this.fetchInvoices(vendorId);
  }

  fetchInvoices(vendorId: string) {
    this.loading = true;
    const url = `http://localhost:3000/api/invoices/${vendorId}`;
    this.http.get<any>(url).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.status === 'success') {
          this.invoiceData = response.invoices;
        } else {
          this.errorMessage = 'No invoice data available.';
        }
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'Failed to load invoice data.';
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/vendor/finance']);
  }

  formatDate(dateString: string): string {
    const match = /\/Date\((\d+)\)\//.exec(dateString);
    if (match) {
      const timestamp = parseInt(match[1], 10);
      const date = new Date(timestamp);
      return date.toLocaleDateString();
    }
    return dateString;
  }

  downloadPdf(belnr: string) {
    const url = `http://localhost:3000/api/invoice-pdf/${belnr}`;
    this.http.get<any>(url).subscribe({
      next: (response) => {
        if (response.status === 'success' && response.pdfBase64) {
          const byteArray = this.base64ToArrayBuffer(response.pdfBase64);
          const blob = new Blob([byteArray], { type: 'application/pdf' });

          const link = document.createElement('a');
          link.href = URL.createObjectURL(blob);
          link.download = `Invoice_${belnr}.pdf`;
          link.click();
        } else {
          alert('PDF not found');
        }
      },
      error: (err) => {
        console.error('PDF Download Error:', err);
        alert('Failed to download PDF');
      }
    });
  }

  exportData(): void {
    // Export filtered data as CSV
    const data = this.filteredInvoiceData;
    if (!data.length) return;
    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];
    for (const row of data) {
      csvRows.push(headers.map(h => '"' + String(row[h]).replace(/"/g, '""') + '"').join(','));
    }
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'invoice-data.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  }

  refreshData(): void {
    // Re-fetch invoice data from backend
    const vendorId = localStorage.getItem('VendorId');
    if (!vendorId) {
      this.errorMessage = 'Vendor ID not found. Please login again.';
      return;
    }
    this.fetchInvoices(vendorId);
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = window.atob(base64);
    const length = binaryString.length;
    const bytes = new Uint8Array(length);
    for (let i = 0; i < length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }
}
