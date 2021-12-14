/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, { useMemo, useRef, useState } from 'react';
import { Box, Sphere } from '@react-three/drei';
import { Euler, Mesh, Vector3 } from 'three';
import { useStore } from '../stores/common';
import * as Selector from '../stores/selector';
import { SensorModel } from '../models/SensorModel';
import { useThree } from '@react-three/fiber';
import {
  HALF_PI,
  HIGHLIGHT_HANDLE_COLOR,
  MOVE_HANDLE_RADIUS,
  UNIT_VECTOR_NEG_X,
  UNIT_VECTOR_NEG_Y,
  UNIT_VECTOR_POS_X,
  UNIT_VECTOR_POS_Y,
  UNIT_VECTOR_POS_Z,
} from '../constants';
import { ActionType, MoveHandleType, ObjectType } from '../types';
import { Util } from '../Util';
import Wireframe from '../components/wireframe';
import i18n from '../i18n/i18n';

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
  parentId,
  light = true,
  heatFlux = false,
}: SensorModel) => {
  const setCommonStore = useStore(Selector.set);
  const language = useStore(Selector.language);
  const shadowEnabled = useStore(Selector.viewState.shadowEnabled);
  const getElementById = useStore(Selector.getElementById);
  const selectMe = useStore(Selector.selectMe);

  const {
    gl: { domElement },
  } = useThree();
  const [hovered, setHovered] = useState(false);
  const baseRef = useRef<Mesh>();
  const handleRef = useRef<Mesh>();

  const lang = { lng: language };

  if (parentId) {
    const p = getElementById(parentId);
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
            v.applyAxisAngle(UNIT_VECTOR_POS_Z, rotation[2]);
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
            v.applyAxisAngle(UNIT_VECTOR_POS_Z, rotation[2]);
            cx = p.cx + v.x;
            cy = p.cy + v.y;
            cz = p.cz + v.z;
          }
          break;
      }
    }
  }
  const hz = lz / 2;
  const sensorModel = getElementById(id) as SensorModel;

  const euler = useMemo(() => {
    const v = new Vector3().fromArray(normal);
    if (Util.isSame(v, UNIT_VECTOR_POS_Z)) {
      // top face in model coordinate system
      return new Euler(0, 0, rotation[2]);
    } else if (Util.isSame(v, UNIT_VECTOR_POS_X)) {
      // east face in model coordinate system
      return new Euler(0, HALF_PI, rotation[2], 'ZXY');
    } else if (Util.isSame(v, UNIT_VECTOR_NEG_X)) {
      // west face in model coordinate system
      return new Euler(0, -HALF_PI, rotation[2], 'ZXY');
    } else if (Util.isSame(v, UNIT_VECTOR_POS_Y)) {
      // south face in the model coordinate system
      return new Euler(-HALF_PI, 0, rotation[2], 'ZXY');
    } else if (Util.isSame(v, UNIT_VECTOR_NEG_Y)) {
      // north face in the model coordinate system
      return new Euler(HALF_PI, 0, rotation[2], 'ZXY');
    }
    return new Euler(0, 0, rotation[2]);
  }, [normal, rotation]);

  return (
    <group name={'Sensor Group ' + id} rotation={euler} position={[cx, cy, cz + hz]}>
      {/* draw rectangle (too small to cast shadow) */}
      <Box
        receiveShadow={shadowEnabled}
        uuid={id}
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
            if (e.intersections.length > 0) {
              const intersected = e.intersections[0].object === baseRef.current;
              if (intersected) {
                state.contextMenuObjectType = ObjectType.Sensor;
              }
            }
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
        onPointerOut={() => {
          setHovered(false);
          domElement.style.cursor = 'default';
        }}
      >
        <meshStandardMaterial attach="material" color={sensorModel?.lit ? HIGHLIGHT_HANDLE_COLOR : color} />
      </Box>

      {/* wireFrame */}
      {!selected && <Wireframe hx={lx / 2} hy={ly / 2} hz={lz / 2} />}

      {/* draw handle */}
      {selected && (
        <Sphere
          ref={handleRef}
          position={new Vector3(0, 0, 0)}
          args={[MOVE_HANDLE_RADIUS, 6, 6]}
          name={MoveHandleType.Default}
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
          text={
            (sensorModel?.label ? sensorModel.label : i18n.t('shared.SensorElement', lang)) +
            (sensorModel.locked ? ' (' + i18n.t('shared.ElementLocked', lang) + ')' : '')
          }
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
