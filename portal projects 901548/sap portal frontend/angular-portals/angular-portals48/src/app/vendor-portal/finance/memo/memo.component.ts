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
  // Properties
  sortField: string = '';
  sortAscending: boolean = true;
  memoData: any[] = [];
  searchTerm: string = '';
  vendorId: string | null = null;
  isLoading: boolean = false;
  errorMessage: string | null = null;
  currentPage: number = 1;
  itemsPerPage: number = 10;
  Math = Math;

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
    this.vendorId = localStorage.getItem('VendorId');
    if (!this.vendorId) {
      this.errorMessage = 'Vendor ID not found. Please login again.';
      return;
    }
    this.fetchMemos(this.vendorId);
  }

  fetchMemos(vendorId: string) {
    this.isLoading = true;
    this.errorMessage = null;
    
    this.http.get<any>(`http://localhost:3000/api/memo/${vendorId}`).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.memo && Array.isArray(res.memo)) {
          this.memoData = res.memo;
        } else {
          this.memoData = [];
          this.errorMessage = 'No memo data available.';
        }
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Error fetching memo data:', err);
        this.errorMessage = 'Failed to load memo data.';
        this.memoData = [];
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

  // Helper methods for memo styling
  formatDate(date: any): string {
    if (!date) return 'N/A';
    if (typeof date === 'string' && date.includes('/Date(')) {
      return this.formatSAPDate(date);
    }
    try {
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'N/A';
    }
  }

  getMemoTypeClass(memoType: string): string {
    if (!memoType) return 'memo-type-unknown';
    const type = memoType.toUpperCase();
    if (type === 'RE') return 'memo-type-credit';  // RE means Credit Memo
    return 'memo-type-debit';  // Anything else is Debit Memo
  }

  getAmountClass(amount: number): string {
    if (!amount) return 'amount-normal';
    if (amount > 10000) return 'amount-high';
    if (amount > 5000) return 'amount-medium';
    return 'amount-normal';
  }

  getStatusClass(status: string): string {
    if (!status) return 'status-pending';
    const statusLower = status.toLowerCase();
    if (statusLower.includes('approved')) return 'status-approved';
    if (statusLower.includes('rejected')) return 'status-rejected';
    if (statusLower.includes('pending')) return 'status-pending';
    if (statusLower.includes('completed')) return 'status-completed';
    return 'status-pending';
  }

  onSearchChange(): void {
    this.currentPage = 1;
  }

  sortData(field: string): void {
    if (this.sortField === field) {
      this.sortAscending = !this.sortAscending;
    } else {
      this.sortField = field;
      this.sortAscending = true;
    }
  }

  changePage(direction: number) {
    const totalPages = Math.ceil(this.filteredMemos.length / this.itemsPerPage);
    this.currentPage = Math.max(1, Math.min(this.currentPage + direction, totalPages));
  }

  trackByMemo(index: number, memo: any): any {
    return memo.memoDoc || index;
  }

  // Getters
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

  get filteredMemos(): any[] {
    return this.filteredMemoData || [];
  }

  get paginatedMemos(): any[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredMemos.slice(startIndex, endIndex);
  }

  // Methods
  refreshData(): void {
    if (!this.vendorId) {
      this.errorMessage = 'Vendor ID not found. Please login again.';
      return;
    }
    this.fetchMemos(this.vendorId);
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
}