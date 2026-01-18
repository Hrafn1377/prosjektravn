import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Collaborations } from './collaborations';

describe('Collaborations', () => {
  let component: Collaborations;
  let fixture: ComponentFixture<Collaborations>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Collaborations]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Collaborations);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
