import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';


@Component({
  selector: 'app-purchase-order',
  standalone: true,
  imports: [CommonModule, HttpClientModule, RouterModule,FormsModule],
  templateUrl: './purchase-order.component.html',
  styleUrls: ['./purchase-order.component.css']
})
export class PurchaseOrderComponent implements OnInit {
  purchaseData: any[] = [];
  filteredPurchase: any[] = [];
  loading = true;
  error = '';

  // Pagination
  currentPage = 1;
  itemsPerPage = 5;
  Math = Math;

  // Search & Sort
  searchTerm = '';
  sortAscending = true;
  sortField: string = ''; // Added for sortData method

  // Add this property to the class
  poNumberSearch: string = '';

  constructor(
    private http: HttpClient,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    // Only run in browser environment
    if (isPlatformBrowser(this.platformId)) {
      try {
        const VendorId = localStorage.getItem('VendorId');
        if (!VendorId) {
          this.error = 'Vendor ID not found!';
          this.loading = false;
          return;
        }
        this.loadPurchaseData(VendorId);
      } catch (error) {
        this.error = 'Error accessing browser storage!';
        this.loading = false;
      }
    } else {
      this.error = 'Browser environment required!';
      this.loading = false;
    }
  }

  loadPurchaseData(VendorId: string) {
    this.http.get<any>(`http://localhost:3000/api/purchase/${VendorId}`).subscribe({
      next: (res) => {
        if (res.status === 'success') {
          this.purchaseData = res.purchase;
          this.applyFilters(); // Apply filters initially
        } else {
          this.error = 'Failed to load data.';
        }
        this.loading = false;
      },
      error: () => {
        this.error = 'Error fetching data.';
        this.loading = false;
      }
    });
  }

  goBack() {
    console.log('Back button clicked');
    this.router.navigate(['/vendor/dashboard']);
  }

  convertDate(dateString: string): string {
    // Ensure dateString is valid before parsing
    if (!dateString || !dateString.startsWith('/Date(') || !dateString.endsWith(')/')) {
      return 'Invalid Date';
    }
    const timestamp = parseInt(dateString.replace('/Date(', '').replace(')/', ''), 10);
    if (isNaN(timestamp)) {
      return 'Invalid Date';
    }
    return new Date(timestamp).toLocaleDateString();
  }

  applyFilters() {
    const term = this.searchTerm.toLowerCase();
    this.filteredPurchase = this.purchaseData
      .filter(po => po.poNumber.toLowerCase().includes(term))
      .sort((a, b) => {
        const valA = a.poNumber;
        const valB = b.poNumber;
        return this.sortAscending ? valA.localeCompare(valB) : valB.localeCompare(valA);
      });
    this.currentPage = 1; // Reset to first page on filter change
  }

  onSearchChange() {
    this.applyFilters();
  }

  toggleSort() {
    this.sortAscending = !this.sortAscending;
    this.applyFilters();
  }

  // This method is for the template-provided sort functionality
  sortPurchaseOrders() {
    if (this.sortField) {
      this.filteredPurchase.sort((a, b) => {
        const valA = a[this.sortField];
        const valB = b[this.sortField];

        if (valA === undefined || valB === undefined) return 0;

        if (typeof valA === 'string' && typeof valB === 'string') {
          return this.sortAscending ? valA.localeCompare(valB) : valB.localeCompare(valA);
        } else if (typeof valA === 'number' && typeof valB === 'number') {
          return this.sortAscending ? valA - valB : valB - valA;
        } else {
          // Fallback for other types or mixed types
          return this.sortAscending ? String(valA).localeCompare(String(valB)) : String(valB).localeCompare(String(valA));
        }
      });
    }
  }

  // This method is for the template-provided pagination
  changePage(direction: number) {
    const totalPages = Math.ceil(this.filteredPurchase.length / this.itemsPerPage);
    this.currentPage = Math.max(1, Math.min(this.currentPage + direction, totalPages));
  }

  get paginatedData() {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredPurchase.slice(start, start + this.itemsPerPage);
  }

  // Add this getter to the class
  get displayedPurchaseData() {
    let data = this.filteredPurchase;
    if (this.poNumberSearch && this.poNumberSearch.trim() !== '') {
      data = data.filter(po =>
        po.poNumber && po.poNumber.toString().includes(this.poNumberSearch.trim())
      );
    }
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return data.slice(start, start + this.itemsPerPage);
  }

  // Export data as CSV
  exportData() {
    if (this.filteredPurchase.length === 0) {
      alert('No data to export!');
      return;
    }

    const headers = ['PO Number', 'Document Date', 'Delivery Date', 'Material', 'Item Number', 'Unit'];
    const csvContent = [
      headers.join(','),
      ...this.filteredPurchase.map(po => [
        po.poNumber,
        this.convertDate(po.docDate),
        this.convertDate(po.deliveryDate),
        po.material,
        po.itemNumber,
        po.unit
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `purchase_orders_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Refresh data
  refreshData() {
    this.loading = true;
    this.error = '';
    this.currentPage = 1;

    if (isPlatformBrowser(this.platformId)) {
      try {
        const VendorId = localStorage.getItem('VendorId');
        if (VendorId) {
          this.loadPurchaseData(VendorId);
        } else {
          this.error = 'Vendor ID not found!';
          this.loading = false;
        }
      } catch (error) {
        this.error = 'Error accessing browser storage!';
        this.loading = false;
      }
    } else {
      this.error = 'Browser environment required!';
      this.loading = false;
    }
  }

  // TrackBy function for ngFor optimization
  trackByPo(index: number, po: any): string {
    return po.poNumber || index;
  }

  // Template compatibility properties that map to existing data
  get filteredPurchaseOrders(): any[] {
    return this.filteredPurchase || [];
  }

  // This getter is for template compatibility and uses the existing filteredPurchase data
  get paginatedPurchaseOrders(): any[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredPurchaseOrders.slice(startIndex, endIndex);
  }

  get isLoading(): boolean {
    return this.loading;
  }

  // Template compatibility methods
  // This method is for the template-provided sort functionality, it calls the existing sort logic
  sortData(field: string) {
    this.sortField = field;
    this.sortAscending = !this.sortAscending;
    this.sortPurchaseOrders();
  }

  // This method is for the template-provided pagination
  // changePage(direction: number) {
  //   const totalPages = Math.ceil(this.filteredPurchaseOrders.length / this.itemsPerPage);
  //   this.currentPage = Math.max(1, Math.min(this.currentPage + direction, totalPages));
  // }

  trackByPurchaseOrder(index: number, po: any): any {
    return po.id || index;
  }
}