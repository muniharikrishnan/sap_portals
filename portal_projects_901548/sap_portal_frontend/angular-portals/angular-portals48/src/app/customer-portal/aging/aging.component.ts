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
    
    // Determine which data to export
    const dataToExport = this.searchTerm.trim() ? this.filteredAgingData : this.agingData;
    const fileName = this.searchTerm.trim() 
      ? `Aging_Data_Filtered_${new Date().toISOString().split('T')[0]}.xlsx`
      : `Aging_Data_All_${new Date().toISOString().split('T')[0]}.xlsx`;
    
    // Create Excel data
    const excelData = this.prepareExcelData(dataToExport);
    
    // Download the Excel file
    this.downloadExcelFile(excelData, fileName);
    
    // Reset export state
    setTimeout(() => {
      this.isExporting = false;
    }, 1000);
  }

  private prepareExcelData(data: any[]): any[] {
    // Define headers
    const headers = [
      'Invoice No',
      'Invoice Date',
      'Due Date',
      'Amount',
      'Currency',
      'Aging',
      'Status'
    ];

    // Create data rows
    const rows = data.map(item => [
      item.vbeln || '',
      item.fkdat || '',
      item.due_dt || '',
      item.netwr || '',
      item.waerk || '',
      item.aging || '',
      item.meaning || ''
    ]);

    // Return data with headers
    return [headers, ...rows];
  }

  private downloadExcelFile(data: any[], fileName: string): void {
    // Convert data to CSV format (Excel can open CSV files)
    const csvContent = data.map(row => 
      row.map((cell: any) => `"${cell}"`).join(',')
    ).join('\n');
    
    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    console.log(`Exported ${data.length - 1} aging records to ${fileName}`);
  }
}
