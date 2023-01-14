/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useRef } from 'react';
import { useStore } from './stores/common';
import * as Selector from './stores/selector';
import { ObjectType } from './types';
import { FoundationModel } from './models/FoundationModel';
import Foundation from './views/foundation';
import { SensorModel } from './models/SensorModel';
import Sensor from './views/sensor';
import { CuboidModel } from './models/CuboidModel';
import Cuboid from './views/cuboid';
import { HumanModel } from './models/HumanModel';
import Human from './views/human';
import { TreeModel } from './models/TreeModel';
import Tree from './views/tree';
import { SolarPanelModel } from './models/SolarPanelModel';
import { WallModel } from './models/WallModel';
import Wall from './views/wall/wall';
import RoofRenderer from './views/roof/roofRenderer';
import { RoofModel } from './models/RoofModel';
import Polygon from './views/polygon';
import { PolygonModel } from './models/PolygonModel';
import { Group } from 'three';
import { useRefStore } from './stores/commonRef';
import ParabolicTrough from './views/parabolicTrough';
import { ParabolicTroughModel } from './models/ParabolicTroughModel';
import ParabolicDish from './views/parabolicDish';
import { ParabolicDishModel } from './models/ParabolicDishModel';
import FresnelReflector from './views/fresnelReflector';
import { FresnelReflectorModel } from './models/FresnelReflectorModel';
import Heliostat from './views/heliostat';
import { HeliostatModel } from './models/HeliostatModel';
import SolarPanel from './views/solarPanel/solarPanel';
import Flower from './views/flower';
import { FlowerModel } from './models/FlowerModel';
import Light from './views/light';
import { LightModel } from './models/LightModel';
import WallRenderer from './views/wall/wallRenderer';

const ElementsRenderer: React.FC = () => {
  const elements = useStore(Selector.elements);

  const groupRef = useRef<Group>(null);

  useEffect(() => {
    if (groupRef) {
      useRefStore.setState((state) => {
        state.contentRef = groupRef;
      });
    }
  }, []);

  useEffect(() => {
    if (useStore.getState().loadingFile) {
      useStore.getState().set((state) => {
        state.loadingFile = false;
      });
    }
  });

  // console.log(groupRef)
  // console.log(elements);
  console.debug(elements);

  return (
    <group ref={groupRef} name={'Content'}>
      {elements.map((e) => {
        switch (e.type) {
          case ObjectType.Foundation:
            return <Foundation key={e.id} {...(e as FoundationModel)} />;
          case ObjectType.Sensor:
            return <Sensor key={e.id} {...(e as SensorModel)} />;
          case ObjectType.Light:
            return <Light key={e.id} {...(e as LightModel)} />;
          case ObjectType.Cuboid:
            return <Cuboid key={e.id} {...(e as CuboidModel)} />;
          case ObjectType.Human:
            return <Human key={e.id} {...(e as HumanModel)} />;
          case ObjectType.Tree:
            return <Tree key={e.id} {...(e as TreeModel)} />;
          case ObjectType.Flower:
            return <Flower key={e.id} {...(e as FlowerModel)} />;
          case ObjectType.SolarPanel:
            switch ((e as SolarPanelModel).parentType) {
              case ObjectType.Roof:
              case ObjectType.Wall:
                return null;
              default:
                return <SolarPanel key={e.id} {...(e as SolarPanelModel)} />;
            }
          case ObjectType.ParabolicDish:
            return <ParabolicDish key={e.id} {...(e as ParabolicDishModel)} />;
          case ObjectType.ParabolicTrough:
            return <ParabolicTrough key={e.id} {...(e as ParabolicTroughModel)} />;
          case ObjectType.FresnelReflector:
            return <FresnelReflector key={e.id} {...(e as FresnelReflectorModel)} />;
          case ObjectType.Heliostat:
            return <Heliostat key={e.id} {...(e as HeliostatModel)} />;
          case ObjectType.Wall:
            return <WallRenderer key={e.id} {...(e as WallModel)} />;
          case ObjectType.Roof:
            return <RoofRenderer key={e.id} {...(e as RoofModel)} />;
          case ObjectType.Polygon:
            return <Polygon key={e.id} {...(e as PolygonModel)} />;
          default:
            if (e.id) return <React.Fragment key={e.id} />;
        }
      })}
    </group>
  );
};

export default React.memo(ElementsRenderer);
