import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpClientModule, HttpParams } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-cdmemo',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './memo.component.html',
  styleUrls: ['./memo.component.css']
})
export class MemoComponent implements OnInit {
  customerId: string = '';
  fromDate: string = '';
  toDate: string = '';
  memoData: any[] = [];
  errorMessage: string = '';

  // ✅ Add these to fix your template errors
  kunnr: string = '';
  loading: boolean = false;
  error: string = '';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.customerId = localStorage.getItem('customerId') || '';
  }

  fetchMemoData(): void {
    if (!this.customerId) {
      this.errorMessage = 'Customer ID not found in local storage.';
      return;
    }

    this.loading = true;
    this.error = '';

    const params = new HttpParams()
      .set('from', this.fromDate)
      .set('to', this.toDate);

    this.http.get<any>(`http://localhost:3001/api/cdmemo/${this.customerId}`, { params })
      .subscribe({
        next: (response) => {
          this.loading = false;
          if (response.success) {
            this.memoData = response.data;
            this.errorMessage = '';
          } else {
            this.memoData = [];
            this.errorMessage = response.message || 'Unknown error';
          }
        },
        error: (error) => {
          this.loading = false;
          this.memoData = [];
          this.error = error.error?.message || 'Server error occurred';
        }
      });
  }
}
