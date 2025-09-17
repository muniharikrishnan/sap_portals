import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { EmployeeService, PayslipRecord } from '../../services/employee.service';

// Company code mapping
const COMPANY_CODE_MAP: Record<string, string> = {
  "0001": "SAP SE",
  "0003": "SAP US (GS-HT-SW)",
  "0MB1": "IS-B Musterbank Deutschl.",
  "1001": "Amul",
  "6789": "DLR",
  "AE01": "Country Template AE",
  "AR01": "Country Template AR",
  "AT01": "Country Template AT",
  "AU01": "Country Template AU",
  "BE01": "Country Template BE",
  "BR01": "Country Template BR",
  "CA01": "Country Template CA",
  "CH01": "Country Template CH",
  "CL01": "Country Template CL",
  "CO01": "Country Template CO",
  "CN01": "Country Template CN",
  "CZ01": "Country Template CZ",
  "DE01": "Country Template DE",
  "EG01": "Country Template Egypt",
  "ES01": "Country Template ES",
  "FI01": "Country Template FI",
  "FR01": "Country Template FR",
  "GB01": "Country Template GB",
  "HK01": "Country Template HK",
  "HU01": "Country Template HU",
  "ID01": "Country Template ID",
  "IE01": "Country Template IE",
  "IN01": "India Model Company, IN",
  "IT01": "Country Template IT",
  "IT77": "Country Template IT",
  "JP01": "Country Template JP",
  "KR01": "Country Template KR",
  "KW01": "Country Template KW",
  "KZ01": "Country Template KZ",
  "LU01": "Country Template LU",
  "MCA1": "MCA Bank Backpack (bal.)",
  "MCA2": "MCA Bank Backpack (doc.)",
  "MCA3": "MCA Bank 4-pack (bal.)",
  "MCA4": "MCA Bank 4-pack (doc.)",
  "MX01": "Country Template MX",
  "MY01": "Country Template MY",
  "NL01": "Country Template NL",
  "NO01": "Country Template NO",
  "NZ01": "Country Template NZ",
  "PE01": "Country Template PE",
  "PH01": "Country Template PH",
  "PL01": "Country Template PL",
  "PT01": "Country Template PT",
  "PT02": "Country Template PT (SNC)",
  "QA01": "Country Template QA",
  "REC0": "Sonderenptgeltnorm(WEG)",
  "REOF": "Referenzobjectmandate",
  "RERF": "WEG Referenzbuchungskreis",
  "RS01": "Country template RS",
  "RU01": "Country Template RU",
  "SE01": "Country Template SE",
  "SG01": "SAP Asia",
  "SK01": "Country Template SK",
  "SLE0": "Musterbank",
  "TH01": "Country Template TH",
  "TR01": "Country Template TR",
  "TW01": "Country Template TW",
  "UA01": "Country Template UA",
  "US01": "Country Template US",
  "VE01": "Country Template VE",
  "Z001": "SAP SE",
  "ZA01": "Country Template ZA"
};

@Component({
  selector: 'app-pay',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pay.component.html',
  styleUrl: './pay.component.css'
})
export class PayComponent implements OnInit {
  payslipRecords: PayslipRecord[] = [];
  isLoading: boolean = false;
  isDownloading: boolean = false;
  error: string = '';
  downloadSuccess: boolean = false;
  employeeId: string = '';

  constructor(
    private employeeService: EmployeeService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.employeeId = this.employeeService.getCurrentEmployeeId() || '';
    
    if (!this.employeeId) {
      // During SSR, localStorage is not available, so we'll handle this in the browser
      if (typeof window !== 'undefined') {
        this.router.navigate(['/employee/login']);
      }
      return;
    }

    this.loadPayData();
  }

  /**
   * Load payslip data from SAP backend
   */
  loadPayData(): void {
    this.isLoading = true;
    this.error = '';
    this.downloadSuccess = false;

    console.log('Loading payslip data for employee ID:', this.employeeId);

    this.employeeService.getEmployeePayslip(this.employeeId).subscribe({
      next: (response) => {
        console.log('Payslip data received:', response);
        this.payslipRecords = response.payslip || [];
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error fetching payslip data:', error);
        
        if (error.status === 404) {
          this.error = 'Payslip data not found. Please check if the backend server is running and the route is properly configured.';
        } else if (error.status === 0) {
          this.error = 'Cannot connect to backend server. Please check if the server is running on port 3002.';
        } else {
          this.error = `Failed to load payslip data. Error: ${error.status} - ${error.message}`;
        }
        
        this.isLoading = false;
      }
    });
  }

