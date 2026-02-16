import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PlotlyModule } from 'angular-plotly.js';
import { DataService } from '../../services/data';
import { Breadcrumb, BreadcrumbItem } from '../breadcrumb/breadcrumb';
import { BarChartData } from '../../interfaces/protein-data';
import { BatchSelectModal, SearchMode, BatchSelectResult } from '../batch-select-modal/batch-select-modal';

const CELL_LINE_COLORS = [
  '#e6194b', '#3cb44b', '#ffe119', '#4363d8', '#f58231',
  '#911eb4', '#46f0f0', '#f032e6', '#bcf60c', '#fabebe',
  '#008080', '#e6beff', '#9a6324', '#fffac8', '#800000',
  '#aaffc3', '#808000', '#ffd8b1', '#000075', '#808080',
  '#000000', '#469990', '#dcbeff', '#9A6324', '#fffac8',
  '#800000', '#aaffc3', '#808000',
];

@Component({
  selector: 'app-bar-chart',
  imports: [FormsModule, PlotlyModule, Breadcrumb, BatchSelectModal],
  templateUrl: './bar-chart.html',
  styleUrl: './bar-chart.css',
})
export class BarChart implements OnInit {
  private readonly dataService = inject(DataService);

  readonly breadcrumbs: BreadcrumbItem[] = [
    { label: 'Home', path: '/home' },
    { label: 'Copy Number Distribution' },
  ];

  readonly loading = this.dataService.loading;
  readonly cellLines = this.dataService.availableCellLines;

  readonly selectedCellLines = signal<string[]>([]);
  readonly searchQuery = signal<string>('');
  readonly selectedGenes = signal<string[]>([]);
  readonly cellLineSearchQuery = signal<string>('');
  readonly searchMode = signal<SearchMode>('gene');

  readonly showBatchModal = signal<boolean>(false);

  private readonly cellLineColorMap = computed(() => {
    const map = new Map<string, string>();
    this.cellLines().forEach((cl, idx) => {
      map.set(cl, CELL_LINE_COLORS[idx % CELL_LINE_COLORS.length]);
    });
    return map;
  });

  readonly searchSuggestions = computed(() => {
    const query = this.searchQuery();
    if (this.searchMode() === 'gene') {
      return this.dataService.searchGenes(query, 10);
    }
    return this.dataService.searchAccessionIds(query, 10);
  });

  readonly filteredCellLines = computed(() => {
    const query = this.cellLineSearchQuery().toLowerCase();
    const allCellLines = this.cellLines();
    if (!query) {
      return allCellLines;
    }
    return allCellLines.filter(cl => cl.toLowerCase().includes(query));
  });

  readonly charts = computed(() => {
    const genes = this.selectedGenes();
    const cellLines = this.selectedCellLines();
    const colorMap = this.cellLineColorMap();

    if (genes.length === 0 || cellLines.length === 0) {
      return [];
    }

    return genes.map(gene => {
      const data = this.dataService.getBarChartDataForGene(gene, cellLines);
      const sortedData = [...data].sort((a, b) => b.copyNumber - a.copyNumber);

      return {
        gene,
        data: [
          {
            x: sortedData.map(d => d.cellLine),
            y: sortedData.map(d => d.copyNumber),
            type: 'bar',
            marker: {
              color: sortedData.map(d => colorMap.get(d.cellLine) || '#6366f1'),
            },
            text: sortedData.map(d => d.copyNumber.toFixed(0)),
            textposition: 'outside',
            textfont: { size: 9 },
            hovertext: sortedData.map(d => `${d.cellLine}<br>${d.geneName}<br>Copy#: ${d.copyNumber.toFixed(0)}`),
            hoverinfo: 'text',
          },
        ],
        layout: {
          title: {
            text: `Copy Number: ${gene}`,
            font: { size: 14 },
          },
          xaxis: {
            title: { text: 'Cell Line', font: { size: 10 } },
            tickfont: { size: 8 },
            tickangle: -45,
          },
          yaxis: {
            title: { text: 'Copy Number', font: { size: 10 } },
            tickfont: { size: 9 },
          },
          margin: { l: 50, r: 20, t: 40, b: 80 },
          showlegend: false,
          hovermode: 'closest',
        }
      };
    });
  });

  readonly plotConfig = {
    responsive: true,
    displayModeBar: true,
    modeBarButtonsToRemove: ['lasso2d', 'select2d'],
  };

  readonly hasData = computed(() => this.charts().length > 0);

  ngOnInit(): void {
    this.dataService.loadData();
  }

  openBatchModal(): void {
    this.showBatchModal.set(true);
  }

  closeBatchModal(): void {
    this.showBatchModal.set(false);
  }

  applyBatchResult(result: BatchSelectResult): void {
    let matchedGenes: string[];
    if (result.mode === 'gene') {
      matchedGenes = this.dataService.fuzzyMatchGenes(result.identifiers);
    } else {
      matchedGenes = this.dataService.fuzzyMatchAccessionIds(result.identifiers);
    }
    const current = this.selectedGenes();
    const newGenes = matchedGenes.filter(g => !current.includes(g));
    this.selectedGenes.set([...current, ...newGenes]);
    this.showBatchModal.set(false);
  }

  onCellLineSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.cellLineSearchQuery.set(input.value);
  }

  onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
  }

  setSearchMode(mode: SearchMode): void {
    this.searchMode.set(mode);
    this.searchQuery.set('');
  }

  toggleCellLine(cellLine: string): void {
    this.selectedCellLines.update(lines => {
      if (lines.includes(cellLine)) {
        return lines.filter(l => l !== cellLine);
      }
      return [...lines, cellLine];
    });
  }

  selectSearchResult(value: string): void {
    let geneName: string;
    if (this.searchMode() === 'gene') {
      geneName = value.split(/[;\s]/)[0];
    } else {
      const protein = this.dataService.getProteinByAccessionId(value);
      geneName = protein ? protein.geneNames.split(/[;\s]/)[0] : value;
    }
    const current = this.selectedGenes();
    if (!current.includes(geneName)) {
      this.selectedGenes.set([...current, geneName]);
    }
    this.searchQuery.set('');
  }

  removeGene(gene: string): void {
    this.selectedGenes.update(genes => genes.filter(g => g !== gene));
  }

  selectAllCellLines(): void {
    this.selectedCellLines.set([...this.cellLines()]);
  }

  clearCellLineSelection(): void {
    this.selectedCellLines.set([]);
  }

  isCellLineSelected(cellLine: string): boolean {
    return this.selectedCellLines().includes(cellLine);
  }

  getCellLineColor(cellLine: string): string {
    return this.cellLineColorMap().get(cellLine) || '#6366f1';
  }
}
