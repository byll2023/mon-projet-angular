import { ComponentFixture, TestBed } from '@angular/core/testing';
import { JeuComponent } from './jeu';

describe('JeuComponent', () => {
  let component: JeuComponent;
  let fixture: ComponentFixture<JeuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JeuComponent] // ✅ Standalone components vont ici
    }).compileComponents();

    fixture = TestBed.createComponent(JeuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
