import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApiService } from './api';

describe('ApiService', () => {
  let service: ApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have default base URL', () => {
    expect(service.getBaseUrl()).toBe('https://curtain-backend.omics.quest');
  });

  it('should allow setting base URL', () => {
    service.setBaseUrl('https://new-api.example.com/');
    expect(service.getBaseUrl()).toBe('https://new-api.example.com');
  });

  it('should parse filter list data correctly', () => {
    const data = 'GENE1\nGENE2\nGENE3';
    const result = service.parseFilterListData(data);
    expect(result).toEqual(['GENE1', 'GENE2', 'GENE3']);
  });

  it('should parse comma-separated filter list data', () => {
    const data = 'GENE1,GENE2,GENE3';
    const result = service.parseFilterListData(data);
    expect(result).toEqual(['GENE1', 'GENE2', 'GENE3']);
  });

  it('should handle empty strings in filter list data', () => {
    const data = 'GENE1\n\nGENE2\n';
    const result = service.parseFilterListData(data);
    expect(result).toEqual(['GENE1', 'GENE2']);
  });

  it('should fetch filter lists', () => {
    const mockResponse = {
      count: 2,
      next: null,
      previous: null,
      results: [
        { id: 1, name: 'Kinases', data: 'GENE1\nGENE2', default: true },
        { id: 2, name: 'PD genes', data: 'GENE3\nGENE4', default: true },
      ],
    };

    service.getFilterLists({ limit: 10 }).subscribe(lists => {
      expect(lists.length).toBe(2);
      expect(lists[0].name).toBe('Kinases');
    });

    const req = httpMock.expectOne(
      'https://curtain-backend.omics.quest/api/data_filter_list/?limit=10'
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });
});
