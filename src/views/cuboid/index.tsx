/*
 * @Copyright 2021-2023. Institute for Future Intelligence, Inc.
 */

import { CuboidModel } from 'src/models/CuboidModel';
import { ElementModel } from 'src/models/ElementModel';
import { isStackableModel } from 'src/models/Stackable';
import { Euler, Vector3 } from 'three';
import Cuboid from './cuboid';

export interface CuboidRendererProps {
  elements: ElementModel[];
  cuboidModel: CuboidModel;
}

const CuboidRenderer = ({ elements, cuboidModel }: CuboidRendererProps) => {
  const { cx, cy, cz, lz, rotation } = cuboidModel;

  const hz = lz / 2;

  const isStackableChild = (e: ElementModel) => isStackableModel(e) && e.parentId === cuboidModel.id;

  return (
    <group position={[cx, cy, hz]} rotation={[0, 0, rotation[2]]}>
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
  );
};

export default CuboidRenderer;
