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
  isLoading = false;
  errorMessage = '';

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
}
