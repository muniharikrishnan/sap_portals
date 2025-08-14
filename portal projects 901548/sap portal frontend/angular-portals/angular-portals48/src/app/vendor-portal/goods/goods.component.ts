import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

interface GoodsItem {
  materialDoc: string;
  docYear: string;
  postDate: string;
  entryDate: string;
  poNumber: string;
  poItem: string;
  material: string;
  quantity: string;
  unit: string;
  vendorId: string;
}

@Component({
  selector: 'app-goods',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
  ],
  templateUrl: './goods.component.html',
  styleUrls: ['./goods.component.css'],
})
export class GoodsComponent implements OnInit {
  goodsData: GoodsItem[] = [];
  filteredGoods: GoodsItem[] = [];
  isLoading = false;
  errorMessage = '';
  searchKey: string = '';

  // Pagination
  currentPage = 1;
  itemsPerPage = 5;
  Math = Math;

  // Search and Sort
  sortField = 'materialDoc';
  sortAscending = true;

  constructor(
    private http: HttpClient,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      try {
        const rawId = localStorage.getItem('VendorId') || '';
        const vendorId = rawId.padStart(10, '0');
        this.fetchGoods(vendorId);
      } catch (error) {
        this.errorMessage = 'Error accessing browser storage!';
        this.isLoading = false;
      }
    } else {
      this.errorMessage = 'Browser environment required!';
      this.isLoading = false;
    }
  }

  fetchGoods(vendorId: string): void {
    this.isLoading = true;
    this.http.get<any>(`http://localhost:3000/api/goods/${vendorId}`).subscribe({
      next: (res) => {
        if (res.status === 'success') {
          this.goodsData = res.goods.map((item: GoodsItem) => ({
            ...item,
            postDate: this.formatDate(item.postDate),
            entryDate: this.formatDate(item.entryDate),
          }));
          this.applyFilter();
        } else {
          this.errorMessage = 'No goods found.';
        }
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Error fetching goods data.';
        this.isLoading = false;
      }
    });
  }

  formatDate(dateStr: string): string {
    const timestamp = Number(dateStr.match(/\d+/)?.[0] || '0');
    return new Date(timestamp).toLocaleDateString();
  }

  applyFilter(): void {
    const term = this.searchKey.toLowerCase();
    this.filteredGoods = this.goodsData.filter(item =>
      item.materialDoc.toLowerCase().includes(term) ||
      item.poNumber.toLowerCase().includes(term) ||
      item.material.toLowerCase().includes(term) ||
      item.docYear.toLowerCase().includes(term)
    );
    this.currentPage = 1;
    this.applySort();
  }

  applySort(): void {
    this.filteredGoods.sort((a, b) => {
      const aVal = a[this.sortField as keyof GoodsItem];
      const bVal = b[this.sortField as keyof GoodsItem];
      return this.sortAscending ?
        String(aVal).localeCompare(String(bVal)) :
        String(bVal).localeCompare(String(aVal));
    });
  }

  toggleSort(field: string): void {
    if (this.sortField === field) {
      this.sortAscending = !this.sortAscending;
    } else {
      this.sortField = field;
      this.sortAscending = true;
    }
    this.applySort();
  }

  changePage(offset: number): void {
    const totalPages = Math.ceil(this.filteredGoods.length / this.itemsPerPage);
    this.currentPage = Math.min(Math.max(this.currentPage + offset, 1), totalPages);
  }

  get paginatedData(): GoodsItem[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredGoods.slice(start, start + this.itemsPerPage);
  }

  // Export data as CSV
  exportData(): void {
    if (this.filteredGoods.length === 0) {
      alert('No data to export!');
      return;
    }

    const headers = ['Material Doc', 'Year', 'Post Date', 'Entry Date', 'PO Number', 'PO Item', 'Material', 'Quantity', 'Unit'];
    const csvContent = [
      headers.join(','),
      ...this.filteredGoods.map(item => [
        item.materialDoc,
        item.docYear,
        item.postDate,
        item.entryDate,
        item.poNumber,
        item.poItem,
        item.material,
        item.quantity,
        item.unit
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `goods_receipt_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Refresh data
  refreshData(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.currentPage = 1;

    if (isPlatformBrowser(this.platformId)) {
      try {
        const rawId = localStorage.getItem('VendorId') || '';
        const vendorId = rawId.padStart(10, '0');
        this.fetchGoods(vendorId);
      } catch (error) {
        this.errorMessage = 'Error accessing browser storage!';
        this.isLoading = false;
      }
    } else {
      this.errorMessage = 'Browser environment required!';
      this.isLoading = false;
    }
  }

  // TrackBy function for ngFor optimization
  trackByGoods(index: number, item: GoodsItem): string {
    return item.materialDoc || index.toString();
  }

  goBack(): void {
    this.router.navigate(['/vendor/dashboard']);
  }

  // Template compatibility properties
  get paginatedGoods(): any[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredGoods.slice(startIndex, endIndex);
  }

  searchTerm = '';
  isLoading = false;

  // Template compatibility methods
  onSearchChange() {
    this.filterData();
  }

  sortData(field: string) {
    this.sortField = field;
    this.sortAscending = !this.sortAscending;
    this.sortGoods();
  }

  // Alias method for template compatibility
  trackByGood = this.trackByGoods;

  // Placeholder for filterData and sortGoods methods if they are used in the template
  filterData() {
    // This method should be implemented to update filteredGoods based on searchTerm
    // For now, it calls applyFilter which uses this.searchKey
    this.applyFilter();
  }

  sortGoods() {
    // This method should be implemented to sort filteredGoods based on sortField and sortAscending
    // For now, it calls applySort
    this.applySort();
  }
}