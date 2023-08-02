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
import { GROUND_ID } from '../../constants';

export interface CuboidRendererProps {
  elements: ElementModel[];
  cuboidModel: CuboidModel;
}

export const CUBOID_WRAPPER_NAME = 'Cuboid Wrapper';

export const CUBOID_STACKABLE_CHILD = 'Cuboid Stackable Child';

const CuboidRenderer = ({ elements, cuboidModel }: CuboidRendererProps) => {
  const { id, parentId, cx, cy, lz, rotation, selected, locked } = cuboidModel;

  const groupMasterId = useStore(Selector.groupMasterId);

  const { baseGroupSet, childCuboidSet, groupMasterDimension, groupMasterPosition, groupMasterRotation } =
    useGroupMaster(cuboidModel, groupMasterId);

  const hz = lz / 2;
  const showGroupMaster = !!(
    parentId === GROUND_ID &&
    !locked &&
    groupMasterId === id &&
    cuboidModel &&
    groupMasterDimension
  );

  const isStackableChild = (e: ElementModel) => isStackableModel(e) && e.parentId === cuboidModel.id;

  return (
    <>
      <group name={CUBOID_WRAPPER_NAME} position={[cx, cy, hz]} rotation={[0, 0, rotation[2]]}>
        <Cuboid {...cuboidModel} />

        {elements.map((e) => {
          if (isStackableChild(e)) {
            return (
              <group key={e.id} name={CUBOID_STACKABLE_CHILD} position={[0, 0, hz]}>
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

      {showGroupMaster && (
        <GroupMaster
          baseGroupSet={baseGroupSet}
          childCuboidSet={childCuboidSet}
          initalPosition={groupMasterPosition}
          initalDimension={groupMasterDimension}
          initalRotation={groupMasterRotation}
        />
      )}
    </>
  );
};

export default CuboidRenderer;