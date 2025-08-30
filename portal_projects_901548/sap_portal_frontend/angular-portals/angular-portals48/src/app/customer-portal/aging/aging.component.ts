import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-aging',
  imports:[CommonModule,FormsModule,HttpClientModule],
  templateUrl: './aging.component.html',
  styleUrls: ['./aging.component.css']
})
export class AgingComponent implements OnInit {
  agingData: any[] = [];
  filteredAgingData: any[] = [];
  customerId: string | null = null;
  isLoading = true;
  isExporting: boolean = false;
  searchTerm: string = '';
  errorMessage = '';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.customerId = localStorage.getItem('customerId');
    if (this.customerId) {
      this.fetchAgingData(this.customerId);
    } else {
      this.errorMessage = 'Customer ID not found in local storage';
      this.isLoading = false;
    }
  }

  fetchAgingData(kunnr: string): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    this.http.get<any>(`http://localhost:3001/api/aging/${kunnr}`).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.success) {
          this.agingData = res.data;
          this.filteredAgingData = res.data;
        } else {
          this.errorMessage = 'No aging data found.';
        }
      },
      error: (err) => {
        console.error('Error fetching aging data:', err);
        this.errorMessage = 'Failed to load data';
        this.isLoading = false;
      }
    });
  }

  onSearch(): void {
    if (!this.searchTerm.trim()) {
      this.filteredAgingData = this.agingData;
      return;
    }

    const searchLower = this.searchTerm.toLowerCase();
    this.filteredAgingData = this.agingData.filter(item => 
      item.vbeln?.toLowerCase().includes(searchLower) ||
      item.fkdat?.toLowerCase().includes(searchLower) ||
      item.due_dt?.toLowerCase().includes(searchLower) ||
      item.netwr?.toString().includes(searchLower) ||
      item.waerk?.toLowerCase().includes(searchLower) ||
      item.aging?.toLowerCase().includes(searchLower) ||
      item.meaning?.toLowerCase().includes(searchLower)
    );
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.filteredAgingData = this.agingData;
  }

  refreshAging(): void {
    if (this.customerId) {
      this.fetchAgingData(this.customerId);
    }
  }

  exportAgingData(): void {
    this.isExporting = true;
    
    // Simulate export process
    setTimeout(() => {
      this.isExporting = false;
      // Here you would implement actual export logic
      console.log('Exporting aging data...');
    }, 2000);
  }
}
