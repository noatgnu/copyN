import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PlotlyModule } from 'angular-plotly.js';
import { DataService } from '../../services/data';
import { Breadcrumb, BreadcrumbItem } from '../breadcrumb/breadcrumb';
import { BatchSelectModal, SearchMode, BatchSelectResult } from '../batch-select-modal/batch-select-modal';

const CELL_LINE_COLORS = [
  '#e6194b', '#3cb44b', '#ffe119', '#4363d8', '#f58231',
  '#911eb4', '#46f0f0', '#f032e6', '#bcf60c', '#fabebe',
  '#008080', '#e6beff', '#9a6324', '#fffac8', '#800000',
  '#aaffc3', '#808000', '#ffd8b1', '#000075', '#808080',
  '#000000', '#469990', '#dcbeff', '#9A6324', '#fffac8',
  '#800000', '#aaffc3', '#808000',
];

interface PlotTrace {
  x: number[];
  y: number[];
  mode: string;
  type: string;
  name: string;
  marker: {
    size: number;
    color: string;
    opacity?: number;
    symbol?: string;
  };
  text: string[];
  geneNames?: string[];
  textposition?: string;
  textfont?: {
    size: number;
    color: string;
  };
  hovertext?: string[];
  hoverinfo: string;
}

@Component({
  selector: 'app-scatter-plot',
  imports: [FormsModule, PlotlyModule, Breadcrumb, BatchSelectModal],
  templateUrl: './scatter-plot.html',
  styleUrl: './scatter-plot.css',
})
export class ScatterPlot implements OnInit {
  private readonly dataService = inject(DataService);

  readonly breadcrumbs: BreadcrumbItem[] = [
    { label: 'Home', path: '/home' },
    { label: 'Rank vs Copy Number' },
  ];

  readonly loading = this.dataService.loading;
  readonly cellLines = this.dataService.availableCellLines;

  readonly selectedCellLines = signal<string[]>([]);
  readonly searchQuery = signal<string>('');
  readonly highlightedGenes = signal<string[]>([]);
  readonly cellLineSearchQuery = signal<string>('');
  readonly searchMode = signal<SearchMode>('gene');

  readonly showBatchModal = signal<boolean>(false);

  readonly tablePage = signal<number>(1);
  readonly tablePageSize = 10;

  readonly selectedProteinsData = computed(() => {
    const selectedCellLines = this.selectedCellLines();
    const highlightedGenes = this.highlightedGenes();

    if (selectedCellLines.length === 0 || highlightedGenes.length === 0) {
      return [];
    }

    const result: { gene: string; cellLine: string; copyNumber: number; accession: string }[] = [];

    for (const geneName of highlightedGenes) {
      const protein = this.dataService.getProteinByGeneName(geneName);
      if (protein) {
        for (const cellLine of selectedCellLines) {
          const copyNumber = protein.copyNumbers.get(cellLine);
          if (copyNumber !== undefined) {
            result.push({
              gene: geneName,
              cellLine,
              copyNumber,
              accession: protein.proteinGroup.split(';')[0],
            });
          }
        }
      }
    }

    return result.sort((a, b) => b.copyNumber - a.copyNumber);
  });

  readonly paginatedTableData = computed(() => {
    const data = this.selectedProteinsData();
    const start = (this.tablePage() - 1) * this.tablePageSize;
    return data.slice(start, start + this.tablePageSize);
  });

  readonly tableTotalPages = computed(() => {
    return Math.ceil(this.selectedProteinsData().length / this.tablePageSize);
  });

  readonly tablePages = computed(() => {
    return Array.from({ length: this.tableTotalPages() }, (_, i) => i + 1);
  });

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

  readonly plotData = computed(() => {
    const selected = this.selectedCellLines();
    const highlighted = this.highlightedGenes();

    if (selected.length === 0) {
      return [];
    }

    const highlightedSet = new Set(highlighted.map(g => g.toUpperCase()));
    const traces: PlotTrace[] = [];
    const colorMap = this.cellLineColorMap();

    for (const cellLine of selected) {
      const scatterData = this.dataService.getScatterDataForCellLine(cellLine);
      const color = colorMap.get(cellLine) || '#6366f1';

      const normalPoints = scatterData.filter(p => {
        const genes = p.geneName.split(';').map(g => g.trim().toUpperCase());
        return !genes.some(g => highlightedSet.has(g));
      });

      traces.push({
        x: normalPoints.map(p => p.x),
        y: normalPoints.map(p => p.y),
        mode: 'markers',
        type: 'scatter',
        name: cellLine,
        marker: {
          size: 4,
          color,
          opacity: 0.7,
        },
        text: normalPoints.map(p => `${p.geneName}<br>Copy#: ${p.copyNumber.toFixed(0)}<br>Rank: ${p.x}`),
        geneNames: normalPoints.map(p => p.geneName.split(';')[0].trim()),
        hoverinfo: 'text',
      });
    }

    if (highlightedSet.size > 0) {
      for (const cellLine of selected) {
        const scatterData = this.dataService.getScatterDataForCellLine(cellLine);
        const color = colorMap.get(cellLine) || '#ef4444';

        const highlightedPoints = scatterData.filter(p => {
          const genes = p.geneName.split(';').map(g => g.trim().toUpperCase());
          return genes.some(g => highlightedSet.has(g));
        });

        if (highlightedPoints.length > 0) {
          traces.push({
            x: highlightedPoints.map(p => p.x),
            y: highlightedPoints.map(p => p.y),
            mode: 'markers+text',
            type: 'scatter',
            name: `${cellLine} (selected)`,
            marker: {
              size: 10,
              color,
              symbol: 'diamond',
            },
            text: highlightedPoints.map(p => p.geneName.split(';')[0]),
            geneNames: highlightedPoints.map(p => p.geneName.split(';')[0].trim()),
            textposition: 'top center',
            textfont: {
              size: 9,
              color,
            },
            hovertext: highlightedPoints.map(p => `${cellLine}<br>${p.geneName}<br>Copy#: ${p.copyNumber.toFixed(0)}<br>Rank: ${p.x}`),
            hoverinfo: 'text',
          });
        }
      }
    }

    return traces;
  });

