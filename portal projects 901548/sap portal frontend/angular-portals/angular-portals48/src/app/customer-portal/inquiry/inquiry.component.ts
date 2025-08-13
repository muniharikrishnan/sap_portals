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
}