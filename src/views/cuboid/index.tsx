/*
 * @Copyright 2021-2023. Institute for Future Intelligence, Inc.
 */

import { CuboidModel } from 'src/models/CuboidModel';
import { ElementModel } from 'src/models/ElementModel';
import { isStackableModel } from 'src/models/Stackable';
import Cuboid from './cuboid';
import { ObjectType } from 'src/types';
import SolarPanelOnCuboid from '../solarPanel/solarPanelOnCuboid';
import { SolarPanelModel } from 'src/models/SolarPanelModel';
import Sensor from '../sensor';
import { SensorModel } from 'src/models/SensorModel';
import Light from '../light';
import { LightModel } from 'src/models/LightModel';
import SolarPanelWrapper from '../solarPanel/solarPanelWrapper';

export interface CuboidRendererProps {
  elements: ElementModel[];
  cuboidModel: CuboidModel;
}

export const CUBOID_WRAPPER_NAME = 'Cuboid Wrapper';

export const CUBOID_STACKABLE_CHILD = 'Cuboid Stackable Child';

const CuboidRenderer = ({ elements, cuboidModel }: CuboidRendererProps) => {
  const { id, cx, cy, lx, ly, lz, rotation } = cuboidModel;

  const hz = lz / 2;

  const isStackableChild = (e: ElementModel) => isStackableModel(e) && e.parentId === id;

  return (
    <group
      name={CUBOID_WRAPPER_NAME}
      position={[cx, cy, hz]}
      rotation={[0, 0, rotation[2]]}
      userData={{ id: id, fId: id }}
    >
      <Cuboid {...cuboidModel} />
      <SolarPanelWrapper parentId={id} foundationId={id} wrapperType={ObjectType.Cuboid} plx={lx} ply={ly} plz={lz} />
      {elements.map((e) => {
        if (isStackableChild(e)) {
          return (
            <group key={e.id} name={CUBOID_STACKABLE_CHILD} position={[0, 0, hz]}>
              <CuboidRenderer elements={elements} cuboidModel={e as CuboidModel} />
            </group>
          );
        } else if (e.parentId === id) {
          const { lx, ly, lz } = cuboidModel;
          switch (e.type) {
            // case ObjectType.SolarPanel: {
            //   return (
            //     <SolarPanelOnCuboid
            //       key={e.id}
            //       {...(e as SolarPanelModel)}
            //       cx={e.cx * lx}
            //       cy={e.cy * ly}
            //       cz={e.cz * lz}
            //     />
            //   );
            // }
            case ObjectType.Sensor: {
              return <Sensor key={e.id} {...(e as SensorModel)} cx={e.cx * lx} cy={e.cy * ly} cz={e.cz * lz} />;
            }
            case ObjectType.Light: {
              return <Light key={e.id} {...(e as LightModel)} cx={e.cx * lx} cy={e.cy * ly} cz={e.cz * lz} />;
            }
            default:
              return null;
          }
        } else {
          return null;
        }
      })}
    </group>
  );
};

export default CuboidRenderer;
