import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-memo',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule],
  templateUrl: './memo.component.html',
  styleUrls: ['./memo.component.css']
})
export class MemoComponent implements OnInit {
  memoData: any[] = [];
  searchTerm: string = '';

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
    const lifnr = localStorage.getItem('VendorId');
    this.http.get<any>(`http://localhost:3000/api/memo/${lifnr}`).subscribe({
      next: (res) => {
        this.memoData = res.memo || [];
      },
      error: (err) => {
        console.error('Error fetching memo data:', err);
      }
    });
  }

  formatSAPDate(sapDate: string): string {
    const timestamp = parseInt(sapDate.replace(/\/Date\((\d+)\)\//, '$1'), 10);
    const date = new Date(timestamp);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }

  goBack(): void {
    this.router.navigate(['/vendor/finance']);
  }

  get filteredMemoData(): any[] {
    return this.memoData.filter(item =>
      Object.values(item).some(val =>
        String(val).toLowerCase().includes(this.searchTerm.toLowerCase())
      )
    );
  }

  exportData(): void {
    // Export filtered data as CSV
    const data = this.filteredMemoData;
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
    a.download = 'memo-data.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  }

  refreshData(): void {
    // Re-fetch memo data from backend
    const lifnr = localStorage.getItem('VendorId');
    this.http.get<any>(`http://localhost:3000/api/memo/${lifnr}`).subscribe({
      next: (res) => {
        this.memoData = res.memo || [];
      },
      error: (err) => {
        console.error('Error fetching memo data:', err);
      }
    });
  }
}