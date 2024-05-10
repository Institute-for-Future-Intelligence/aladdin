/*
 * @Copyright 2024. Institute for Future Intelligence, Inc.
 */

export enum FilterType {
  None = 0,
  Equal = 1,
  LessThan = 2,
  GreaterThan = 3,
  Between = 4,
}

export interface Filter {
  type: FilterType;
  variable: string;
  lowerBound?: number;
  upperBound?: number;
}
