import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EmployeeService, EmployeeProfile } from '../../services/employee.service';

@Component({
  selector: 'app-profile',
  imports: [CommonModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
  profile: EmployeeProfile | null = null;
  loading: boolean = false;
  error: string | null = null;
  employeeId: string | null = null;
  editMode: boolean = false;
  successMessage: string | null = null;

  constructor(private employeeService: EmployeeService) {}

  ngOnInit(): void {
    this.employeeId = this.employeeService.getCurrentEmployeeId();
    if (this.employeeId) {
      this.loadProfile();
    } else {
      this.error = 'Employee ID not found. Please login again.';
    }
  }

  loadProfile(): void {
    if (!this.employeeId) return;

    this.loading = true;
    this.error = null;

    this.employeeService.getEmployeeProfile(this.employeeId).subscribe({
      next: (profileData) => {
        this.profile = profileData;
        this.loading = false;
      },
      error: (error) => {
        console.error('Profile fetch error:', error);
        this.error = 'Failed to load profile data. Please try again.';
        this.loading = false;
      }
    });
  }

  refreshProfile(): void {
    this.loadProfile();
  }

  toggleEditMode(): void {
    this.editMode = !this.editMode;
    if (this.editMode) {
      this.showSuccessMessage('Edit mode enabled. You can now modify your profile.');
    } else {
      this.showSuccessMessage('Edit mode disabled.');
    }
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'Not Available';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  }

  getGenderDisplay(gender: string): string {
    if (!gender) return 'Not Available';
    
    // Handle different gender representations
    switch (gender.toString().toLowerCase()) {
      case '1':
      case 'male':
      case 'm':
        return 'Male';
      case '2':
      case 'female':
      case 'f':
        return 'Female';
      case '3':
      case 'other':
      case 'o':
        return 'Other';
      default:
        return gender;
    }
  }

  copyToClipboard(text: string): void {
    if (!text) return;
    
    if (navigator.clipboard && window.isSecureContext) {
      // Use the modern clipboard API
      navigator.clipboard.writeText(text).then(() => {
        this.showSuccessMessage(`Copied "${text}" to clipboard!`);
      }).catch(err => {
        console.error('Failed to copy text: ', err);
        this.fallbackCopyTextToClipboard(text);
      });
    } else {
      // Fallback for older browsers
      this.fallbackCopyTextToClipboard(text);
    }
  }

  private fallbackCopyTextToClipboard(text: string): void {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    
    // Avoid scrolling to bottom
    textArea.style.top = '0';
    textArea.style.left = '0';
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      const successful = document.execCommand('copy');
      if (successful) {
        this.showSuccessMessage(`Copied "${text}" to clipboard!`);
      } else {
        console.error('Fallback: Copying text command was unsuccessful');
      }
    } catch (err) {
      console.error('Fallback: Oops, unable to copy', err);
    }
    
    document.body.removeChild(textArea);
  }

  private showSuccessMessage(message: string): void {
    this.successMessage = message;
    setTimeout(() => {
      this.successMessage = null;
    }, 3000);
  }

  // Quick action methods (placeholders for future implementation)
  downloadProfile(): void {
    this.showSuccessMessage('Download feature coming soon!');
  }

  printProfile(): void {
    window.print();
  }

  shareProfile(): void {
    if (navigator.share) {
      navigator.share({
        title: 'Employee Profile',
        text: `Profile of ${this.profile?.fullName || 'Employee'}`,
        url: window.location.href
      }).then(() => {
        this.showSuccessMessage('Profile shared successfully!');
      }).catch(err => {
        console.error('Error sharing:', err);
        this.showSuccessMessage('Sharing not supported on this device.');
      });
    } else {
      this.copyToClipboard(window.location.href);
      this.showSuccessMessage('Profile URL copied to clipboard!');
    }
  }

  changePassword(): void {
    this.showSuccessMessage('Password change feature coming soon!');
  }
}
