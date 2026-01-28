import { Instance, Instances } from '@react-three/drei';
import React from 'react';
import { InstancedModel } from 'src/models/InstancedModel';
import { useStore } from 'src/stores/common';
import * as Selector from 'src/stores/selector';

interface InstancedFoundationsProps {
  foundations: InstancedModel[];
}

const InstancedFoundations = ({ foundations }: InstancedFoundationsProps) => {
  const shadowEnabled = useStore(Selector.viewState.shadowEnabled);

  console.log('instanced roads', foundations);
  return (
    <group name="Cuboid Array">
      <Instances limit={1000} castShadow={shadowEnabled} receiveShadow={shadowEnabled}>
        <boxGeometry />
        <meshStandardMaterial />

        {foundations.map((model) => {
          const { id, cx, cy, cz = 0, lx = 1, ly = 1, lz = 1, rotation = [0, 0, 0] } = model;

          return (
            <Instance
              key={id}
              position={[cx, cy, cz]}
              scale={[lx, ly, lz]}
              rotation={[0, 0, rotation[2]]}
              color={'grey'}
            />
          );
        })}
      </Instances>
    </group>
  );
};

export default React.memo(InstancedFoundations);
