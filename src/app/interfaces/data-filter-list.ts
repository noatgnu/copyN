export interface DataFilterList {
  id: number;
  name: string;
  data: string;
  default: boolean;
  category?: string;
}

export interface DataFilterListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: DataFilterList[];
}
