/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, { useMemo, useRef, useState } from 'react';
import { Box, Line, Sphere } from '@react-three/drei';
import { Euler, Mesh, Vector3 } from 'three';
import { useStore } from '../stores/common';
import { SensorModel } from '../models/SensorModel';
import { ThreeEvent, useThree } from '@react-three/fiber';
import { HIGHLIGHT_HANDLE_COLOR, MOVE_HANDLE_RADIUS } from '../constants';
import { ActionType, ObjectType } from '../types';
import { Util } from '../Util';
import WireFrame from 'src/components/wireFrame';

const Sensor = ({
  id,
  cx,
  cy,
  cz,
  lx = 1,
  ly = 1,
  lz = 0.1,
  rotation = [0, 0, 0],
  normal = [0, 0, 1],
  color = 'white',
  lineColor = 'black',
  lineWidth = 0.1,
  selected = false,
  showLabel = false,
  parent,
  light = true,
  heatFlux = false,
}: SensorModel) => {
  const setCommonStore = useStore((state) => state.set);
  const shadowEnabled = useStore((state) => state.viewState.shadowEnabled);
  const getElementById = useStore((state) => state.getElementById);
  const selectMe = useStore((state) => state.selectMe);
  const {
    gl: { domElement },
  } = useThree();
  const [hovered, setHovered] = useState(false);
  const baseRef = useRef<Mesh>();
  const handleRef = useRef<Mesh>();

  if (parent) {
    const p = getElementById(parent.id);
    if (p) {
      switch (p.type) {
        case ObjectType.Foundation:
          cz = p.cz + p.lz / 2;
          if (Util.isZero(rotation[2])) {
            cx = p.cx + cx * p.lx;
            cy = p.cy + cy * p.ly;
          } else {
            // we must rotate the real length, not normalized length
            const v = new Vector3(cx * p.lx, cy * p.ly, 0);
            v.applyAxisAngle(Util.UNIT_VECTOR_POS_Z, rotation[2]);
            cx = p.cx + v.x;
            cy = p.cy + v.y;
          }
          break;
        case ObjectType.Cuboid:
          if (Util.isZero(rotation[2])) {
            cx = p.cx + cx * p.lx;
            cy = p.cy + cy * p.ly;
            cz = p.cz + cz * p.lz;
          } else {
            // we must rotate the real length, not normalized length
            const v = new Vector3(cx * p.lx, cy * p.ly, cz * p.lz);
            v.applyAxisAngle(Util.UNIT_VECTOR_POS_Z, rotation[2]);
            cx = p.cx + v.x;
            cy = p.cy + v.y;
            cz = p.cz + v.z;
          }
          break;
      }
    }
  }
  const hx = lx / 2;
  const hy = ly / 2;
  const hz = lz / 2;
  const positionLL = new Vector3(-hx, -hy, hz);
  const positionUL = new Vector3(-hx, hy, hz);
  const positionLR = new Vector3(hx, -hy, hz);
  const positionUR = new Vector3(hx, hy, hz);
  const element = getElementById(id);

  const euler = useMemo(() => {
    const v = new Vector3().fromArray(normal);
    if (Util.isSame(v, Util.UNIT_VECTOR_POS_Z)) {
      // top face in model coordinate system
      return new Euler(0, 0, rotation[2]);
    } else if (Util.isSame(v, Util.UNIT_VECTOR_POS_X)) {
      // east face in model coordinate system
      return new Euler(0, Util.HALF_PI, rotation[2], 'ZXY');
    } else if (Util.isSame(v, Util.UNIT_VECTOR_NEG_X)) {
      // west face in model coordinate system
      return new Euler(0, -Util.HALF_PI, rotation[2], 'ZXY');
    } else if (Util.isSame(v, Util.UNIT_VECTOR_POS_Y)) {
      // south face in the model coordinate system
      return new Euler(-Util.HALF_PI, 0, rotation[2], 'ZXY');
    } else if (Util.isSame(v, Util.UNIT_VECTOR_NEG_Y)) {
      // north face in the model coordinate system
      return new Euler(Util.HALF_PI, 0, rotation[2], 'ZXY');
    }
    return new Euler(0, 0, rotation[2]);
  }, [normal, rotation]);

  return (
    <group name={'Sensor Group ' + id} rotation={euler} position={[cx, cy, cz + hz]}>
      {/* draw rectangle (too small to cast shadow) */}
      <Box
        receiveShadow={shadowEnabled}
        uuid={id}
        userData={{ aabb: true }}
        ref={baseRef}
        args={[lx, ly, lz]}
        name={'Sensor'}
        onPointerDown={(e) => {
          if (e.button === 2) return; // ignore right-click
          selectMe(id, e, ActionType.Move);
        }}
        onContextMenu={(e) => {
          selectMe(id, e);
          setCommonStore((state) => {
            state.contextMenuObjectType = ObjectType.Sensor;
          });
        }}
        onPointerOver={(e) => {
          if (e.intersections.length > 0) {
            const intersected = e.intersections[0].object === baseRef.current;
            if (intersected) {
              setHovered(true);
              domElement.style.cursor = 'move';
            }
          }
        }}
        onPointerOut={(e) => {
          setHovered(false);
          domElement.style.cursor = 'default';
        }}
      >
        <meshStandardMaterial attach="material" color={element?.lit ? HIGHLIGHT_HANDLE_COLOR : color} />
      </Box>

      {/* wireFrame */}
      {!selected && <WireFrame args={[lx, ly, lz]} />}

      {/* draw handle */}
      {selected && (
        <Sphere
          ref={handleRef}
          position={new Vector3(0, 0, 0)}
          args={[MOVE_HANDLE_RADIUS, 6, 6]}
          name={'Handle'}
          onPointerDown={(e) => {
            selectMe(id, e, ActionType.Move);
          }}
        >
          <meshStandardMaterial attach="material" color={'orange'} />
        </Sphere>
      )}

      {(hovered || showLabel) && !selected && (
        <textSprite
          name={'Label'}
          text={element?.label ? element.label : 'Sensor'}
          fontSize={20}
          fontFace={'Times Roman'}
          textHeight={0.2}
          position={[0, 0, lz + 0.2]}
        />
      )}
    </group>
  );
};

// this one may not use React.memo as it needs to move with its parent.
// there may be a way to notify a memorized component when its parent changes
export default Sensor;
