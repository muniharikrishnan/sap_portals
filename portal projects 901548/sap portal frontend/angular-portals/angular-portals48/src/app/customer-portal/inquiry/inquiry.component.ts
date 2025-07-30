import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-inquiry',
  imports: [CommonModule,FormsModule, HttpClientModule],
  templateUrl: './inquiry.component.html',
  styleUrls: ['./inquiry.component.css']
})
export class InquiryComponent implements OnInit {
  inquiries: any[] = [];
  customerId: string = '';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    // Get customerId from localStorage
    this.customerId = localStorage.getItem('customerId') || '';

    if (this.customerId) {
      this.fetchInquiries(this.customerId);
    }
  }

  fetchInquiries(kunnr: string): void {
    this.http.get<any>(`http://localhost:3001/api/inquiry/${kunnr}`).subscribe({
      next: (res) => {
        if (res.success) {
          this.inquiries = res.data;
        } else {
          console.error('No inquiries found');
        }
      },
      error: (err) => {
        console.error('Error fetching inquiries:', err);
      }
    });
  }
}
