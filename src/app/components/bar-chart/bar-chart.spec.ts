import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { PlotlyService } from 'angular-plotly.js';
import * as PlotlyJS from 'plotly.js-dist-min';
import { BarChart } from './bar-chart';

describe('BarChart', () => {
  let component: BarChart;
  let fixture: ComponentFixture<BarChart>;

  beforeAll(() => {
    PlotlyService.setPlotly(PlotlyJS);
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BarChart],
      providers: [provideRouter([]), provideHttpClient()],
    }).compileComponents();

    fixture = TestBed.createComponent(BarChart);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have no selected cell lines initially', () => {
    expect(component.selectedCellLines().length).toBe(0);
  });

  it('should have no selected genes initially', () => {
    expect(component.selectedGenes().length).toBe(0);
  });

  it('should return false for hasData when no data', () => {
    expect(component.hasData()).toBe(false);
  });

  it('should toggle cell line selection', () => {
    component.toggleCellLine('A549');
    expect(component.selectedCellLines()).toContain('A549');
    component.toggleCellLine('A549');
    expect(component.selectedCellLines()).not.toContain('A549');
  });

  it('should add and remove genes', () => {
    component.selectSearchResult('GAPDH');
    expect(component.selectedGenes()).toContain('GAPDH');
    component.removeGene('GAPDH');
    expect(component.selectedGenes()).not.toContain('GAPDH');
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
