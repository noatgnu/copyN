export interface ProteinData {
  proteinGroup: string;
  geneNames: string;
  proteinNames: string;
  isHistone: boolean;
  mass: number;
  copyNumbers: Map<string, number>;
}

export interface CellLineData {
  cellLine: string;
  copyNumber: number;
  rank: number;
}

export interface ScatterDataPoint {
  x: number;
  y: number;
  geneName: string;
  copyNumber: number;
}

export interface BarChartData {
  cellLine: string;
  copyNumber: number;
  geneName: string;
}
