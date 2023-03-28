/*
 * @Copyright 2021-2023. Institute for Future Intelligence, Inc.
 */

import GroupMaster from 'src/components/groupMaster';
import { CuboidModel } from 'src/models/CuboidModel';
import { ElementModel } from 'src/models/ElementModel';
import { isStackableModel } from 'src/models/Stackable';
import { useStore } from 'src/stores/common';
import Cuboid from './cuboid';
import * as Selector from '../../stores/selector';
import { useGroupMaster } from '../hooks';
import { ObjectType } from 'src/types';
import SolarPanelOnCuboid from '../solarPanel/solarPanelOnCuboid';
import { SolarPanelModel } from 'src/models/SolarPanelModel';
import Sensor from '../sensor';
import { SensorModel } from 'src/models/SensorModel';
import Light from '../light';
import { LightModel } from 'src/models/LightModel';

export interface CuboidRendererProps {
  elements: ElementModel[];
  cuboidModel: CuboidModel;
}

const CuboidRenderer = ({ elements, cuboidModel }: CuboidRendererProps) => {
  const { id, cx, cy, lz, rotation, selected, locked } = cuboidModel;

  const groupMasterId = useStore(Selector.groupMasterId);

  const { baseGroupSet, groupMasterDimension, groupMasterPosition, groupMasterRotation } = useGroupMaster(
    cuboidModel,
    groupMasterId,
  );

  const hz = lz / 2;
  const showGroupMaster = selected && !locked && groupMasterId === id && cuboidModel && groupMasterDimension;

  const isStackableChild = (e: ElementModel) => isStackableModel(e) && e.parentId === cuboidModel.id;

  return (
    <>
      <group name="Cuboid Wrapper" position={[cx, cy, hz]} rotation={[0, 0, rotation[2]]}>
        <Cuboid {...cuboidModel} />

        <group name="Cuboid Child Group">
          {elements.map((e) => {
            if (isStackableChild(e)) {
              return (
                <group key={e.id} name="Cuboid Stackable Child" position={[0, 0, hz]}>
                  <CuboidRenderer elements={elements} cuboidModel={e as CuboidModel} />
                </group>
              );
            } else if (e.parentId === cuboidModel.id) {
              const { lx, ly, lz } = cuboidModel;
              switch (e.type) {
                case ObjectType.SolarPanel: {
                  return (
                    <SolarPanelOnCuboid
                      key={e.id}
                      {...(e as SolarPanelModel)}
                      cx={e.cx * lx}
                      cy={e.cy * ly}
                      cz={e.cz * lz}
                    />
                  );
                }
                case ObjectType.Sensor: {
                  return <Sensor key={e.id} {...(e as SensorModel)} cx={e.cx * lx} cy={e.cy * ly} cz={e.cz * lz} />;
                }
                case ObjectType.Light: {
                  return <Light key={e.id} {...(e as LightModel)} cx={e.cx * lx} cy={e.cy * ly} cz={e.cz * lz} />;
                }
                default:
                  return null;
              }
            }
          })}
        </group>
      </group>

      {showGroupMaster && (
        <GroupMaster
          baseGroupSet={baseGroupSet}
          initalPosition={groupMasterPosition}
          initalDimension={groupMasterDimension}
          initalRotation={groupMasterRotation}
        />
      )}
    </>
  );
};

export default CuboidRenderer;
