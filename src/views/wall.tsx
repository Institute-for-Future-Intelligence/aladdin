/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useState } from 'react';
import { Vector2, Vector3 } from 'three';
import { Box } from '@react-three/drei';

import { WallModel } from 'src/models/WallModel';
import { useStore } from 'src/stores/common';
import { Util } from 'src/Util';

const Wall = ({
  id,
  cx,
  cy,
  lx = 1,
  ly = 0.25,
  lz = 4,
  relativeAngle,
  rotation = [0, 0, 0],
  parent,
  color = 'gray',
  lineColor = 'black',
  lineWidth = 0.1,
  locked = false,
  selected = false,
  startPoint,
  endPoint,
}: WallModel) => {
  const getElementById = useStore((state) => state.getElementById);

  const [absPosition, setAbsPosition] = useState<Vector3>();
  const [absAngle, setAbsAngle] = useState<number>();

  const p = getElementById(parent.id);

  useEffect(() => {
    if (p) {
      setAbsPosition(Util.wallAbsolutePosition(cx, cy, p));
      setAbsAngle(p.rotation[2] + relativeAngle);
    }
  }, [cx, cy, p?.cx, p?.cy, p?.cz, p?.rotation]);

  return (
    <>
      {absPosition && absAngle && (
        <group name={`Wall Group ${id}`} position={absPosition} rotation={[0, 0, absAngle]}>
          <Box name={'Wall'} args={[lx, ly, lz]}>
            <meshStandardMaterial color={color} />
          </Box>
        </group>
      )}
    </>
  );
};

export default Wall;
