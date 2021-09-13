/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Mesh, Vector3 } from 'three';
import { Box, Sphere } from '@react-three/drei';

import { ActionType } from 'src/types';
import { Util } from 'src/Util';
import { HIGHLIGHT_HANDLE_COLOR, RESIZE_HANDLE_COLOR } from '../constants';
import { useStore } from 'src/stores/common';
import { WallModel } from 'src/models/WallModel';
import WireFrame from 'src/components/wireFrame';

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
}: WallModel) => {
  const getElementById = useStore((state) => state.getElementById);
  const selectMe = useStore((state) => state.selectMe);

  const buildingWallID = useStore((state) => state.buildingWallID);

  const [wallAbsPosition, setWallAbsPosition] = useState<Vector3>();
  const [wallAbsAngle, setWallAbsAngle] = useState<number>();

  const baseRef = useRef<Mesh>();

  const handleSize = 0.2;

  const p = getElementById(parent.id);

  useEffect(() => {
    if (p) {
      setWallAbsPosition(Util.wallAbsolutePosition(cx, cy, p).setZ(lz / 2 + p.lz));
      setWallAbsAngle(p.rotation[2] + relativeAngle);
    }
  }, [cx, cy, p?.cx, p?.cy, p?.cz, p?.rotation]);

  return (
    <>
      {wallAbsPosition && wallAbsAngle !== undefined && (
        <group name={`Wall Group ${id}`} position={wallAbsPosition} rotation={[0, 0, wallAbsAngle]}>
          {/* wall body */}
          <Box
            name={'Wall'}
            ref={baseRef}
            args={[lx, ly, lz]}
            onPointerDown={(e) => {
              if (buildingWallID) return;
              selectMe(id, e, ActionType.Select);
            }}
            onPointerUp={(e) => {}}
          >
            <meshStandardMaterial color={color} />
          </Box>

          {/* handles */}
          {(selected || buildingWallID === id) && (
            <>
              <Sphere name={'Handle'} args={[handleSize]} position={[-lx / 2, 0, -lz / 2]} />
              <Sphere name={'Handle'} args={[handleSize]} position={[lx / 2, 0, -lz / 2]} />
              <Sphere name={'Handle'} args={[handleSize]} position={[-lx / 2, 0, lz / 2]} />
              <Sphere name={'Handle'} args={[handleSize]} position={[lx / 2, 0, lz / 2]} />
            </>
          )}

          {/* wireFrame */}
          {!selected && <WireFrame args={[lx, ly, lz]} />}
        </group>
      )}
    </>
  );
};

export default Wall;