  /**
   * Refresh payslip data
   */
  refreshPayData(): void {
    this.loadPayData();
  }

  /**
   * Download payslip PDF
   */
  downloadPayslipPdf(): void {
    if (!this.employeeId) {
      this.error = 'Employee ID not found. Please login again.';
      return;
    }

    this.isDownloading = true;
    this.error = '';
    this.downloadSuccess = false;

    console.log('Downloading payslip PDF for employee ID:', this.employeeId);

    this.employeeService.getEmployeePayPdf(this.employeeId).subscribe({
      next: (response) => {
        console.log('PDF data received');
        
        if (response.base64) {
          this.downloadPdfFromBase64(response.base64);
          this.downloadSuccess = true;
          
          // Hide success message after 5 seconds
          setTimeout(() => {
            this.downloadSuccess = false;
          }, 5000);
        } else {
          this.error = 'No PDF data received from server.';
        }
        
        this.isDownloading = false;
      },
      error: (error) => {
        console.error('Error downloading payslip PDF:', error);
        
        if (error.status === 404) {
          this.error = 'PDF service not found. Please check if the backend server is running.';
        } else if (error.status === 0) {
          this.error = 'Cannot connect to backend server for PDF download.';
        } else {
          this.error = `Failed to download PDF. Error: ${error.status} - ${error.message}`;
        }
        
        this.isDownloading = false;
      }
    });
  }

  /**
   * Convert base64 string to downloadable PDF
   */
  private downloadPdfFromBase64(base64String: string): void {
    try {
      // Remove data URL prefix if present
      const base64Data = base64String.replace(/^data:application\/pdf;base64,/, '');
      
      // Convert base64 to binary
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      // Create blob and download
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      
      // Create download link
      const link = document.createElement('a');
      link.href = url;
      link.download = `payslip_${this.employeeId}_${new Date().toISOString().split('T')[0]}.pdf`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      console.log('PDF download initiated successfully');
    } catch (error) {
      console.error('Error processing PDF download:', error);
      this.error = 'Failed to process PDF download. Please try again.';
    }
  }

  /**
   * Calculate total amount from all payslip records
   */
  getTotalAmount(): string {
    if (!this.payslipRecords.length) return '0';
    
    const total = this.payslipRecords.reduce((sum, record) => {
      const amount = parseFloat(record.amount) || 0;
      return sum + amount;
    }, 0);
    
    const currency = this.payslipRecords[0]?.currency || '';
    return this.formatAmount(total.toString(), currency);
  }

  /**
   * Calculate total working hours
   */
  getTotalWorkingHours(): string {
    if (!this.payslipRecords.length) return '0h';
    
    const totalHours = this.payslipRecords.reduce((sum, record) => {
      const hours = parseFloat(record.workingHours) || 0;
      return sum + hours;
    }, 0);
    
    return `${totalHours}h`;
  }

  /**
   * Get number of unique companies
   */
  getUniqueCompanies(): number {
    if (!this.payslipRecords.length) return 0;
    
    const uniqueCompanies = new Set(
      this.payslipRecords
        .map(record => record.companyCode)
        .filter(code => code && code.trim() !== '')
    );
    
    return uniqueCompanies.size;
  }

  /**
   * Format amount with currency
   */
  formatAmount(amount: string, currency: string): string {
    if (!amount || amount === '0') return '0';
    
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) return amount;
    
    const formatted = numAmount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    
    return currency ? `${formatted} ${currency}` : formatted;
  }

  /**
   * Format date for display
   */
  formatDate(dateString: string): string {
    if (!dateString) return 'Not Available';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  }

  /**
   * Get company description from company code
   */
  getCompanyDescription(companyCode: string): string {
    if (!companyCode) return 'N/A';
    return COMPANY_CODE_MAP[companyCode] || companyCode;
  }

  /**
   * Get gender display text from gender value
   */
  getGenderDisplay(gender: string): string {
    if (!gender) return 'Not Available';
    
    // Handle different gender representations
    switch (gender.toString().toLowerCase()) {
      case '1':
      case 'male':
      case 'm':
        return 'MALE';
      case '2':
      case 'female':
      case 'f':
        return 'FEMALE';
      case '3':
      case 'other':
      case 'o':
        return 'OTHER';
      default:
        return gender;
    }
  }

  /**
   * Track by function for ngFor optimization
   */
  trackByRecord(index: number, record: PayslipRecord): string {
    return `${record.employeeId}-${record.companyCode}-${record.costCenter}-${record.wageType}`;
  }
}
