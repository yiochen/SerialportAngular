import { TestBed } from '@angular/core/testing';

import { MA901Service } from './ma901.service';

describe('MA901Service', () => {
  let service: MA901Service;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MA901Service);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
