import { Component, inject, signal, computed, output, OnInit, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api';
import { DataFilterList } from '../../interfaces/data-filter-list';

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
export class BatchSelectModal implements OnInit {
  private readonly apiService = inject(ApiService);

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
    const category = this.selectedCategory();
    const query = this.searchQuery().toLowerCase();

    return lists.filter(list => {
      const matchesCategory = !category || list.category === category;
      const matchesQuery = !query || list.name.toLowerCase().includes(query);
      return matchesCategory && matchesQuery;
    });
  });

  ngOnInit(): void {
    this.searchMode.set(this.initialSearchMode());
    this.loadCategories();
    this.loadFilterLists();
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
    this.apiService.getFilterLists({ limit: 10 }).subscribe({
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
    const params: { category?: string; name?: string; limit: number } = { limit: 10 };
    if (this.selectedCategory()) {
      params.category = this.selectedCategory();
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
    this.searchQuery.set(input.value);
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
}
