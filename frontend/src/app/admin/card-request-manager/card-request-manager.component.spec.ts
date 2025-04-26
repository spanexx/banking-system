import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CardRequestManagerComponent } from './card-request-manager.component';

describe('CardRequestManagerComponent', () => {
  let component: CardRequestManagerComponent;
  let fixture: ComponentFixture<CardRequestManagerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CardRequestManagerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CardRequestManagerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
