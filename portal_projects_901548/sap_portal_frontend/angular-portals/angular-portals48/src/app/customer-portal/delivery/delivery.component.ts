import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { Location } from '@angular/common';

export interface DeliveryItem {
  vbeln: string;    // Delivery No
  erdat: string;    // Date
  vstel: string;    // Shipping Point
  vkorg: string;    // Sales Org
  lfart: string;    // Type
  lfdat: string;    // Delivery Date
  posnr: string;    // Item No
  matnr: string;    // Material No
  arktx: string;    // Description
  lfimg: string;    // Quantity
}

@Component({
  selector: 'app-delivery',
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './delivery.component.html',
  styleUrls: ['./delivery.component.css']
})
export class DeliveryComponent implements OnInit {
  deliveryData: DeliveryItem[] = [];
  filteredDeliveryData: DeliveryItem[] = [];
  customerId: string = '';
  isLoading: boolean = false;
  errorMessage: string = '';
  searchTerm: string = '';

  // Mock data for development/testing
  private mockDeliveryData: DeliveryItem[] = [
    {
      vbeln: 'DEL001',
      erdat: '2024-01-15',
      vstel: 'SP001',
      vkorg: 'SO001',
      lfart: 'Standard',
      lfdat: '2024-01-20',
      posnr: '10',
      matnr: 'MAT001',
      arktx: 'Premium Quality Product A',
      lfimg: '100'
    },
    {
      vbeln: 'DEL002',
      erdat: '2024-01-16',
      vstel: 'SP002',
      vkorg: 'SO001',
      lfart: 'Express',
      lfdat: '2024-01-18',
      posnr: '20',
      matnr: 'MAT002',
      arktx: 'High-Performance Component B',
      lfimg: '250'
    },
    {
      vbeln: 'DEL003',
      erdat: '2024-01-17',
      vstel: 'SP001',
      vkorg: 'SO002',
      lfart: 'Standard',
      lfdat: '2024-01-22',
      posnr: '30',
      matnr: 'MAT003',
      arktx: 'Industrial Equipment C',
      lfimg: '75'
    }
  ];

  constructor(
    private http: HttpClient, 
    @Inject(PLATFORM_ID) private platformId: Object,
    private location: Location
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      const storedId = localStorage.getItem('customerId');
      if (storedId) {
        this.customerId = storedId;
        this.fetchDeliveryData();
      } else {
        console.error('Customer ID not found in local storage');
        // Use mock data for development
        this.loadMockData();
      }
    } else {
      // Use mock data for SSR
      this.loadMockData();
    }
  }

  fetchDeliveryData(): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    this.http.get<any>(`http://localhost:3001/api/delivery/${this.customerId}`)
      .subscribe({
        next: (res) => {
          this.isLoading = false;
          if (res.success) {
            this.deliveryData = res.data;
            this.filteredDeliveryData = [...this.deliveryData];
          } else {
            console.error('Delivery fetch failed:', res.message);
            this.errorMessage = res.message || 'Failed to fetch delivery data';
            // Fallback to mock data
            this.loadMockData();
          }
        },
        error: (err) => {
          this.isLoading = false;
          console.error('HTTP Error:', err);
          this.errorMessage = 'Unable to connect to server. Please try again later.';
          // Fallback to mock data for development
          this.loadMockData();
        }
      });
  }

  private loadMockData(): void {
    // Simulate loading delay
    setTimeout(() => {
      this.deliveryData = this.mockDeliveryData;
      this.filteredDeliveryData = [...this.deliveryData];
      this.isLoading = false;
      this.errorMessage = '';
    }, 1000);
  }

  // Navigation method

  // Track by function for ngFor performance
  trackByDeliveryId(index: number, item: DeliveryItem): string {
    return item.vbeln;
  }

  // Date formatting method
  formatDate(dateString: string): string {
    if (!dateString) return '-';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: '2-digit'
      });
    } catch (error) {
      return dateString; // Return original if parsing fails
    }
  }

  // Quantity formatting method
  formatQuantity(quantity: string): string {
    if (!quantity) return '0';
    
    const num = parseFloat(quantity);
    if (isNaN(num)) return quantity;
    
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
  }

  // Search functionality
  onSearch(): void {
    if (!this.searchTerm.trim()) {
      this.filteredDeliveryData = [...this.deliveryData];
    } else {
      this.filteredDeliveryData = this.deliveryData.filter(item =>
        item.vbeln.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }
  }

  // Clear search
  clearSearch(): void {
    this.searchTerm = '';
    this.filteredDeliveryData = [...this.deliveryData];
  }

  // Enhanced refresh data functionality
  refreshData(): void {
    // Show loading state
    this.isLoading = true;
    this.errorMessage = '';
    
    // Clear search and current data
    this.searchTerm = '';
    this.deliveryData = [];
    this.filteredDeliveryData = [];
    
    // Add a small delay to show the refresh action
    setTimeout(() => {
      this.fetchDeliveryData();
    }, 500);
    
    // Show user feedback
    console.log('Refreshing delivery data...');
  }
  // Export to CSV
  exportToCSV(): void {
    if (this.filteredDeliveryData.length === 0) {
      return;
    }

    const headers = [
      'Delivery No',
      'Date',
      'Shipping Point',
      'Sales Org',
      'Type',
      'Delivery Date',
      'Item No',
      'Material No',
      'Description',
      'Quantity'
    ];

    const csvData = this.filteredDeliveryData.map(item => [
      item.vbeln,
      this.formatDate(item.erdat),
      item.vstel,
      item.vkorg,
      item.lfart,
      this.formatDate(item.lfdat),
      item.posnr,
      item.matnr,
      item.arktx,
      this.formatQuantity(item.lfimg)
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `delivery-details-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }
}
