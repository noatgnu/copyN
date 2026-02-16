import { Injectable, signal, computed } from '@angular/core';
import * as Papa from 'papaparse';
import { ProteinData, ScatterDataPoint, BarChartData } from '../interfaces/protein-data';

@Injectable({
  providedIn: 'root',
})
export class DataService {
  private readonly proteinData = signal<ProteinData[]>([]);
  private readonly cellLines = signal<string[]>([]);
  private readonly isLoading = signal<boolean>(false);
  private readonly error = signal<string | null>(null);

  readonly data = this.proteinData.asReadonly();
  readonly availableCellLines = this.cellLines.asReadonly();
  readonly loading = this.isLoading.asReadonly();
  readonly errorMessage = this.error.asReadonly();

  readonly geneList = computed(() => {
    const genes = this.proteinData().map(p => p.geneNames).filter(g => g && g.trim() !== '');
    return [...new Set(genes)].sort();
  });

  readonly accessionList = computed(() => {
    const accessions = this.proteinData().map(p => p.proteinGroup).filter(a => a && a.trim() !== '');
    return [...new Set(accessions)].sort();
  });

  private readonly geneAliasIndex = computed(() => {
    const index = new Map<string, string>();
    for (const protein of this.proteinData()) {
      const primaryName = protein.geneNames;
      const aliases = this.extractAllAliases(primaryName);
      for (const alias of aliases) {
        index.set(alias.toUpperCase(), primaryName);
      }
    }
    return index;
  });

  private readonly accessionIndex = computed(() => {
    const index = new Map<string, string>();
    for (const protein of this.proteinData()) {
      const primaryGeneName = protein.geneNames;
      const accessions = this.extractAllAccessions(protein.proteinGroup);
      for (const accession of accessions) {
        index.set(accession.toUpperCase(), primaryGeneName);
      }
    }
    return index;
  });

  async loadData(): Promise<void> {
    if (this.proteinData().length > 0) {
      return;
    }

    this.isLoading.set(true);
    this.error.set(null);

    try {
      const response = await fetch('assets/Copy of 28 cell line_proteomics copy number data.csv');
      const csvText = await response.text();
      this.parseCSV(csvText);
    } catch (err) {
      this.error.set('Failed to load data');
    } finally {
      this.isLoading.set(false);
    }
  }

