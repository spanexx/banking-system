import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SetLimitDialogComponent } from './set-limit-dialog.component';

describe('SetLimitDialogComponent', () => {
  let component: SetLimitDialogComponent;
  let fixture: ComponentFixture<SetLimitDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SetLimitDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SetLimitDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
