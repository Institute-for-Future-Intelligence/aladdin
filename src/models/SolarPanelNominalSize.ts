/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

export class SolarPanelNominalSize {
  static instance = new SolarPanelNominalSize();

  private readonly n = 12;
  readonly nominalStrings = new Array<string>(this.n);
  readonly nominalWidths = new Array<number>(this.n);
  readonly nominalHeights = new Array<number>(this.n);
  readonly cellNx = new Array(this.n);
  readonly cellNy = new Array(this.n);

  private constructor() {
    // common residential size
    this.nominalWidths[0] = 0.99;
    this.nominalHeights[0] = 1.65;
    this.cellNx[0] = 6;
    this.cellNy[0] = 10;

    // common commercial size
    this.nominalWidths[1] = 0.99;
    this.nominalHeights[1] = 1.96;
    this.cellNx[1] = 6;
    this.cellNy[1] = 12;

    // SunPower E and X Series
    this.nominalWidths[2] = 1.05;
    this.nominalHeights[2] = 1.56;
    this.cellNx[2] = 8;
    this.cellNy[2] = 12;

    // ASP
    this.nominalWidths[3] = 1.31;
    this.nominalHeights[3] = 1.96;
    this.cellNx[3] = 8;
    this.cellNy[3] = 12;

    // SunPower E20 COM Series
    this.nominalWidths[4] = 1.07;
    this.nominalHeights[4] = 2.07;
    this.cellNx[4] = 8;
    this.cellNy[4] = 16;

    // First Solar Series 2, 4
    this.nominalWidths[5] = 0.6;
    this.nominalHeights[5] = 1.2;
    this.cellNx[5] = 10;
    this.cellNy[5] = 20;

    // First Solar Series 6
    this.nominalWidths[6] = 1.2;
    this.nominalHeights[6] = 2.0;
    this.cellNx[6] = 10;
    this.cellNy[6] = 20;

    // SunPower P17 Series
    this.nominalWidths[7] = 1.0;
    this.nominalHeights[7] = 2.07;
    this.cellNx[7] = 6;
    this.cellNy[7] = 12;

    // SunPower E20-245, E19-235, X20-250-BLK
    this.nominalWidths[8] = 0.8;
    this.nominalHeights[8] = 1.56;
    this.cellNx[8] = 6;
    this.cellNy[8] = 12;

    // Sharp NT-175UC1
    this.nominalWidths[9] = 0.83;
    this.nominalHeights[9] = 1.58;
    this.cellNx[9] = 6;
    this.cellNy[9] = 12;

    // YL165P-23b
    this.nominalWidths[10] = 0.99;
    this.nominalHeights[10] = 1.31;
    this.cellNx[10] = 6;
    this.cellNy[10] = 8;

    // YL205P-26b
    this.nominalWidths[11] = 0.99;
    this.nominalHeights[11] = 1.5;
    this.cellNx[11] = 6;
    this.cellNy[11] = 9;

    for (let i = 0; i < this.n; i++) {
      this.nominalStrings[i] =
        this.nominalWidths[i].toFixed(2) +
        'm × ' +
        this.nominalHeights[i].toFixed(2) +
        'm (' +
        this.cellNx[i] +
        ' × ' +
        this.cellNy[i] +
        ' cells)';
    }
  }
}
