import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-finance',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './finance.component.html',
  styleUrls: ['./finance.component.css']
})
export class FinanceComponent {
  constructor(private router: Router) {}
  
  goTo(path: string) {
    this.router.navigate([`/vendor/${path}`]);
  }

  goBack() {
    this.router.navigate(['/vendor/dashboard']);
  }
}
