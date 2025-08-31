import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Chart, ChartConfiguration, ChartType } from 'chart.js';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-finance-report',
  templateUrl: './finance-report.component.html',
  styleUrls: ['./finance-report.component.css'],
  imports: [CommonModule],
  standalone: true
})
export class FinanceReportComponent implements OnInit, AfterViewInit {
  @ViewChild('pieChartCanvas') pieChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('barChartCanvas') barChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('lineChartCanvas') lineChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('doughnutChartCanvas') doughnutChartCanvas!: ElementRef<HTMLCanvasElement>;

  // Chart instances
  pieChart: Chart | null = null;
  barChart: Chart | null = null;
  lineChart: Chart | null = null;
  doughnutChart: Chart | null = null;

  // Data properties
  invoiceData: any[] = [];
  agingData: any[] = [];
  overallSalesData: any[] = [];
  
  // Summary statistics
  totalInvoices = 0;
  totalInvoiceValue = 0;
  totalAgingAmount = 0;
  totalSalesValue = 0;
  averageInvoiceValue = 0;
  
  // Loading states
  isLoading = true;
  errorMessage = '';

  // Customer ID from localStorage
  customerId = '';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.customerId = localStorage.getItem('customerId') || '200000';
    this.loadAllFinanceData();
  }

  ngAfterViewInit(): void {
    // Charts will be initialized after data is loaded
  }

  loadAllFinanceData(): void {
    this.isLoading = true;
    this.errorMessage = '';

    // Load all finance data in parallel
    Promise.all([
      this.loadInvoiceData(),
      this.loadAgingData(),
      this.loadOverallSalesData()
    ]).then(() => {
      this.calculateSummaryStatistics();
      this.initializeCharts();
      this.isLoading = false;
    }).catch(error => {
      console.error('Error loading finance data:', error);
      this.errorMessage = 'Failed to load finance data. Please try again.';
      this.isLoading = false;
    });
  }

  private loadInvoiceData(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.http.get<any>(`http://localhost:3001/api/invoices/${this.customerId}`).subscribe({
        next: (response) => {
          console.log('Invoice API Response:', response);
          if (response.success && response.data) {
            this.invoiceData = response.data;
            console.log('Invoice Data:', this.invoiceData);
          } else if (Array.isArray(response)) {
            this.invoiceData = response;
            console.log('Invoice Data (Array):', this.invoiceData);
          } else {
            this.invoiceData = [];
            console.log('No invoice data found');
          }
          resolve();
        },
        error: (error) => {
          console.error('Error loading invoice data:', error);
          this.invoiceData = [];
          resolve(); // Resolve anyway to not block other data
        }
      });
    });
  }

  private loadAgingData(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.http.get<any>(`http://localhost:3001/api/aging/${this.customerId}`).subscribe({
        next: (response) => {
          console.log('Aging API Response:', response);
          if (response.success && response.data) {
            this.agingData = response.data;
            console.log('Aging Data:', this.agingData);
          } else if (Array.isArray(response)) {
            this.agingData = response;
            console.log('Aging Data (Array):', this.agingData);
          } else {
            this.agingData = [];
            console.log('No aging data found');
          }
          resolve();
        },
        error: (error) => {
          console.error('Error loading aging data:', error);
          this.agingData = [];
          resolve();
        }
      });
    });
  }

  private loadOverallSalesData(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.http.get<any>(`http://localhost:3001/api/overallSales/${this.customerId}`).subscribe({
        next: (response) => {
          console.log('Overall Sales API Response:', response);
          if (response.success && response.data) {
            this.overallSalesData = response.data;
            console.log('Overall Sales Data:', this.overallSalesData);
          } else if (Array.isArray(response)) {
            this.overallSalesData = response;
            console.log('Overall Sales Data (Array):', this.overallSalesData);
          } else {
            this.overallSalesData = [];
            console.log('No overall sales data found');
          }
          resolve();
        },
        error: (error) => {
          console.error('Error loading overall sales data:', error);
          this.overallSalesData = [];
          resolve();
        }
      });
    });
  }

  private calculateSummaryStatistics(): void {
    // Calculate invoice statistics
    console.log('Calculating invoice statistics from:', this.invoiceData);
    this.totalInvoices = this.invoiceData.length;
    this.totalInvoiceValue = this.invoiceData.reduce((sum, invoice) => {
      const netValue = parseFloat(invoice.netwr) || 0;
      console.log('Invoice record:', invoice, 'Net value:', netValue);
      return sum + netValue;
    }, 0);
    this.averageInvoiceValue = this.totalInvoices > 0 ? this.totalInvoiceValue / this.totalInvoices : 0;
    console.log('Invoice stats - Total:', this.totalInvoices, 'Value:', this.totalInvoiceValue, 'Average:', this.averageInvoiceValue);

    // Calculate aging statistics
    console.log('Calculating total aging amount from:', this.agingData);
    this.totalAgingAmount = this.agingData.reduce((sum, aging) => {
      // Use the correct field name from aging component: netwr
      const amount = parseFloat(aging.netwr) || 0;
      console.log('Aging record:', aging, 'Amount (netwr):', amount);
      return sum + amount;
    }, 0);
    console.log('Final total aging amount:', this.totalAgingAmount);

    // Calculate sales statistics
    console.log('Calculating total sales value from:', this.overallSalesData);
    this.totalSalesValue = this.overallSalesData.reduce((sum, sales) => {
      // Use the exact field name from overall sales component: total_order_value
      const orderValue = parseFloat(sales.total_order_value) || 0;
      console.log('Sales record:', sales, 'Order value:', orderValue);
      return sum + orderValue;
    }, 0);
    console.log('Final total sales value:', this.totalSalesValue);
  }

  private initializeCharts(): void {
    setTimeout(() => {
      this.createPieChart();
      this.createBarChart();
      this.createLineChart();
      this.createDoughnutChart();
    }, 100);
  }

  private createPieChart(): void {
    if (!this.pieChartCanvas) return;

    const ctx = this.pieChartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const config: ChartConfiguration<'pie'> = {
      type: 'pie',
      data: {
        labels: ['Total Invoices', 'Total Aging', 'Total Sales'],
        datasets: [{
          data: [this.totalInvoiceValue, this.totalAgingAmount, this.totalSalesValue],
          backgroundColor: [
            'rgba(59, 130, 246, 0.8)',
            'rgba(239, 68, 68, 0.8)',
            'rgba(34, 197, 94, 0.8)'
          ],
          borderColor: [
            'rgba(59, 130, 246, 1)',
            'rgba(239, 68, 68, 1)',
            'rgba(34, 197, 94, 1)'
          ],
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: '#ffffff',
              font: {
                size: 12
              }
            }
          },
          title: {
            display: true,
            text: 'Financial Overview',
            color: '#ffffff',
            font: {
              size: 16,
              weight: 'bold'
            }
          }
        }
      }
    };

    this.pieChart = new Chart(ctx, config);
  }

  private createBarChart(): void {
    if (!this.barChartCanvas) return;

    const ctx = this.barChartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    // Group invoice data by month
    const monthlyData = this.groupDataByMonth(this.invoiceData, 'erdat', 'netwr');

    const config: ChartConfiguration<'bar'> = {
      type: 'bar',
      data: {
        labels: monthlyData.labels,
        datasets: [{
          label: 'Monthly Invoice Values',
          data: monthlyData.values,
          backgroundColor: 'rgba(59, 130, 246, 0.6)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: {
              color: '#ffffff'
            }
          },
          title: {
            display: true,
            text: 'Monthly Invoice Trends',
            color: '#ffffff',
            font: {
              size: 16,
              weight: 'bold'
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              color: '#ffffff'
            },
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            }
          },
          x: {
            ticks: {
              color: '#ffffff'
            },
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            }
          }
        }
      }
    };

    this.barChart = new Chart(ctx, config);
  }

  private createLineChart(): void {
    if (!this.lineChartCanvas) return;

    const ctx = this.lineChartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    // Group aging data by aging buckets
    const agingBuckets = this.groupAgingByBuckets();

    const config: ChartConfiguration<'line'> = {
      type: 'line',
      data: {
        labels: agingBuckets.labels,
        datasets: [{
          label: 'Aging Distribution',
          data: agingBuckets.values,
          borderColor: 'rgba(239, 68, 68, 1)',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: {
              color: '#ffffff'
            }
          },
          title: {
            display: true,
            text: 'Payment Aging Distribution',
            color: '#ffffff',
            font: {
              size: 16,
              weight: 'bold'
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              color: '#ffffff'
            },
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            }
          },
          x: {
            ticks: {
              color: '#ffffff'
            },
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            }
          }
        }
      }
    };

    this.lineChart = new Chart(ctx, config);
  }

  private createDoughnutChart(): void {
    if (!this.doughnutChartCanvas) return;

    const ctx = this.doughnutChartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    // Currency distribution
    const currencyData = this.groupDataByField(this.invoiceData, 'waerk', 'netwr');

    const config: ChartConfiguration<'doughnut'> = {
      type: 'doughnut',
      data: {
        labels: currencyData.labels,
        datasets: [{
          data: currencyData.values,
          backgroundColor: [
            'rgba(59, 130, 246, 0.8)',
            'rgba(34, 197, 94, 0.8)',
            'rgba(245, 158, 11, 0.8)',
            'rgba(168, 85, 247, 0.8)',
            'rgba(236, 72, 153, 0.8)'
          ],
          borderColor: [
            'rgba(59, 130, 246, 1)',
            'rgba(34, 197, 94, 1)',
            'rgba(245, 158, 11, 1)',
            'rgba(168, 85, 247, 1)',
            'rgba(236, 72, 153, 1)'
          ],
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: '#ffffff',
              font: {
                size: 12
              }
            }
          },
          title: {
            display: true,
            text: 'Currency Distribution',
            color: '#ffffff',
            font: {
              size: 16,
              weight: 'bold'
            }
          }
        }
      }
    };

    this.doughnutChart = new Chart(ctx, config);
  }

  private groupDataByMonth(data: any[], dateField: string, valueField: string): { labels: string[], values: number[] } {
    const monthlyData: { [key: string]: number } = {};
    
    data.forEach(item => {
      const date = new Date(item[dateField]);
      const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      const value = parseFloat(item[valueField]) || 0;
      
      monthlyData[monthKey] = (monthlyData[monthKey] || 0) + value;
    });

    const sortedMonths = Object.keys(monthlyData).sort((a, b) => {
      return new Date(a).getTime() - new Date(b).getTime();
    });

    return {
      labels: sortedMonths,
      values: sortedMonths.map(month => monthlyData[month])
    };
  }

  private groupAgingByBuckets(): { labels: string[], values: number[] } {
    const buckets: { [key: string]: number } = {
      '0-30 days': 0,
      '31-60 days': 0,
      '61-90 days': 0,
      '90+ days': 0
    };

    console.log('Grouping aging data by buckets:', this.agingData);
    this.agingData.forEach(item => {
      const aging = parseInt(item.aging) || 0;
      // Use the correct field name: netwr (not amount)
      const amount = parseFloat(item.netwr) || 0;
      console.log('Aging item:', item, 'Aging days:', aging, 'Amount:', amount);
      
      if (aging <= 30) {
        buckets['0-30 days'] += amount;
        console.log('Added to 0-30 days bucket:', amount);
      }
      else if (aging <= 60) {
        buckets['31-60 days'] += amount;
        console.log('Added to 31-60 days bucket:', amount);
      }
      else if (aging <= 90) {
        buckets['61-90 days'] += amount;
        console.log('Added to 61-90 days bucket:', amount);
      }
      else {
        buckets['90+ days'] += amount;
        console.log('Added to 90+ days bucket:', amount);
      }
    });

    console.log('Final aging buckets:', buckets);
    return {
      labels: Object.keys(buckets),
      values: Object.values(buckets)
    };
  }

  private groupDataByField(data: any[], field: string, valueField: string): { labels: string[], values: number[] } {
    const groupedData: { [key: string]: number } = {};
    
    data.forEach(item => {
      const key = item[field] || 'Unknown';
      const value = parseFloat(item[valueField]) || 0;
      groupedData[key] = (groupedData[key] || 0) + value;
    });

    return {
      labels: Object.keys(groupedData),
      values: Object.values(groupedData)
    };
  }

  refreshData(): void {
    this.loadAllFinanceData();
  }

  ngOnDestroy(): void {
    // Destroy charts to prevent memory leaks
    if (this.pieChart) this.pieChart.destroy();
    if (this.barChart) this.barChart.destroy();
    if (this.lineChart) this.lineChart.destroy();
    if (this.doughnutChart) this.doughnutChart.destroy();
  }
}
