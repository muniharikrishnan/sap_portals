import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-aging',
  imports:[CommonModule,FormsModule,HttpClientModule],
  templateUrl: './aging.component.html',
  styleUrls: ['./aging.component.css']
})
export class AgingComponent implements OnInit {
  agingData: any[] = [];
  customerId: string | null = null;
  isLoading = true;
  errorMessage = '';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.customerId = localStorage.getItem('customerId');
    if (this.customerId) {
      this.fetchAgingData(this.customerId);
    } else {
      this.errorMessage = 'Customer ID not found in local storage';
      this.isLoading = false;
    }
  }

  fetchAgingData(kunnr: string): void {
    this.http.get<any>(`http://localhost:3001/api/aging/${kunnr}`).subscribe({
      next: (res) => {
        if (res.success) {
          this.agingData = res.data;
        } else {
          this.errorMessage = 'No aging data found.';
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error fetching aging data:', err);
        this.errorMessage = 'Failed to load data';
        this.isLoading = false;
      }
    });
  }
}