  readonly plotLayout = computed(() => {
    return {
      title: {
        text: 'Copy # vs Protein Rank',
        font: { size: 16 },
      },
      xaxis: {
        title: { text: 'Rank', font: { size: 12 } },
        tickfont: { size: 10 },
      },
      yaxis: {
        title: { text: 'log10(Copy Number)', font: { size: 12 } },
        tickfont: { size: 10 },
      },
      margin: { l: 60, r: 20, t: 50, b: 50 },
      showlegend: true,
      legend: {
        x: 1,
        y: 1,
        xanchor: 'right',
        font: { size: 10 },
      },
      hovermode: 'closest',
    };
  });

  readonly plotConfig = {
    responsive: true,
    displayModeBar: true,
    modeBarButtonsToRemove: ['lasso2d', 'select2d'],
  };

  readonly hasData = computed(() => this.selectedCellLines().length > 0);

  ngOnInit(): void {
    this.dataService.loadData();
  }

  openBatchModal(): void {
    this.showBatchModal.set(true);
  }

  closeBatchModal(): void {
    this.showBatchModal.set(false);
  }

  onPlotClick(event: any): void {
    if (!event || !event.points || event.points.length === 0) {
      return;
    }

    const point = event.points[0];
    let geneName = '';
    
    if (point.data && point.data.geneNames && Array.isArray(point.data.geneNames)) {
      geneName = point.data.geneNames[point.pointIndex];
    } else {
      const hoverText = point.hovertext || point.text;
      if (hoverText) {
        const parts = hoverText.split('<br>');
        // Format 1: "CELL_LINE<br>GENE_NAME<br>Copy#: ..."
        // Format 2: "GENE_NAME<br>Copy#: ...<br>Rank: ..."
        
        let geneNamePart = parts[0];
        if (parts.length > 1 && parts[1].includes(';') || (parts.length > 2 && parts[2].includes('Copy#:'))) {
           // This looks like Format 1 where parts[0] is cell line and parts[1] is gene name
           geneNamePart = parts[1];
        }
        
        geneName = geneNamePart.split(/[;\s]/)[0].trim();
      }
    }

    if (geneName) {
      const current = this.highlightedGenes();
      if (!current.includes(geneName)) {
        this.highlightedGenes.set([...current, geneName]);
      }
    }
  }

  setTablePage(page: number): void {
    if (page >= 1 && page <= this.tableTotalPages()) {
      this.tablePage.set(page);
    }
  }

  applyBatchResult(result: BatchSelectResult): void {
    this.tablePage.set(1);
    let matchedGenes: string[];
    if (result.mode === 'gene') {
      matchedGenes = this.dataService.fuzzyMatchGenes(result.identifiers);
    } else {
      matchedGenes = this.dataService.fuzzyMatchAccessionIds(result.identifiers);
    }
    const current = this.highlightedGenes();
    const newGenes = matchedGenes.filter(g => !current.includes(g));
    this.highlightedGenes.set([...current, ...newGenes]);
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
    this.tablePage.set(1);
    this.selectedCellLines.update(lines => {
      if (lines.includes(cellLine)) {
        return lines.filter(l => l !== cellLine);
      }
      return [...lines, cellLine];
    });
  }

  selectSearchResult(value: string): void {
    this.tablePage.set(1);
    let geneName: string;
    if (this.searchMode() === 'gene') {
      geneName = value.split(/[;\s]/)[0];
    } else {
      const protein = this.dataService.getProteinByAccessionId(value);
      geneName = protein ? protein.geneNames.split(/[;\s]/)[0] : value;
    }
    const current = this.highlightedGenes();
    if (!current.includes(geneName)) {
      this.highlightedGenes.set([...current, geneName]);
    }
    this.searchQuery.set('');
  }

  removeGene(gene: string): void {
    this.tablePage.set(1);
    this.highlightedGenes.update(genes => genes.filter(g => g !== gene));
  }

  selectAllCellLines(): void {
    this.tablePage.set(1);
    this.selectedCellLines.set([...this.cellLines()]);
  }

  clearCellLineSelection(): void {
    this.tablePage.set(1);
    this.selectedCellLines.set([]);
  }

  resetSelection(): void {
    this.tablePage.set(1);
    this.highlightedGenes.set([]);
  }

  isCellLineSelected(cellLine: string): boolean {
    return this.selectedCellLines().includes(cellLine);
  }

  getCellLineColor(cellLine: string): string {
    return this.cellLineColorMap().get(cellLine) || '#6366f1';
  }
}
