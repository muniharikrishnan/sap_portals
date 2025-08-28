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
  customerId: string = '';
  searchTerm: string = '';
  isLoading: boolean = false;
  isExporting: boolean = false;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    // Get customerId from localStorage
    this.customerId = localStorage.getItem('customerId') || '';

    if (this.customerId) {
      this.fetchInquiries(this.customerId);
    }
  }

  fetchInquiries(kunnr: string): void {
    this.isLoading = true;
    this.http.get<any>(`http://localhost:3001/api/inquiry/${kunnr}`).subscribe({
      next: (res) => {
        if (res.success) {
          this.inquiries = res.data;
          this.filteredInquiries = [...this.inquiries];
        } else {
          console.error('No inquiries found');
          this.inquiries = [];
          this.filteredInquiries = [];
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error fetching inquiries:', err);
        this.isLoading = false;
      }
    });
  }

  filterInquiries(): void {
    if (!this.searchTerm.trim()) {
      this.filteredInquiries = [...this.inquiries];
      return;
    }

    const searchLower = this.searchTerm.toLowerCase();
    this.filteredInquiries = this.inquiries.filter(inquiry => 
      inquiry.vbeln?.toString().toLowerCase().includes(searchLower) ||
      inquiry.erdat?.toString().toLowerCase().includes(searchLower) ||
      inquiry.auart?.toString().toLowerCase().includes(searchLower) ||
      inquiry.matnr?.toString().toLowerCase().includes(searchLower) ||
      inquiry.arktx?.toString().toLowerCase().includes(searchLower) ||
      inquiry.waerk?.toString().toLowerCase().includes(searchLower) ||
      inquiry.posnr?.toString().toLowerCase().includes(searchLower)
    );
  }

  refreshInquiries(): void {
    if (this.customerId) {
      this.searchTerm = '';
      this.fetchInquiries(this.customerId);
    }
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.filterInquiries();
  }

  exportToCSV(): void {
    this.isExporting = true;
    
    // Simulate export delay
    setTimeout(() => {
      const headers = ['Inquiry No', 'Date', 'Type', 'Net Value', 'Currency', 'Valid Date', 'Item No', 'Material', 'Description', 'Quantity', 'UOM'];
      const csvContent = [
        headers.join(','),
        ...this.filteredInquiries.map(inquiry => [
          inquiry.vbeln,
          inquiry.erdat,
          inquiry.auart,
          inquiry.netwr,
          inquiry.waerk,
          inquiry.vdate,
          inquiry.posnr,
          inquiry.matnr,
          inquiry.arktx,
          inquiry.kwmeng,
          inquiry.vrkme
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `customer_inquiries_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);
      
      this.isExporting = false;
    }, 1500);
  }

  exportToExcel(): void {
    this.isExporting = true;
    
    // Simulate export delay
    setTimeout(() => {
      const headers = ['Inquiry No', 'Date', 'Type', 'Net Value', 'Currency', 'Valid Date', 'Item No', 'Material', 'Description', 'Quantity', 'UOM'];
      let excelContent = '<table>';
      excelContent += '<tr>' + headers.map(h => `<th>${h}</th>`).join('') + '</tr>';
      
      this.filteredInquiries.forEach(inquiry => {
        excelContent += '<tr>';
        excelContent += `<td>${inquiry.vbeln}</td>`;
        excelContent += `<td>${inquiry.erdat}</td>`;
        excelContent += `<td>${inquiry.auart}</td>`;
        excelContent += `<td>${inquiry.netwr}</td>`;
        excelContent += `<td>${inquiry.waerk}</td>`;
        excelContent += `<td>${inquiry.vdate}</td>`;
        excelContent += `<td>${inquiry.posnr}</td>`;
        excelContent += `<td>${inquiry.matnr}</td>`;
        excelContent += `<td>${inquiry.arktx}</td>`;
        excelContent += `<td>${inquiry.kwmeng}</td>`;
        excelContent += `<td>${inquiry.vrkme}</td>`;
        excelContent += '</tr>';
      });
      excelContent += '</table>';

      const blob = new Blob([excelContent], { type: 'application/vnd.ms-excel' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `customer_inquiries_${new Date().toISOString().split('T')[0]}.xls`;
      link.click();
      window.URL.revokeObjectURL(url);
      
      this.isExporting = false;
    }, 1500);
  }
}