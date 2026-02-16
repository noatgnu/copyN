import { TestBed } from '@angular/core/testing';
import { DataService } from './data';

describe('DataService', () => {
  let service: DataService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start with empty data', () => {
    expect(service.data().length).toBe(0);
  });

  it('should start with empty cell lines', () => {
    expect(service.availableCellLines().length).toBe(0);
  });

  it('should not be loading initially', () => {
    expect(service.loading()).toBe(false);
  });

  it('should search genes correctly', () => {
    const results = service.searchGenes('A', 10);
    expect(results).toEqual([]);
  });

  it('should return empty scatter data for unknown cell line', () => {
    const data = service.getScatterDataForCellLine('Unknown');
    expect(data).toEqual([]);
  });

  it('should return empty bar chart data for unknown gene', () => {
    const data = service.getBarChartDataForGene('Unknown', ['A549']);
    expect(data).toEqual([]);
  });

  it('should return empty array for fuzzy match with no data loaded', () => {
    const result = service.fuzzyMatchGenes(['GAPDH', 'ACTB']);
    expect(result).toEqual([]);
  });

  it('should return empty matched and unmatched arrays for fuzzy match with details with no data', () => {
    const result = service.fuzzyMatchGenesWithDetails(['GAPDH', 'ACTB']);
    expect(result.matched).toEqual([]);
    expect(result.unmatched).toEqual(['GAPDH', 'ACTB']);
  });

  it('should return empty array for accession ID search with no data loaded', () => {
    const results = service.searchAccessionIds('P04', 10);
    expect(results).toEqual([]);
  });

  it('should return empty array for fuzzy match accession IDs with no data loaded', () => {
    const result = service.fuzzyMatchAccessionIds(['P04406', 'P60709']);
    expect(result).toEqual([]);
  });

  it('should return empty matched and unmatched for fuzzy match accession IDs with details with no data', () => {
    const result = service.fuzzyMatchAccessionIdsWithDetails(['P04406', 'P60709']);
    expect(result.matched).toEqual([]);
    expect(result.unmatched).toEqual(['P04406', 'P60709']);
  });

  it('should return undefined for getProteinByAccessionId with no data loaded', () => {
    const protein = service.getProteinByAccessionId('P04406');
    expect(protein).toBeUndefined();
  });

  it('should return empty array for getBarChartDataForAccessionId with unknown ID', () => {
    const data = service.getBarChartDataForAccessionId('Unknown', ['A549']);
    expect(data).toEqual([]);
  });
});
