export interface DataFilterList {
  id: number;
  name: string;
  data: string;
  default: boolean;
}

export interface DataFilterListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: DataFilterList[];
}

export interface DataFilterCategoryResponse {
  data: string[];
}

export interface DataFilterListItemResponse {
  data: DataFilterList;
}
