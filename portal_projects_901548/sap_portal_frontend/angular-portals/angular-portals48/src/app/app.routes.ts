import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/portal-login/portal-login.component').then(m => m.PortalLoginComponent)
  },

  // Vendor Login
  {
    path: 'vendor/login',
    loadComponent: () =>
      import('./vendor-portal/login/login.component').then(m => m.LoginComponent)
  },

  // Vendor Portal
  {
    path: 'vendor',
    loadComponent: () =>
      import('./vendor-portal/vendor-navbar/vendor-navbar.component').then(m => m.VendorNavbarComponent),
    children: [
      { path: 'dashboard', loadComponent: () => import('./vendor-portal/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'profile', loadComponent: () => import('./vendor-portal/profile/profile.component').then(m => m.ProfileComponent) },
      { path: 'purchase-order', loadComponent: () => import('./vendor-portal/purchase-order/purchase-order.component').then(m => m.PurchaseOrderComponent) },
      { path: 'rfq', loadComponent: () => import('./vendor-portal/rfq/rfq.component').then(m => m.RfqComponent) },
      { path: 'goods', loadComponent: () => import('./vendor-portal/goods/goods.component').then(m => m.GoodsComponent) },

      // Finance children moved here directly
      {path: 'finance', loadComponent: () => import('./vendor-portal/finance/finance.component').then(m => m.FinanceComponent)},
      { path: 'aging', loadComponent: () => import('./vendor-portal/finance/aging/aging.component').then(m => m.AgingComponent) },
      { path: 'invoice', loadComponent: () => import('./vendor-portal/finance/invoice/invoice.component').then(m => m.InvoiceComponent) },
      { path: 'memo', loadComponent: () => import('./vendor-portal/finance/memo/memo.component').then(m => m.MemoComponent) },

      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },

  // Customer Login
  {
    path: 'customer/login',
    loadComponent: () =>
      import('./customer-portal/cus-login/cus-login.component').then(m => m.CusLoginComponent)
  },

  // Customer Portal
  {
    path: 'customer',
    loadComponent: () =>
      import('./customer-portal/cus-navbar/cus-navbar.component').then(m => m.CusNavbarComponent),
    children: [
      { path: 'dashboard', loadComponent: () => import('./customer-portal/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'profile', loadComponent: () => import('./customer-portal/profile/profile.component').then(m => m.ProfileComponent) },
      { path: 'delivery', loadComponent: () => import('./customer-portal/delivery/delivery.component').then(m => m.DeliveryComponent) },
      { path: 'sales', loadComponent: () => import('./customer-portal/sales/sales.component').then(m => m.SalesComponent) },
      { path: 'inquiry', loadComponent: () => import('./customer-portal/inquiry/inquiry.component').then(m => m.InquiryComponent) },

      // Finance children moved here directly
      {path: 'finance', loadComponent: () => import('./customer-portal/finance/finance.component').then(m => m.FinanceComponent)},
      { path: 'invoice', loadComponent: () => import('./customer-portal/invoice/invoice.component').then(m => m.InvoiceComponent) },
      { path: 'aging', loadComponent: () => import('./customer-portal/aging/aging.component').then(m => m.AgingComponent) },
      { path: 'memo', loadComponent: () => import('./customer-portal/memo/memo.component').then(m => m.MemoComponent) },
      { path: 'overallsales', loadComponent: () => import('./customer-portal/overallsales/overallsales.component').then(m => m.OverallsalesComponent) },
      { path: 'finance-report', loadComponent: () => import('./customer-portal/finance-report/finance-report.component').then(m => m.FinanceReportComponent) },

      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },

  // Employee Login
  {
    path: 'employee/login',
    loadComponent: () =>
      import('./employee-portal/emp-login/emp-login.component').then(m => m.EmpLoginComponent)
  },

  // Employee Portal
  {
    path: 'employee',
    loadComponent: () =>
      import('./employee-portal/emp-navbar/emp-navbar.component').then(m => m.EmpNavbarComponent),
    children: [
      { path: 'dashboard', loadComponent: () => import('./employee-portal/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'profile', loadComponent: () => import('./employee-portal/profile/profile.component').then(m => m.ProfileComponent) },
      { path: 'leave', loadComponent: () => import('./employee-portal/leave/leave.component').then(m => m.LeaveComponent) },
      { path: 'leave-visual', loadComponent: () => import('./employee-portal/leave-visual/leave-visual.component').then(m => m.LeaveVisualComponent) },
      { path: 'pay', loadComponent: () => import('./employee-portal/pay/pay.component').then(m => m.PayComponent) },

      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  }
];
