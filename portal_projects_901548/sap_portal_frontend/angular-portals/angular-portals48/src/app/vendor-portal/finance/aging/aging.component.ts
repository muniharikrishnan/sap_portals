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
  errorMessage: string = '';
  Math = Math;

  onSearchChange(): void {
    this.currentPage = 1;
    // Optionally, add more logic if needed
  }

  trackByAging(index: number, item: any): any {
    return item.id || index;
  }

  changePage(offset: number): void {
    const totalPages = Math.ceil(this.filteredAging.length / this.itemsPerPage);
    this.currentPage = Math.max(1, Math.min(this.currentPage + offset, totalPages));
  }
  isLoading: boolean = false;

  get filteredAging(): any[] {
    return this.filteredAndSortedData;
  }

  get paginatedAging(): any[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredAging.slice(startIndex, endIndex);
  }

  currentPage: number = 1;
  itemsPerPage: number = 10;
  sortField: string = '';
  sortAscending: boolean = true;
  sortData(field: string): void {
    if (this.sortField === field) {
      this.sortAscending = !this.sortAscending;
    } else {
      this.sortField = field;
      this.sortAscending = true;
    }
    // Optionally, update filteredAndSortedData if needed
  }
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
        this.isLoading = true;
        this.http.get<any>(`http://localhost:3000/api/aging/${paddedId}`).subscribe({
          next: (res) => {
            this.agingData = res.aging || [];
            this.isLoading = false;
          },
          error: (err) => {
            console.error('Error fetching aging data:', err);
            this.errorMessage = 'Failed to fetch aging data.';
            this.isLoading = false;
            // For testing, add sample data if API fails
            this.addSampleData();
          }
        });
      } else {
        // For testing, add sample data if no vendor ID
        this.addSampleData();
      }
    }
  }

  // Add sample data for testing
  private addSampleData(): void {
    this.agingData = [
      {
        "paymentDoc": "5100000001",
        "docYear": "2025",
        "paymentDate": "/Date(1748908800000)/",
        "enrtyDate": "/Date(1748908800000)/",
        "vendorId": "100000",
        "amountPaid": "13.130",
        "currency": "INR",
        "clearingDoc": "",
        "refDocNo": "",
        "dueDate": "/Date(1751241600000)/",
        "aging": -27
      },
      {
        "paymentDoc": "5100000002",
        "docYear": "2025",
        "paymentDate": "/Date(1748908800000)/",
        "enrtyDate": "/Date(1748908800000)/",
        "vendorId": "100000",
        "amountPaid": "25.500",
        "currency": "INR",
        "clearingDoc": "CL001",
        "refDocNo": "REF001",
        "dueDate": "/Date(1748908800000)/",
        "aging": 0
      },
      {
        "paymentDoc": "5100000003",
        "docYear": "2025",
        "paymentDate": "/Date(1748908800000)/",
        "enrtyDate": "/Date(1748908800000)/",
        "vendorId": "100000",
        "amountPaid": "45.750",
        "currency": "INR",
        "clearingDoc": "",
        "refDocNo": "",
        "dueDate": "/Date(1746316800000)/",
        "aging": 15
      }
    ];
    this.isLoading = false;
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
    if (this.sortField) {
      filtered = [...filtered].sort((a, b) => {
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
      this.isLoading = true;
      const paddedId = this.vendorId.toString().padStart(10, '0');
      this.http.get<any>(`http://localhost:3000/api/aging/${paddedId}`).subscribe({
        next: (res) => {
          this.agingData = res.aging || [];
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error fetching aging data:', err);
          this.errorMessage = 'Failed to fetch aging data.';
          this.isLoading = false;
        }
      });
    }
  }

  // Aging logic methods
  getAgingText(aging: number): string {
    if (aging < 0) {
      return `Early ${Math.abs(aging)}d`;
    } else if (aging === 0) {
      return 'On Time';
    } else if (aging <= 30) {
      return `Overdue ${aging}d`;
    } else if (aging <= 60) {
      return `Overdue ${aging}d`;
    } else if (aging <= 90) {
      return `Overdue ${aging}d`;
    } else {
      return `Overdue ${aging}d`;
    }
  }

  getAgingClass(aging: number): string {
    if (aging < 0) {
      return 'early';
    } else if (aging === 0) {
      return 'on-time';
    } else if (aging <= 30) {
      return 'overdue-30';
    } else if (aging <= 60) {
      return 'overdue-60';
    } else if (aging <= 90) {
      return 'overdue-90';
    } else {
      return 'overdue';
    }
  }
}
