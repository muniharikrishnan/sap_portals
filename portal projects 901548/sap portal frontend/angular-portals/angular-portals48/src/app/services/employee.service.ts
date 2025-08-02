import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';

export interface EmployeeLoginRequest {
  employeeId: string;
  password: string;
}

export interface EmployeeLoginResponse {
  status: string;
  employeeId: string;
  message?: string;
  error?: string;
}

export interface EmployeeProfile {
  fullName: string;
  gender: string;
  dob: string;
  orgUnit: string;
  position: string;
  department: string;
  compCode: string;
  email: string;
  phone: string;
  address: string;
}

export interface LeaveRecord {
  employeeId: string;
  startDate: string;
  endDate: string;
  absenceType: string;
  absenceDays: string;
  reason: string;
  quotaNumber: string;
  quotaStart: string;
  quotaEnd: string;
}

export interface LeaveResponse {
  leaves: LeaveRecord[];
}

export interface PayslipRecord {
  employeeId: string;
  companyCode: string;
  costCenter: string;
  position: string;
  name: string;
  gender: string;
  dateOfBirth: string;
  nationality: string;
  payScaleGroup: string;
  payScaleLevel: string;
  amount: string;
  wageType: string;
  currency: string;
  workingHours: string;
}

export interface PayslipResponse {
  payslip: PayslipRecord[];
}

export interface PayPdfResponse {
  base64: string;
}

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  private readonly API_BASE_URL = 'http://localhost:3002/api';
  
  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json'
    })
  };

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  /**
   * Login employee using SAP backend
   * @param employeeId - Employee ID
   * @param password - Employee password
   * @returns Observable<EmployeeLoginResponse>
   */
  loginEmployee(employeeId: string, password: string): Observable<EmployeeLoginResponse> {
    const loginData: EmployeeLoginRequest = {
      employeeId: employeeId.trim(),
      password: password.trim()
    };

    return this.http.post<EmployeeLoginResponse>(
      `${this.API_BASE_URL}/employee-login`,
      loginData,
      this.httpOptions
    );
  }

  /**
   * Check if employee is currently logged in
   * @returns boolean
   */
  isEmployeeLoggedIn(): boolean {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem('isEmployeeLoggedIn') === 'true';
    }
    return false;
  }

  /**
   * Get current employee ID from localStorage
   * @returns string | null
   */
  getCurrentEmployeeId(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem('employeeId');
    }
    return null;
  }

  /**
   * Logout employee - clear localStorage
   */
  logoutEmployee(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('employeeId');
      localStorage.removeItem('isEmployeeLoggedIn');
      localStorage.removeItem('employeeData');
    }
  }

  /**
   * Store employee session data
   * @param employeeId - Employee ID
   * @param additionalData - Any additional employee data
   */
  setEmployeeSession(employeeId: string, additionalData?: any): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('employeeId', employeeId);
      localStorage.setItem('isEmployeeLoggedIn', 'true');
      
      if (additionalData) {
        localStorage.setItem('employeeData', JSON.stringify(additionalData));
      }
    }
  }

  /**
   * Get stored employee data
   * @returns any | null
   */
  getEmployeeData(): any | null {
    if (isPlatformBrowser(this.platformId)) {
      const data = localStorage.getItem('employeeData');
      return data ? JSON.parse(data) : null;
    }
    return null;
  }

  /**
   * Fetch employee profile from SAP backend
   * @param employeeId - Employee ID
   * @returns Observable<EmployeeProfile>
   */
  getEmployeeProfile(employeeId: string): Observable<EmployeeProfile> {
    const profileData = {
      employeeId: employeeId.trim()
    };

    return this.http.post<EmployeeProfile>(
      `${this.API_BASE_URL}/employee-profile`,
      profileData,
      this.httpOptions
    );
  }

  /**
   * Fetch employee leave details from SAP backend
   * @param employeeId - Employee ID
   * @returns Observable<LeaveResponse>
   */
  getEmployeeLeave(employeeId: string): Observable<LeaveResponse> {
    const leaveData = {
      employeeId: employeeId.trim()
    };

    return this.http.post<LeaveResponse>(
      `${this.API_BASE_URL}/employee-leave`,
      leaveData,
      this.httpOptions
    );
  }

  /**
   * Fetch employee payslip details from SAP backend
   * @param employeeId - Employee ID
   * @returns Observable<PayslipResponse>
   */
  getEmployeePayslip(employeeId: string): Observable<PayslipResponse> {
    const payData = {
      employeeId: employeeId.trim()
    };

    return this.http.post<PayslipResponse>(
      `${this.API_BASE_URL}/employee-pay`,
      payData,
      this.httpOptions
    );
  }

  /**
   * Fetch employee payslip PDF from SAP backend
   * @param employeeId - Employee ID
   * @returns Observable<PayPdfResponse>
   */
  getEmployeePayPdf(employeeId: string): Observable<PayPdfResponse> {
    const payPdfData = {
      employeeId: employeeId.trim()
    };

    return this.http.post<PayPdfResponse>(
      `${this.API_BASE_URL}/employee-paypdf`,
      payPdfData,
      this.httpOptions
    );
  }
}
