import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-aging',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule],
  templateUrl: './aging.component.html',
  styleUrls: ['./aging.component.css']
})
export class AgingComponent implements OnInit {
  agingData: any[] = [];
  vendorId: string | null = '';
  searchTerm = '';
  sortKey = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  constructor(
    private http: HttpClient,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.vendorId = localStorage.getItem('VendorId');
      if (this.vendorId) {
        const paddedId = this.vendorId.toString().padStart(10, '0');
        this.http.get<any>(`http://localhost:3000/api/aging/${paddedId}`).subscribe({
          next: (res) => {
            this.agingData = res.aging;
          },
          error: (err) => {
            console.error('Error fetching aging data:', err);
          }
        });
      }
    }
  }

  formatDate(odataDate: string): string {
    const timestamp = parseInt(odataDate.match(/\d+/)?.[0] || '');
    return new Date(timestamp).toLocaleDateString();
  }

  goBack(): void {
    this.router.navigate(['/vendor/finance']);
  }

  onSort(column: string): void {
    if (this.sortKey === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortKey = column;
      this.sortDirection = 'asc';
    }
  }

  get filteredAndSortedData(): any[] {
    let filtered = this.agingData.filter(item =>
      Object.values(item).some(val =>
        String(val).toLowerCase().includes(this.searchTerm.toLowerCase())
      )
    );

    if (this.sortKey) {
      filtered = filtered.sort((a, b) => {
        const valA = a[this.sortKey];
        const valB = b[this.sortKey];

        if (valA < valB) return this.sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return this.sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }

  exportData(): void {
    // Export filtered data as CSV
    const data = this.filteredAndSortedData;
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
    a.download = 'aging-data.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  }

  refreshData(): void {
    // Re-fetch aging data from backend
    if (isPlatformBrowser(this.platformId) && this.vendorId) {
      const paddedId = this.vendorId.toString().padStart(10, '0');
      this.http.get<any>(`http://localhost:3000/api/aging/${paddedId}`).subscribe({
        next: (res) => {
          this.agingData = res.aging;
        },
        error: (err) => {
          console.error('Error fetching aging data:', err);
        }
      });
    }
  }
}
