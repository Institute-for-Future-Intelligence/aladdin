/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

export class ElementCounter {
  wallCount: number = 0;
  windowCount: number = 0;
  doorCount: number = 0;
  humanCount: number = 0;
  treeCount: number = 0;
  polygonCount: number = 0;
  sensorCount: number = 0;
  solarPanelCount: number = 0;
  solarPanelModuleCount: number = 0;
  parabolicDishCount: number = 0;
  parabolicTroughCount: number = 0;
  fresnelReflectorCount: number = 0;
  heliostatCount: number = 0;

  gotSome() {
    return (
      this.wallCount > 0 ||
      this.windowCount > 0 ||
      this.doorCount > 0 ||
      this.humanCount > 0 ||
      this.treeCount > 0 ||
      this.polygonCount > 0 ||
      this.sensorCount > 0 ||
      this.solarPanelCount > 0 ||
      this.parabolicTroughCount > 0 ||
      this.parabolicDishCount > 0 ||
      this.fresnelReflectorCount > 0 ||
      this.heliostatCount > 0
    );
  }
}