  private parseCSV(csvText: string): void {
    const result = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
    });

    const headers = result.meta.fields || [];
    const cellLineColumns = headers.filter(h => h.startsWith('N: Copy number'));
    const extractedCellLines = cellLineColumns.map(col => this.extractCellLineName(col));
    this.cellLines.set(extractedCellLines);

    const proteins: ProteinData[] = [];

    for (const row of result.data as Record<string, string>[]) {
      const copyNumbers = new Map<string, number>();

      for (let i = 0; i < cellLineColumns.length; i++) {
        const col = cellLineColumns[i];
        const cellLine = extractedCellLines[i];
        const value = parseFloat(row[col]);
        if (!isNaN(value) && value > 0) {
          copyNumbers.set(cellLine, value);
        }
      }

      if (copyNumbers.size > 0) {
        proteins.push({
          proteinGroup: row['T: Protein.Group'] || '',
          geneNames: row['T: Gene Names'] || '',
          proteinNames: row['T: Protein names'] || '',
          isHistone: row['C: Histones'] === '+',
          mass: parseFloat(row['N: Mass']) || 0,
          copyNumbers,
        });
      }
    }

    this.proteinData.set(proteins);
  }

  private extractCellLineName(columnName: string): string {
    let name = columnName.replace('N: Copy number', '').replace('.raw', '').trim();
    if (name.startsWith('-')) {
      name = name.substring(1);
    }
    if (name.startsWith(' ')) {
      name = name.substring(1);
    }
    const pathMatch = name.match(/\\([^\\]+)$/);
    if (pathMatch) {
      name = pathMatch[1].replace('.raw', '').replace('GS-', '').replace(/\d+_\d+_/, '');
    }
    return name.trim();
  }

  private extractAllAliases(geneNames: string): string[] {
    const aliases: string[] = [];
    const parts = geneNames.split(/[;\s]+/).map(p => p.trim()).filter(p => p.length > 0);
    for (const part of parts) {
      aliases.push(part);
    }
    return aliases;
  }

  private extractAllAccessions(proteinGroup: string): string[] {
    const accessions: string[] = [];
    const parts = proteinGroup.split(/[;\s]+/).map(p => p.trim()).filter(p => p.length > 0);
    for (const part of parts) {
      accessions.push(part);
    }
    return accessions;
  }

  fuzzyMatchGenes(filterGenes: string[]): string[] {
    const matchedGenes: Set<string> = new Set();
    const index = this.geneAliasIndex();

    for (const filterGene of filterGenes) {
      const upperGene = filterGene.trim().toUpperCase();
      if (!upperGene) continue;

      const exactMatch = index.get(upperGene);
      if (exactMatch) {
        const primaryAlias = this.extractAllAliases(exactMatch)[0];
        if (primaryAlias) {
          matchedGenes.add(primaryAlias);
        }
        continue;
      }

      for (const [alias, primaryName] of index.entries()) {
        if (alias.includes(upperGene) || upperGene.includes(alias)) {
          const primaryAlias = this.extractAllAliases(primaryName)[0];
          if (primaryAlias) {
            matchedGenes.add(primaryAlias);
          }
          break;
        }
      }
    }

    return Array.from(matchedGenes);
  }

  fuzzyMatchGenesWithDetails(filterGenes: string[]): { matched: string[]; unmatched: string[] } {
    const matched: Set<string> = new Set();
    const unmatched: string[] = [];
    const index = this.geneAliasIndex();

    for (const filterGene of filterGenes) {
      const upperGene = filterGene.trim().toUpperCase();
      if (!upperGene) continue;

      let found = false;

      const exactMatch = index.get(upperGene);
      if (exactMatch) {
        const primaryAlias = this.extractAllAliases(exactMatch)[0];
        if (primaryAlias) {
          matched.add(primaryAlias);
          found = true;
        }
      }

      if (!found) {
        for (const [alias, primaryName] of index.entries()) {
          if (alias.includes(upperGene) || upperGene.includes(alias)) {
            const primaryAlias = this.extractAllAliases(primaryName)[0];
            if (primaryAlias) {
              matched.add(primaryAlias);
              found = true;
            }
            break;
          }
        }
      }

      if (!found) {
        unmatched.push(filterGene);
      }
    }

    return { matched: Array.from(matched), unmatched };
  }

  fuzzyMatchAccessionIds(filterAccessions: string[]): string[] {
    const matchedGenes: Set<string> = new Set();
    const index = this.accessionIndex();

    for (const filterAccession of filterAccessions) {
      const upperAccession = filterAccession.trim().toUpperCase();
      if (!upperAccession) continue;

      const exactMatch = index.get(upperAccession);
      if (exactMatch) {
        const primaryAlias = this.extractAllAliases(exactMatch)[0];
        if (primaryAlias) {
          matchedGenes.add(primaryAlias);
        }
        continue;
      }

      for (const [accession, primaryName] of index.entries()) {
        if (accession.includes(upperAccession) || upperAccession.includes(accession)) {
          const primaryAlias = this.extractAllAliases(primaryName)[0];
          if (primaryAlias) {
            matchedGenes.add(primaryAlias);
          }
          break;
        }
      }
    }

    return Array.from(matchedGenes);
  }

  fuzzyMatchAccessionIdsWithDetails(filterAccessions: string[]): { matched: string[]; unmatched: string[] } {
    const matched: Set<string> = new Set();
    const unmatched: string[] = [];
    const index = this.accessionIndex();

    for (const filterAccession of filterAccessions) {
      const upperAccession = filterAccession.trim().toUpperCase();
      if (!upperAccession) continue;

      let found = false;

      const exactMatch = index.get(upperAccession);
      if (exactMatch) {
        const primaryAlias = this.extractAllAliases(exactMatch)[0];
        if (primaryAlias) {
          matched.add(primaryAlias);
          found = true;
        }
      }

      if (!found) {
        for (const [accession, primaryName] of index.entries()) {
          if (accession.includes(upperAccession) || upperAccession.includes(accession)) {
            const primaryAlias = this.extractAllAliases(primaryName)[0];
            if (primaryAlias) {
              matched.add(primaryAlias);
              found = true;
            }
            break;
          }
        }
      }

      if (!found) {
        unmatched.push(filterAccession);
      }
    }

    return { matched: Array.from(matched), unmatched };
  }

  getScatterDataForCellLine(cellLine: string): ScatterDataPoint[] {
    const proteins = this.proteinData();
    const dataPoints: { geneName: string; copyNumber: number }[] = [];

    for (const protein of proteins) {
      const copyNumber = protein.copyNumbers.get(cellLine);
      if (copyNumber && copyNumber > 0) {
        dataPoints.push({
          geneName: protein.geneNames,
          copyNumber,
        });
      }
    }

    dataPoints.sort((a, b) => b.copyNumber - a.copyNumber);

    return dataPoints.map((point, index) => ({
      x: index + 1,
      y: Math.log10(point.copyNumber),
      geneName: point.geneName,
      copyNumber: point.copyNumber,
    }));
  }

  getBarChartDataForGene(geneName: string, cellLines: string[]): BarChartData[] {
    const proteins = this.proteinData();
    const upperGeneName = geneName.toUpperCase();

    const protein = proteins.find(p => {
      const aliases = this.extractAllAliases(p.geneNames).map(a => a.toUpperCase());
      return aliases.some(alias => alias === upperGeneName || alias.includes(upperGeneName) || upperGeneName.includes(alias));
    });

    if (!protein) {
      return [];
    }

    const result: BarChartData[] = [];
    for (const cellLine of cellLines) {
      const copyNumber = protein.copyNumbers.get(cellLine);
      if (copyNumber && copyNumber > 0) {
        result.push({
          cellLine,
          copyNumber,
          geneName: protein.geneNames,
        });
      }
    }

    return result;
  }

  searchGenes(query: string, limit: number = 10): string[] {
    if (!query || query.length < 2) {
      return [];
    }

    const upperQuery = query.toUpperCase();
    const genes = this.geneList();

    return genes
      .filter(gene => gene.toUpperCase().includes(upperQuery))
      .slice(0, limit);
  }

  searchAccessionIds(query: string, limit: number = 10): string[] {
    if (!query || query.length < 2) {
      return [];
    }

    const upperQuery = query.toUpperCase();
    const accessions = this.accessionList();

    return accessions
      .filter(accession => accession.toUpperCase().includes(upperQuery))
      .slice(0, limit);
  }

  getProteinByAccessionId(accessionId: string): ProteinData | undefined {
    const upperAccession = accessionId.toUpperCase();
    return this.proteinData().find(p => {
      const accessions = this.extractAllAccessions(p.proteinGroup).map(a => a.toUpperCase());
      return accessions.some(acc => acc === upperAccession || acc.includes(upperAccession) || upperAccession.includes(acc));
    });
  }

  getBarChartDataForAccessionId(accessionId: string, cellLines: string[]): BarChartData[] {
    const protein = this.getProteinByAccessionId(accessionId);

    if (!protein) {
      return [];
    }

    const result: BarChartData[] = [];
    for (const cellLine of cellLines) {
      const copyNumber = protein.copyNumbers.get(cellLine);
      if (copyNumber && copyNumber > 0) {
        result.push({
          cellLine,
          copyNumber,
          geneName: protein.geneNames,
        });
      }
    }

    return result;
  }

  getProteinByGeneName(geneName: string): ProteinData | undefined {
    const upperGeneName = geneName.toUpperCase();
    return this.proteinData().find(p => {
      const aliases = this.extractAllAliases(p.geneNames).map(a => a.toUpperCase());
      return aliases.some(alias => alias === upperGeneName || alias.includes(upperGeneName) || upperGeneName.includes(alias));
    });
  }
}
