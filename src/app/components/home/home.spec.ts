import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Home } from './home';

describe('Home', () => {
  let component: Home;
  let fixture: ComponentFixture<Home>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Home],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Home);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have navigation links with correct paths', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const links = compiled.querySelectorAll('a[routerLink]');
    expect(links.length).toBe(2);
    
    const scatterLink = Array.from(links).find(l => l.getAttribute('routerLink') === '/scatter-plot');
    const barLink = Array.from(links).find(l => l.getAttribute('routerLink') === '/bar-chart');
    
    expect(scatterLink).toBeTruthy();
    expect(barLink).toBeTruthy();
  });
});
