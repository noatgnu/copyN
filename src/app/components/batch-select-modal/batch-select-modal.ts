import { Component, inject, signal, computed, output, OnInit, input, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api';
import { DataFilterList } from '../../interfaces/data-filter-list';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';

export type SearchMode = 'gene' | 'accession';

export interface BatchSelectResult {
  identifiers: string[];
  mode: SearchMode;
}

@Component({
  selector: 'app-batch-select-modal',
  imports: [FormsModule],
  templateUrl: './batch-select-modal.html',
  styleUrl: './batch-select-modal.css',
})
export class BatchSelectModal implements OnInit, OnDestroy {
  private readonly apiService = inject(ApiService);
  private readonly destroy$ = new Subject<void>();
  private readonly searchSubject = new Subject<string>();

  readonly initialSearchMode = input<SearchMode>('gene');

  readonly close = output<void>();
  readonly apply = output<BatchSelectResult>();

  readonly categories = signal<string[]>([]);
  readonly filterLists = signal<DataFilterList[]>([]);
  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  readonly selectedCategory = signal<string>('');
  readonly searchQuery = signal<string>('');
  readonly customList = signal<string>('');
  readonly activeTab = signal<'lists' | 'custom'>('lists');
  readonly searchMode = signal<SearchMode>('gene');

  readonly filteredLists = computed(() => {
    const lists = this.filterLists();
    return lists;
  });

  ngOnInit(): void {
    this.searchMode.set(this.initialSearchMode());
    this.loadCategories();
    this.loadFilterLists();

    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(query => {
      this.searchQuery.set(query);
      this.searchByCategory();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  setSearchMode(mode: SearchMode): void {
    this.searchMode.set(mode);
  }

  loadCategories(): void {
    this.apiService.getAllCategories().subscribe({
      next: (cats) => this.categories.set(cats),
      error: () => this.categories.set([]),
    });
  }

  loadFilterLists(): void {
    this.loading.set(true);
    this.error.set(null);
    this.apiService.getFilterLists().subscribe({
      next: (lists) => {
        this.filterLists.set(lists);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load filter lists');
        this.loading.set(false);
      },
    });
  }

  searchByCategory(): void {
    this.loading.set(true);
    this.error.set(null);
    const params: { categoryExact?: string; name?: string } = {};
    if (this.selectedCategory()) {
      params.categoryExact = this.selectedCategory();
    }
    if (this.searchQuery()) {
      params.name = this.searchQuery();
    }
    this.apiService.getFilterLists(params).subscribe({
      next: (lists) => {
        this.filterLists.set(lists);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to search filter lists');
        this.loading.set(false);
      },
    });
  }

  onCategoryChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.selectedCategory.set(select.value);
    this.searchByCategory();
  }

  onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchSubject.next(input.value);
  }

  onSearchSubmit(): void {
    this.searchByCategory();
  }

  onCustomListInput(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    this.customList.set(textarea.value);
  }

  selectFilterList(list: DataFilterList): void {
    const identifiers = this.apiService.parseFilterListData(list.data);
    this.apply.emit({ identifiers, mode: this.searchMode() });
  }

  applyCustomList(): void {
    const identifiers = this.apiService.parseFilterListData(this.customList());
    if (identifiers.length > 0) {
      this.apply.emit({ identifiers, mode: this.searchMode() });
    }
  }

  onClose(): void {
    this.close.emit();
  }

  setActiveTab(tab: 'lists' | 'custom'): void {
    this.activeTab.set(tab);
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.onClose();
    }
  }

  getItemCount(data: string): number {
    if (!data) return 0;
    return data.split(/[\n,;]/).filter(item => item.trim().length > 0).length;
  }
}
