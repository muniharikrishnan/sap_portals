import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-vendor-navbar',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './vendor-navbar.component.html',
  styleUrls: ['./vendor-navbar.component.css']
})
export class VendorNavbarComponent {
  toggleLightMode() {
    document.body.classList.toggle('light-mode');
  }
}
