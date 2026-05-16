import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GradingLists } from './grading-lists';

describe('GradingLists', () => {
  let component: GradingLists;
  let fixture: ComponentFixture<GradingLists>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GradingLists]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GradingLists);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
