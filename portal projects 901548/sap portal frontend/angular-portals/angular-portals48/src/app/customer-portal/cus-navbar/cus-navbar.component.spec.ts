import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CusNavbarComponent } from './cus-navbar.component';

describe('CusNavbarComponent', () => {
  let component: CusNavbarComponent;
  let fixture: ComponentFixture<CusNavbarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CusNavbarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CusNavbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
