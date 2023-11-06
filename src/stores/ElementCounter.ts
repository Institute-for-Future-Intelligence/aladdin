/*
 * @Copyright 2022-2023. Institute for Future Intelligence, Inc.
 */

export class ElementCounter {
  lockedCount: number = 0;
  unlockedCount: number = 0;
  foundationCount: number = 0;
  cuboidCount: number = 0;
  wallCount: number = 0;
  windowCount: number = 0;
  doorCount: number = 0;
  humanCount: number = 0;
  treeCount: number = 0;
  flowerCount: number = 0;
  polygonCount: number = 0;
  sensorCount: number = 0;
  insideLightCount: number = 0;
  outsideLightCount: number = 0;
  solarPanelCount: number = 0;
  solarPanelModuleCount: number = 0;
  parabolicDishCount: number = 0;
  parabolicTroughCount: number = 0;
  fresnelReflectorCount: number = 0;
  heliostatCount: number = 0;
  solarUpdraftTowerCount: number = 0;
  windTurbineCount: number = 0;

  gotSome() {
    return (
      this.foundationCount > 0 ||
      this.cuboidCount > 0 ||
      this.wallCount > 0 ||
      this.windowCount > 0 ||
      this.doorCount > 0 ||
      this.humanCount > 0 ||
      this.treeCount > 0 ||
      this.flowerCount > 0 ||
      this.polygonCount > 0 ||
      this.sensorCount > 0 ||
      this.insideLightCount > 0 ||
      this.outsideLightCount > 0 ||
      this.solarPanelCount > 0 ||
      this.parabolicTroughCount > 0 ||
      this.parabolicDishCount > 0 ||
      this.fresnelReflectorCount > 0 ||
      this.heliostatCount > 0 ||
      this.solarUpdraftTowerCount > 0 ||
      this.windTurbineCount > 0
    );
  }
}
