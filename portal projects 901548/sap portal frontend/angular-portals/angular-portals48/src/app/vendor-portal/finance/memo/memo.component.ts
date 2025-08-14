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
  onSearchChange(): void {
    this.currentPage = 1;
    // Optionally, you can trigger any additional logic here if needed
  }
  sortField: string = '';
  sortAscending: boolean = true;
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
    let data = this.memoData.filter(item =>
      Object.values(item).some(val =>
        String(val).toLowerCase().includes(this.searchTerm.toLowerCase())
      )
    );
    if (this.sortField) {
      data = [...data].sort((a, b) => {
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
    return data;
  }
  sortData(field: string): void {
    if (this.sortField === field) {
      this.sortAscending = !this.sortAscending;
    } else {
      this.sortField = field;
      this.sortAscending = true;
    }
  }

  // Template compatibility properties that map to existing data
  get filteredMemos(): any[] {
    return this.filteredMemoData || [];
  }

  get paginatedMemos(): any[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredMemos.slice(startIndex, endIndex);
  }

  currentPage = 1;
  itemsPerPage = 10;
  isLoading = false;
  errorMessage = '';
  Math = Math;

  // Template compatibility methods
  changePage(direction: number) {
    const totalPages = Math.ceil(this.filteredMemos.length / this.itemsPerPage);
    this.currentPage = Math.max(1, Math.min(this.currentPage + direction, totalPages));
  }

  trackByMemo(index: number, memo: any): any {
    return memo.id || index;
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