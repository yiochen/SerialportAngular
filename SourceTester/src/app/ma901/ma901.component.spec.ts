import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MA901Component } from './ma901.component';

describe('MA901Component', () => {
  let component: MA901Component;
  let fixture: ComponentFixture<MA901Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MA901Component ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MA901Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
