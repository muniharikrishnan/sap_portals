import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-rfq',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule],
  templateUrl: './rfq.component.html',
  styleUrls: ['./rfq.component.css']
})
export class RfqComponent implements OnInit {
  rfqs: any[] = [];
  filteredRfqs: any[] = [];

  errorMessage = '';
  isLoading = false;

  // Pagination
  currentPage = 1;
  itemsPerPage = 5;

  // Search and Sort
  searchTerm = '';
  sortAscending = true;
  sortField = 'poNumber';

  poNumberSearch: string = '';

  Math = Math;

  constructor(
    private http: HttpClient, 
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      try {
        const vendorId = localStorage.getItem('VendorId') || '';
        this.fetchRFQs(vendorId);
      } catch (error) {
        this.errorMessage = 'Error accessing browser storage!';
        this.isLoading = false;
      }
    } else {
      this.errorMessage = 'Browser environment required!';
      this.isLoading = false;
    }
  }

  fetchRFQs(vendorId: string): void {
    this.isLoading = true;
    this.http.get<any>(`http://localhost:3000/api/rfq/${vendorId}`).subscribe({
      next: (res) => {
        this.rfqs = res.rfq || [];
        this.filteredRfqs = [...this.rfqs];
        this.applySearchSortPaginate();
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Failed to fetch RFQ data.';
        this.isLoading = false;
      }
    });
  }

  applySearchSortPaginate(): void {
    let result = [...this.rfqs];

    // Search
    if (this.searchTerm.trim()) {
      const lowerSearch = this.searchTerm.trim().toLowerCase();
      result = result.filter(rfq =>
        Object.values(rfq).some(val =>
          String(val).toLowerCase().includes(lowerSearch)
        )
      );
    }

    // Sort
    result.sort((a, b) => {
      const aVal = a[this.sortField];
      const bVal = b[this.sortField];
      return this.sortAscending ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    });

    this.filteredRfqs = result;
  }

  changePage(offset: number): void {
    const totalPages = Math.ceil(this.filteredRfqs.length / this.itemsPerPage);
    const nextPage = this.currentPage + offset;

    if (nextPage > 0 && nextPage <= totalPages) {
      this.currentPage = nextPage;
    }
  }

  onSearchChange(): void {
    this.currentPage = 1;
    this.applySearchSortPaginate();
  }

  toggleSort(field: string): void {
    if (this.sortField === field) {
      this.sortAscending = !this.sortAscending;
    } else {
      this.sortField = field;
      this.sortAscending = true;
    }
    this.applySearchSortPaginate();
  }

  get paginatedRfqs(): any[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredRfqs.slice(start, start + this.itemsPerPage);
  }

  getDisplayedRfqs() {
    let rfqs = this.filteredRfqs;
    if (this.poNumberSearch && this.poNumberSearch.trim() !== '') {
      rfqs = rfqs.filter(rfq =>
        rfq.poNumber && rfq.poNumber.toString().includes(this.poNumberSearch.trim())
      );
    }
    return rfqs.slice((this.currentPage - 1) * this.itemsPerPage, this.currentPage * this.itemsPerPage);
  }

  exportData(): void {
    if (this.filteredRfqs.length === 0) {
      alert('No data to export!');
      return;
    }

    const headers = Object.keys(this.filteredRfqs[0]);
    const csvContent = [
      headers.join(','),
      ...this.filteredRfqs.map(rfq =>
        headers.map(header => rfq[header]).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `rfq_data_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  refreshData(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.currentPage = 1;
    
    if (isPlatformBrowser(this.platformId)) {
      try {
        const vendorId = localStorage.getItem('VendorId') || '';
        this.fetchRFQs(vendorId);
      } catch (error) {
        this.errorMessage = 'Error accessing browser storage!';
        this.isLoading = false;
      }
    } else {
      this.errorMessage = 'Browser environment required!';
      this.isLoading = false;
    }
  }

  trackByRfq(index: number, rfq: any): any {
    return rfq.id || index;
  }
}
