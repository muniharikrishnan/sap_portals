import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-portal-login',
  imports: [CommonModule, RouterModule],
  templateUrl: './portal-login.component.html',
  styleUrl: './portal-login.component.css'
})
export class PortalLoginComponent {
  selectedTab: 'home' | 'about' | 'help' | 'contact' = 'home';

  selectTab(tab: 'home' | 'about' | 'help' | 'contact'): void {
    this.selectedTab = tab;
  }
}
