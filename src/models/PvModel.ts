/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

export interface PvModel {
  name: string;
  brand: string;
  cellType: string;
  efficiency: number;
  length: number;
  width: number;
  nominalLength: number;
  nominalWidth: number;
  thickness: number;
  m: number;
  n: number;
  pmax: number;
  vmpp: number;
  impp: number;
  voc: number;
  isc: number;
  pmaxTC: number;
  noct: number;
  weight: number;
  color: string;
  shadeTolerance: string;
}
