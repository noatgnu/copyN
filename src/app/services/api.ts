import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { DataFilterList, DataFilterListResponse } from '../interfaces/data-filter-list';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = signal<string>('https://curtain-backend.omics.quest');

  setBaseUrl(url: string): void {
    this.baseUrl.set(url.replace(/\/$/, ''));
  }

  getBaseUrl(): string {
    return this.baseUrl();
  }

  getFilterLists(params?: {
    name?: string;
    category?: string;
    nameExact?: string;
    categoryExact?: string;
    limit?: number;
  }): Observable<DataFilterList[]> {
    let httpParams = new HttpParams();

    if (params?.name) {
      httpParams = httpParams.set('name', params.name);
    }
    if (params?.category) {
      httpParams = httpParams.set('category', params.category);
    }
    if (params?.nameExact) {
      httpParams = httpParams.set('name_exact', params.nameExact);
    }
    if (params?.categoryExact) {
      httpParams = httpParams.set('category_exact', params.categoryExact);
    }
    if (params?.limit) {
      httpParams = httpParams.set('limit', params.limit.toString());
    } else {
      httpParams = httpParams.set('limit', '100000000');
    }

    return this.http
      .get<DataFilterListResponse>(`${this.baseUrl()}/data_filter_list/`, { params: httpParams })
      .pipe(map(response => response.results));
  }

  getFilterListById(id: number): Observable<DataFilterList> {
    return this.http.get<DataFilterList>(`${this.baseUrl()}/data_filter_list/${id}/`);
  }

  getAllCategories(): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl()}/data_filter_list/get_all_category/`);
  }

  parseFilterListData(data: string): string[] {
    return data
      .replace(/\r/g, '')
      .split('\n')
      .flatMap(line => line.split(/[;,]/))
      .map(item => item.trim())
      .filter(item => item.length > 0);
  }
}
