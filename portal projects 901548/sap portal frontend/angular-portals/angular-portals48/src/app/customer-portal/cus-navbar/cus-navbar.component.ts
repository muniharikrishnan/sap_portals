import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-cus-navbar',
  standalone: true,
  imports: [RouterModule,HttpClientModule,CommonModule],
  templateUrl: './cus-navbar.component.html', 
  styleUrls: ['./cus-navbar.component.css']
})
export class CusNavbarComponent {
  // Optionally, you can add logic to track the active tab if needed
  // But routerLinkActive handles highlighting
}
