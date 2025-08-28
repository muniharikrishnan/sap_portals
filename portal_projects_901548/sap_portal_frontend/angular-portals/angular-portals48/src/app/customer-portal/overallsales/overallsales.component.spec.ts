import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OverallsalesComponent } from './overallsales.component';

describe('OverallsalesComponent', () => {
  let component: OverallsalesComponent;
  let fixture: ComponentFixture<OverallsalesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OverallsalesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OverallsalesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
