import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Component, OnInit, importProvidersFrom } from '@angular/core';

@Component({
  selector: 'app-overallsales',
  imports: [CommonModule,FormsModule,HttpClientModule],
  templateUrl: './overallsales.component.html',
  styleUrl: './overallsales.component.css'
})
export class OverallsalesComponent implements OnInit {
  overallData: any[] = [];
  filteredOverallData: any[] = [];
  customerId: string = '';
  isLoading: boolean = false;
  isExporting: boolean = false;
  searchTerm: string = '';
  errorMessage: string = '';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.customerId = localStorage.getItem('customerId') || '';
    if (this.customerId) {
      this.getOverallSales();
    } else {
      console.error('Customer ID not found in localStorage');
      this.errorMessage = 'Customer ID not found. Please login again.';
    }
  }

  getOverallSales(): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    this.http.get<any>(`http://localhost:3001/api/overallSales/${this.customerId}`)
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          if (response.success) {
            this.overallData = response.data;
            this.filteredOverallData = response.data;
          } else {
            console.error('Failed to fetch data:', response.message);
            this.errorMessage = 'Failed to load overall sales data. Please try again.';
          }
        },
        error: (err) => {
          this.isLoading = false;
          console.error('Error fetching overall sales:', err);
          this.errorMessage = 'Error loading overall sales data. Please check your connection.';
        }
      });
  }

  onSearch(): void {
    if (!this.searchTerm.trim()) {
      this.filteredOverallData = this.overallData;
      return;
    }

    const searchLower = this.searchTerm.toLowerCase();
    this.filteredOverallData = this.overallData.filter(item => 
      item.document_no?.toLowerCase().includes(searchLower) ||
      item.doc_date?.toLowerCase().includes(searchLower) ||
      item.waerk?.toLowerCase().includes(searchLower) ||
      item.vkorg?.toLowerCase().includes(searchLower) ||
      item.auart?.toLowerCase().includes(searchLower) ||
      item.record_type?.toLowerCase().includes(searchLower) ||
      item.total_orders?.toString().includes(searchLower) ||
      item.total_order_value?.toString().includes(searchLower) ||
      item.total_billed?.toString().includes(searchLower)
    );
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.filteredOverallData = this.overallData;
  }

  refreshOverallSales(): void {
    if (this.customerId) {
      this.getOverallSales();
    }
  }

  exportOverallSalesData(): void {
    this.isExporting = true;
    
    // Simulate export process
    setTimeout(() => {
      this.isExporting = false;
      // Here you would implement actual export logic
      console.log('Exporting overall sales data...');
    }, 2000);
  }
}