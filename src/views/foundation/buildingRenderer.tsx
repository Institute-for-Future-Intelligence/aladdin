/*
 * @Copyright 2021-2023. Institute for Future Intelligence, Inc.
 */

import React from 'react';
import { ElementModel } from 'src/models/ElementModel';
import { FoundationModel } from 'src/models/FoundationModel';
import { SolarPanelModel } from 'src/models/SolarPanelModel';
import { WindowModel } from 'src/models/WindowModel';
import { useStore } from 'src/stores/common';
import { ObjectType } from 'src/types';
import { shallow } from 'zustand/shallow';
import Window from '../window/window';
import WallRenderer from '../wall/wallRenderer';
import { WallModel } from 'src/models/WallModel';
import RoofRenderer from '../roof/roofRenderer';
import { RoofModel } from 'src/models/RoofModel';

export const BUILDING_GROUP_NAME = 'Building Group';

const BuildingRenderer = (foundationModel: FoundationModel) => {
  const { id, lx, ly, lz } = foundationModel;

  const isBuildingParts = (e: ElementModel) => {
    if (e.foundationId !== id) return false;
    return (
      e.type === ObjectType.Wall ||
      e.type === ObjectType.Roof ||
      (e.type === ObjectType.SolarPanel && (e as SolarPanelModel).parentType === ObjectType.Roof) ||
      (e.type === ObjectType.Window && (e as WindowModel).parentType === ObjectType.Roof)
    );
  };

  const buildingParts = useStore((state) => state.elements.filter(isBuildingParts), shallow);

  if (buildingParts.length === 0) return null;

  return (
    <group name={BUILDING_GROUP_NAME} position={[0, 0, lz / 2]}>
      {buildingParts.map((e) => {
        switch (e.type) {
          case ObjectType.Wall:
            return <WallRenderer key={e.id} wallModel={e as WallModel} foundationModel={foundationModel} />;
          case ObjectType.Roof:
            return <RoofRenderer key={e.id} roofModel={e as RoofModel} foundationModel={foundationModel} />;
          case ObjectType.Window:
            // rooftop windows
            return <Window key={e.id} {...(e as WindowModel)} cz={e.cz} />;
          default:
            return null;
        }
      })}
    </group>
  );
};

const areEuqal = (prev: FoundationModel, curr: FoundationModel) =>
  prev.lx === curr.lx && prev.ly === curr.ly && prev.lz === curr.lz && prev.rotation === curr.rotation;

export default React.memo(BuildingRenderer, areEuqal);
