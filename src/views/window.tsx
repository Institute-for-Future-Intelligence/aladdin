/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useState } from 'react';
import { Box, Line, Plane } from '@react-three/drei';
import { WindowModel } from 'src/models/WindowModel';
import { DoubleSide, Vector3 } from 'three';
import { useStore } from 'src/stores/common';
import { WallModel } from 'src/models/WallModel';

const Window = ({ cx, cy, parentId }: WindowModel) => {
  const getElementById = useStore((state) => state.getElementById);

  const [absPostion, setAbsPostion] = useState<Vector3>(null!);

  // useEffect(() => {
  //   const wall = getElementById(parent.id);

  // }, [cx, cy, p.cx, p.cy, p.cz]);

  return (
    <group position={[cx, cy, 0]}>
      {/* <Plane args={[1.5, 1.5]} rotation={[Math.PI / 2, 0, 0]}>
        <meshBasicMaterial side={DoubleSide} color={'#477395'} opacity={0.5} transparent={true} />
      </Plane>
      <Line
        points={[
          [-0.75, 0, -0.75],
          [0.75, 0, -0.75],
        ]}
        linewidth={1}
      />
      <Line
        points={[
          [-0.75, 0, -0.75],
          [-0.75, 0, 0.75],
        ]}
        linewidth={1}
      />
      <Line
        points={[
          [0.75, 0, 0.75],
          [-0.75, 0, 0.75],
        ]}
        linewidth={1}
      />
      <Line
        points={[
          [0.75, 0, 0.75],
          [0.75, 0, -0.75],
        ]}
        linewidth={1}
      />
      <Line
        points={[
          [-0.75, 0, 0],
          [0.75, 0, 0],
        ]}
        linewidth={1}
        color={'white'}
      />
      <Line
        points={[
          [0, 0, -0.75],
          [0, 0, 0.75],
        ]}
        linewidth={1}
        color={'white'}
      /> */}
    </group>
  );
};

export default Window;
