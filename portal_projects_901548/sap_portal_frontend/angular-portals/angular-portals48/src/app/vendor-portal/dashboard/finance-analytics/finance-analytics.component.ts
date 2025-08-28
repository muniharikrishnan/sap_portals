import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Chart, ChartConfiguration, ChartType } from 'chart.js';
import { registerables } from 'chart.js';

// Register all Chart.js components
Chart.register(...registerables);

interface FinanceAnalyticsData {
  invoices: {
    total: number;
    pending: number;
    overdue: number;
    paid: number;
    monthlyData: { month: string; amount: number }[];
    currencyBreakdown: { currency: string; amount: number }[];
  };
  aging: {
    total: number;
    current: number;
    days30: number;
    days60: number;
    days90: number;
    over90: number;
    agingBreakdown: { range: string; amount: number; count: number }[];
  };
  memos: {
    total: number;
    credit: number;
    debit: number;
    monthlyData: { month: string; credit: number; debit: number }[];
    typeBreakdown: { type: string; count: number; amount: number }[];
  };
}

@Component({
  selector: 'app-finance-analytics',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './finance-analytics.component.html',
  styleUrls: ['./finance-analytics.component.css']
})
export class FinanceAnalyticsComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('invoiceChart') invoiceChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('agingChart') agingChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('memoChart') memoChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('currencyChart') currencyChartRef!: ElementRef<HTMLCanvasElement>;

  vendorId: string = '';
  financeData: FinanceAnalyticsData | null = null;
  loading: boolean = true;
  error: string | null = null;

  private charts: Chart[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadVendorProfile();
    this.loadFinanceAnalytics();
  }

  ngAfterViewInit() {
    // Charts will be created after data is loaded
  }

  ngOnDestroy() {
    // Clean up charts to prevent memory leaks
    this.charts.forEach(chart => chart.destroy());
  }

  private loadVendorProfile() {
    const storedProfile = localStorage.getItem('vendorProfile');
    if (storedProfile) {
      const profile = JSON.parse(storedProfile);
      this.vendorId = profile.lifnr || profile.vendorId || localStorage.getItem('lifnr') || 'V001';
    } else {
      this.vendorId = localStorage.getItem('lifnr') || localStorage.getItem('vendorId') || 'V001';
    }
  }

  private async loadFinanceAnalytics() {
    try {
      this.loading = true;
      this.error = null;

      // Fetch data from all three services
      const [invoiceData, agingData, memoData] = await Promise.all([
        this.fetchInvoiceData(),
        this.fetchAgingData(),
        this.fetchMemoData()
      ]);

      // Process and combine the data
      this.financeData = this.processFinanceData(invoiceData, agingData, memoData);

      // Create charts after data is loaded
      setTimeout(() => {
        this.createCharts();
      }, 100);

    } catch (error) {
      console.error('Error loading finance analytics:', error);
      this.error = 'Failed to load finance data. Please try again.';
    } finally {
      this.loading = false;
    }
  }

  private async fetchInvoiceData() {
    try {
      const response = await this.http.get(`http://localhost:3000/api/invoices/${this.vendorId}`).toPromise();
      return response as any;
    } catch (error) {
      console.error('Error fetching invoice data:', error);
      // Return mock data if backend is not available
      return { 
        status: 'success', 
        invoices: [
          {
            invoiceNo: 'INV-001',
            invoiceDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            totalAmount: '5000.00',
            currency: 'USD',
            paymentDate: null,
            dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            invoiceNo: 'INV-002',
            invoiceDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
            totalAmount: '7500.00',
            currency: 'USD',
            paymentDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
            dueDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
          }
        ] 
      };
    }
  }

  private async fetchAgingData() {
    try {
      const response = await this.http.get(`http://localhost:3000/api/aging/${this.vendorId}`).toPromise();
      return response as any;
    } catch (error) {
      console.error('Error fetching aging data:', error);
      // Return mock data if backend is not available
      return { 
        status: 'success', 
        aging: [
          {
            paymentDoc: 'PAY-001',
            docYear: '2024',
            paymentDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
            enrtyDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
            vendorId: this.vendorId,
            amountPaid: '5000.00',
            currency: 'USD',
            clearingDoc: 'CLR-001',
            refDocNo: 'INV-001',
            dueDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
            aging: 'Current'
          },
          {
            paymentDoc: 'PAY-002',
            docYear: '2024',
            paymentDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
            enrtyDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
            vendorId: this.vendorId,
            amountPaid: '3000.00',
            currency: 'USD',
            clearingDoc: 'CLR-002',
            refDocNo: 'INV-002',
            dueDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
            aging: '30 Days'
          }
        ] 
      };
    }
  }

  private async fetchMemoData() {
    try {
      const response = await this.http.get(`http://localhost:3000/api/memo/${this.vendorId}`).toPromise();
      return response as any;
    } catch (error) {
      console.error('Error fetching memo data:', error);
      // Return mock data if backend is not available
      return { 
        status: 'success', 
        memo: [
          {
            memoDoc: 'MEMO-001',
            docYear: '2024',
            postingDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
            entryDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
            vendorId: this.vendorId,
            memoType: 'Credit',
            amount: '500.00',
            currency: 'USD',
            referenceDocNo: 'INV-001',
            docType: 'Invoice',
            companyCode: '1000'
          },
          {
            memoDoc: 'MEMO-002',
            docYear: '2024',
            postingDate: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(),
            entryDate: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(),
            vendorId: this.vendorId,
            memoType: 'Debit',
            amount: '250.00',
            currency: 'USD',
            referenceDocNo: 'INV-002',
            docType: 'Invoice',
            companyCode: '1000'
          }
        ] 
      };
    }
  }

  private processFinanceData(invoiceData: any, agingData: any, memoData: any): FinanceAnalyticsData {
    const invoices = invoiceData.invoices || [];
    const aging = agingData.aging || [];
    const memos = memoData.memo || [];

    // Process invoice data
    const totalInvoices = invoices.length;
    const pendingInvoices = invoices.filter((inv: any) => !inv.paymentDate).length;
    const overdueInvoices = invoices.filter((inv: any) => {
      if (!inv.dueDate) return false;
      const dueDate = new Date(inv.dueDate);
      return dueDate < new Date();
    }).length;
    const paidInvoices = totalInvoices - pendingInvoices;

    // Group invoices by month
    const monthlyData = this.groupInvoicesByMonth(invoices);
    
    // Group by currency
    const currencyBreakdown = this.groupInvoicesByCurrency(invoices);

    // Process aging data
    const agingBreakdown = this.processAgingBreakdown(aging);

    // Process memo data
    const memoTypeBreakdown = this.processMemoTypeBreakdown(memos);
    const memoMonthlyData = this.groupMemosByMonth(memos);

    return {
      invoices: {
        total: totalInvoices,
        pending: pendingInvoices,
        overdue: overdueInvoices,
        paid: paidInvoices,
        monthlyData,
        currencyBreakdown
      },
      aging: {
        total: aging.length,
        current: aging.filter((item: any) => item.aging === 'Current').length,
        days30: aging.filter((item: any) => item.aging === '30 Days').length,
        days60: aging.filter((item: any) => item.aging === '60 Days').length,
        days90: aging.filter((item: any) => item.aging === '90 Days').length,
        over90: aging.filter((item: any) => item.aging === 'Over 90 Days').length,
        agingBreakdown
      },
      memos: {
        total: memos.length,
        credit: memos.filter((memo: any) => memo.memoType === 'Credit').length,
        debit: memos.filter((memo: any) => memo.memoType === 'Debit').length,
        monthlyData: memoMonthlyData,
        typeBreakdown: memoTypeBreakdown
      }
    };
  }

  private groupInvoicesByMonth(invoices: any[]): { month: string; amount: number }[] {
    const monthlyMap = new Map<string, number>();
    
    invoices.forEach(invoice => {
      if (invoice.invoiceDate) {
        const date = new Date(invoice.invoiceDate);
        const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        const amount = parseFloat(invoice.totalAmount) || 0;
        monthlyMap.set(monthKey, (monthlyMap.get(monthKey) || 0) + amount);
      }
    });

    return Array.from(monthlyMap.entries()).map(([month, amount]) => ({ month, amount }));
  }

  private groupInvoicesByCurrency(invoices: any[]): { currency: string; amount: number }[] {
    const currencyMap = new Map<string, number>();
    
    invoices.forEach(invoice => {
      const currency = invoice.currency || 'Unknown';
      const amount = parseFloat(invoice.totalAmount) || 0;
      currencyMap.set(currency, (currencyMap.get(currency) || 0) + amount);
    });

    return Array.from(currencyMap.entries()).map(([currency, amount]) => ({ currency, amount }));
  }

  private processAgingBreakdown(aging: any[]): { range: string; amount: number; count: number }[] {
    const ranges = ['Current', '30 Days', '60 Days', '90 Days', 'Over 90 Days'];
    const breakdown = ranges.map(range => {
      const items = aging.filter(item => item.aging === range);
      const amount = items.reduce((sum, item) => sum + (parseFloat(item.amountPaid) || 0), 0);
      return { range, amount, count: items.length };
    });
    return breakdown;
  }

  private processMemoTypeBreakdown(memos: any[]): { type: string; count: number; amount: number }[] {
    const typeMap = new Map<string, { count: number; amount: number }>();
    
    memos.forEach(memo => {
      const type = memo.memoType || 'Unknown';
      const amount = parseFloat(memo.amount) || 0;
      
      if (!typeMap.has(type)) {
        typeMap.set(type, { count: 0, amount: 0 });
      }
      
      const current = typeMap.get(type)!;
      current.count++;
      current.amount += amount;
    });

    return Array.from(typeMap.entries()).map(([type, data]) => ({
      type,
      count: data.count,
      amount: data.amount
    }));
  }

  private groupMemosByMonth(memos: any[]): { month: string; credit: number; debit: number }[] {
    const monthlyMap = new Map<string, { credit: number; debit: number }>();
    
    memos.forEach(memo => {
      if (memo.postingDate) {
        const date = new Date(memo.postingDate);
        const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        const amount = parseFloat(memo.amount) || 0;
        
        if (!monthlyMap.has(monthKey)) {
          monthlyMap.set(monthKey, { credit: 0, debit: 0 });
        }
        
        const current = monthlyMap.get(monthKey)!;
        if (memo.memoType === 'Credit') {
          current.credit += amount;
        } else {
          current.debit += amount;
        }
      }
    });

    return Array.from(monthlyMap.entries()).map(([month, data]) => ({
      month,
      credit: data.credit,
      debit: data.debit
    }));
  }

  private createCharts() {
    if (!this.financeData) return;

    // Create Invoice Trend Chart
    this.createInvoiceChart();
    
    // Create Aging Distribution Chart
    this.createAgingChart();
    
    // Create Memo Type Chart
    this.createMemoChart();
    
    // Create Currency Distribution Chart
    this.createCurrencyChart();
  }

  private createInvoiceChart() {
    if (!this.invoiceChartRef || !this.financeData) return;

    const ctx = this.invoiceChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const config: ChartConfiguration<'line'> = {
      type: 'line',
      data: {
        labels: this.financeData.invoices.monthlyData.map(item => item.month),
        datasets: [{
          label: 'Invoice Amount',
          data: this.financeData.invoices.monthlyData.map(item => item.amount),
          borderColor: '#7c3aed',
          backgroundColor: 'rgba(124, 58, 237, 0.1)',
          tension: 0.4,
          fill: true
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Monthly Invoice Trends',
            color: '#ffffff'
          },
          legend: {
            labels: { color: '#ffffff' }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { color: '#ffffff' },
            grid: { color: 'rgba(255, 255, 255, 0.1)' }
          },
          x: {
            ticks: { color: '#ffffff' },
            grid: { color: 'rgba(255, 255, 255, 0.1)' }
          }
        }
      }
    };

    const chart = new Chart(ctx, config);
    this.charts.push(chart);
  }

  private createAgingChart() {
    if (!this.agingChartRef || !this.financeData) return;

    const ctx = this.agingChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const config: ChartConfiguration<'doughnut'> = {
      type: 'doughnut',
      data: {
        labels: this.financeData.aging.agingBreakdown.map(item => item.range),
        datasets: [{
          data: this.financeData.aging.agingBreakdown.map(item => item.count),
          backgroundColor: [
            '#10b981', // Current - Green
            '#3b82f6', // 30 Days - Blue
            '#f59e0b', // 60 Days - Orange
            '#ef4444', // 90 Days - Red
            '#8b5cf6'  // Over 90 - Purple
          ],
          borderWidth: 2,
          borderColor: '#1f2937'
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Aging Distribution',
            color: '#ffffff'
          },
          legend: {
            position: 'bottom',
            labels: { color: '#ffffff' }
          }
        }
      }
    };

    const chart = new Chart(ctx, config);
    this.charts.push(chart);
  }

  private createMemoChart() {
    if (!this.memoChartRef || !this.financeData) return;

    const ctx = this.memoChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const config: ChartConfiguration<'bar'> = {
      type: 'bar',
      data: {
        labels: this.financeData.memos.monthlyData.map(item => item.month),
        datasets: [
          {
            label: 'Credit Memos',
            data: this.financeData.memos.monthlyData.map(item => item.credit),
            backgroundColor: '#10b981',
            borderColor: '#059669',
            borderWidth: 1
          },
          {
            label: 'Debit Memos',
            data: this.financeData.memos.monthlyData.map(item => item.debit),
            backgroundColor: '#ef4444',
            borderColor: '#dc2626',
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Monthly Memo Trends',
            color: '#ffffff'
          },
          legend: {
            labels: { color: '#ffffff' }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { color: '#ffffff' },
            grid: { color: 'rgba(255, 255, 255, 0.1)' }
          },
          x: {
            ticks: { color: '#ffffff' },
            grid: { color: 'rgba(255, 255, 255, 0.1)' }
          }
        }
      }
    };

    const chart = new Chart(ctx, config);
    this.charts.push(chart);
  }

  private createCurrencyChart() {
    if (!this.currencyChartRef || !this.financeData) return;

    const ctx = this.currencyChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const config: ChartConfiguration<'pie'> = {
      type: 'pie',
      data: {
        labels: this.financeData.invoices.currencyBreakdown.map(item => item.currency),
        datasets: [{
          data: this.financeData.invoices.currencyBreakdown.map(item => item.amount),
          backgroundColor: [
            '#7c3aed', // Purple
            '#3b82f6', // Blue
            '#10b981', // Green
            '#f59e0b', // Orange
            '#ef4444'  // Red
          ],
          borderWidth: 2,
          borderColor: '#1f2937'
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Currency Distribution',
            color: '#ffffff'
          },
          legend: {
            position: 'bottom',
            labels: { color: '#ffffff' }
          }
        }
      }
    };

    const chart = new Chart(ctx, config);
    this.charts.push(chart);
  }

  refreshData() {
    this.loadFinanceAnalytics();
  }
}
