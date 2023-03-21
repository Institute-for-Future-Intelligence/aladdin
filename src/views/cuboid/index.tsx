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
        <group name="Cuboid stackable child group" position={[0, 0, hz]}>
          {elements.map((e) => {
            if (isStackableChild(e)) {
              return <CuboidRenderer key={e.id} elements={elements} cuboidModel={e as CuboidModel} />;
            } else {
              return null;
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
