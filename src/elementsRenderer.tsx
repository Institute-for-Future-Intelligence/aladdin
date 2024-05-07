/*
 * @Copyright 2021-2023. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useRef } from 'react';
import { useStore } from './stores/common';
import * as Selector from './stores/selector';
import { ObjectType } from './types';
import { FoundationModel } from './models/FoundationModel';
import Foundation from './views/foundation/foundation';
import { SensorModel } from './models/SensorModel';
import Sensor from './views/sensor';
import { CuboidModel } from './models/CuboidModel';
import { HumanModel } from './models/HumanModel';
import Human from './views/human';
import { TreeModel } from './models/TreeModel';
import Tree from './views/tree';
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
import Flower from './views/flower';
import { FlowerModel } from './models/FlowerModel';
import Light from './views/light';
import { LightModel } from './models/LightModel';
import CuboidRenderer from './views/cuboid';
import { GROUND_ID } from './constants';
import { EndWaiting } from './waiting';
import WindTurbine from './views/windTurbine';
import { WindTurbineModel } from './models/WindTurbineModel';

const ElementsRenderer: React.FC = () => {
  const elements = useStore(Selector.elements);

  const groupRef = useRef<Group>(null);

  useEffect(() => {
    if (groupRef) {
      useRefStore.setState({
        contentRef: groupRef,
      });
    }
  }, []);

  // console.log(groupRef);
  // console.log(elements);
  console.debug(elements);

  return (
    <group ref={groupRef} name={'Content'}>
      {elements.map((e) => {
        switch (e.type) {
          case ObjectType.Foundation:
            return <Foundation key={e.id} {...(e as FoundationModel)} />;
          case ObjectType.Sensor: {
            const sensor = e as SensorModel;
            if (sensor.parentType === ObjectType.Cuboid) {
              return null;
            }
            return <Sensor key={e.id} {...sensor} />;
          }
          case ObjectType.Light: {
            const light = e as LightModel;
            if (light.parentType === ObjectType.Cuboid) {
              return null;
            }
            return <Light key={e.id} {...light} />;
          }
          case ObjectType.Cuboid:
            // only base cuboid will be rendered here
            if (e.parentId !== GROUND_ID) return null;
            return <CuboidRenderer key={e.id} elements={elements} cuboidModel={e as CuboidModel} />;
          case ObjectType.Human:
            return <Human key={e.id} {...(e as HumanModel)} />;
          case ObjectType.Tree:
            return <Tree key={e.id} {...(e as TreeModel)} />;
          case ObjectType.Flower:
            return <Flower key={e.id} {...(e as FlowerModel)} />;
          case ObjectType.ParabolicDish:
            return <ParabolicDish key={e.id} {...(e as ParabolicDishModel)} />;
          case ObjectType.ParabolicTrough:
            return <ParabolicTrough key={e.id} {...(e as ParabolicTroughModel)} />;
          case ObjectType.FresnelReflector:
            return <FresnelReflector key={e.id} {...(e as FresnelReflectorModel)} />;
          case ObjectType.Heliostat:
            return <Heliostat key={e.id} {...(e as HeliostatModel)} />;
          case ObjectType.WindTurbine:
            return <WindTurbine key={e.id} {...(e as WindTurbineModel)} />;
          case ObjectType.Polygon:
            switch ((e as PolygonModel).parentType) {
              case ObjectType.Wall:
                return null;
              default:
                return <Polygon key={e.id} {...(e as PolygonModel)} />;
            }
          default:
            if (e.id) return <React.Fragment key={e.id} />;
        }
        return null;
      })}
      <EndWaiting />
      <ClearDeletedRoofIdSet />
    </group>
  );
};

// Couldn't find a good way to clear this set to avoid memory leak.
// This roof id set is used in all walls which shape needs to be changed by the deletion of the roof.
// So fter all the walls have used it their useEffect hooks, then we can clear it.
// And here is the last hook get called due to React hooks mechanism.
const ClearDeletedRoofIdSet = () => {
  const deletedRoofIdSet = useStore(Selector.deletedRoofIdSet);
  useEffect(() => {
    useStore.getState().set((state) => {
      state.deletedRoofIdSet.clear();
    });
  }, [deletedRoofIdSet]);
  return null;
};

export default React.memo(ElementsRenderer);
