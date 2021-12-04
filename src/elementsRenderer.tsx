/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React from 'react';
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
import SolarPanel from './views/solarPanel';
import { WallModel } from './models/WallModel';
import Wall from './views/wall';
import Roof from './views/roof';
import { RoofModel } from './models/RoofModel';

const ElementsRenderer: React.FC = () => {
  const elements = useStore(Selector.elements);
  console.log(elements);
  return (
    <group name={'Content'}>
      {elements.map((e) => {
        switch (e.type) {
          case ObjectType.Foundation:
            return <Foundation key={e.id} {...(e as FoundationModel)} />;
          case ObjectType.Sensor:
            return <Sensor key={e.id} {...(e as SensorModel)} />;
          case ObjectType.Cuboid:
            return <Cuboid key={e.id} {...(e as CuboidModel)} />;
          case ObjectType.Human:
            return <Human key={e.id} {...(e as HumanModel)} />;
          case ObjectType.Tree:
            return <Tree key={e.id} {...(e as TreeModel)} />;
          case ObjectType.SolarPanel:
            return <SolarPanel key={e.id} {...(e as SolarPanelModel)} />;
          case ObjectType.Wall:
            return <Wall key={e.id} {...(e as WallModel)} />;
          case ObjectType.Roof:
            return <Roof key={e.id} {...(e as RoofModel)} />;
          default:
            return <></>;
        }
      })}
    </group>
  );
};

export default React.memo(ElementsRenderer);
