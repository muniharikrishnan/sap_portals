import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Component, OnInit, importProvidersFrom } from '@angular/core';

@Component({
  selector: 'app-overallsales',
  imports: [CommonModule,FormsModule,HttpClientModule],
  templateUrl: './overallsales.component.html',
  styleUrl: './overallsales.component.css'
})
export class OverallsalesComponent implements OnInit {
  overallData: any[] = [];
  customerId: string = '';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.customerId = localStorage.getItem('customerId') || '';
    if (this.customerId) {
      this.getOverallSales();
    } else {
      console.error('Customer ID not found in localStorage');
    }
  }

  getOverallSales(): void {
    this.http.get<any>(`http://localhost:3001/api/overallSales/${this.customerId}`)
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.overallData = response.data;
          } else {
            console.error('Failed to fetch data:', response.message);
          }
        },
        error: (err) => {
          console.error('Error fetching overall sales:', err);
        }
      });
  }
}