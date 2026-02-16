import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { PlotlyService } from 'angular-plotly.js';
import * as PlotlyJS from 'plotly.js-dist-min';
import { ScatterPlot } from './scatter-plot';

describe('ScatterPlot', () => {
  let component: ScatterPlot;
  let fixture: ComponentFixture<ScatterPlot>;

  beforeAll(() => {
    PlotlyService.setPlotly(PlotlyJS);
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScatterPlot],
      providers: [provideRouter([]), provideHttpClient()],
    }).compileComponents();

    fixture = TestBed.createComponent(ScatterPlot);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have no selected cell lines initially', () => {
    expect(component.selectedCellLines().length).toBe(0);
  });

  it('should have no highlighted genes initially', () => {
    expect(component.highlightedGenes().length).toBe(0);
  });

  it('should return false for hasData when no cell lines selected', () => {
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
    expect(component.highlightedGenes()).toContain('GAPDH');
    component.removeGene('GAPDH');
    expect(component.highlightedGenes()).not.toContain('GAPDH');
  });

  it('should reset selection', () => {
    component.selectSearchResult('GAPDH');
    component.resetSelection();
    expect(component.highlightedGenes().length).toBe(0);
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
