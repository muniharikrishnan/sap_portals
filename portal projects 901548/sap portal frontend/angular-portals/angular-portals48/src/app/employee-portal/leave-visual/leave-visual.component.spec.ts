import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LeaveVisualComponent } from './leave-visual.component';

describe('LeaveVisualComponent', () => {
  let component: LeaveVisualComponent;
  let fixture: ComponentFixture<LeaveVisualComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LeaveVisualComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LeaveVisualComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
