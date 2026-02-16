import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { BatchSelectModal } from './batch-select-modal';

describe('BatchSelectModal', () => {
  let component: BatchSelectModal;
  let fixture: ComponentFixture<BatchSelectModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BatchSelectModal],
      providers: [provideHttpClient()],
    }).compileComponents();

    fixture = TestBed.createComponent(BatchSelectModal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should start with lists tab active', () => {
    expect(component.activeTab()).toBe('lists');
  });

  it('should switch tabs', () => {
    component.setActiveTab('custom');
    expect(component.activeTab()).toBe('custom');
    component.setActiveTab('lists');
    expect(component.activeTab()).toBe('lists');
  });

  it('should emit close event', () => {
    const closeSpy = vi.fn();
    component.close.subscribe(closeSpy);
    component.onClose();
    expect(closeSpy).toHaveBeenCalled();
  });

  it('should update custom list on input', () => {
    const event = { target: { value: 'GAPDH\nACTB' } } as unknown as Event;
    component.onCustomListInput(event);
    expect(component.customList()).toBe('GAPDH\nACTB');
  });

  it('should start with gene search mode', () => {
    expect(component.searchMode()).toBe('gene');
  });

  it('should switch search mode', () => {
    component.setSearchMode('accession');
    expect(component.searchMode()).toBe('accession');
    component.setSearchMode('gene');
    expect(component.searchMode()).toBe('gene');
  });
});
