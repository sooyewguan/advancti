import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CameraZoneInfoComponent } from './camera-zone-info.component';

describe('CameraZoneInfoComponent', () => {
  let component: CameraZoneInfoComponent;
  let fixture: ComponentFixture<CameraZoneInfoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CameraZoneInfoComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CameraZoneInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
