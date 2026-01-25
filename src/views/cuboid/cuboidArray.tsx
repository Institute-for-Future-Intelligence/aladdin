/*
 * @Copyright 2021-2025. Institute for Future Intelligence, Inc.
 */

import React from 'react';
import { Instances, Instance } from '@react-three/drei';
import { CuboidModel } from 'src/models/CuboidModel';
import { useStore } from 'src/stores/common';
import * as Selector from 'src/stores/selector';

export interface CuboidArrayProps {
  cuboids: CuboidModel[];
}

const CuboidArray = ({ cuboids }: CuboidArrayProps) => {
  const shadowEnabled = useStore(Selector.viewState.shadowEnabled);

  console.log('cuboids', cuboids);
  return (
    <group name="Cuboid Array">
      <Instances limit={5000} castShadow={shadowEnabled} receiveShadow={shadowEnabled}>
        <boxGeometry />
        <meshStandardMaterial color={'grey'} />

        {cuboids.map((model) => {
          const { id, cx, cy, cz = 0, lx = 1, ly = 1, lz = 1, rotation = [0, 0, 0] } = model;

          return <Instance key={id} position={[cx, cy, cz]} scale={[lx, ly, lz]} rotation={[0, 0, rotation[2]]} />;
        })}
      </Instances>
    </group>
  );
};

export default React.memo(CuboidArray);
