/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
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
  LOCKED_ELEMENT_SELECTION_COLOR,
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
  locked = false,
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

  // be sure to get the updated parent so that this memorized element can move with it
  const parent = useStore((state) => {
    for (const e of state.elements) {
      if (e.id === parentId) {
        return e;
      }
    }
  });

  if (parentId) {
    if (parent) {
      switch (parent.type) {
        case ObjectType.Foundation:
          cz = parent.cz + parent.lz / 2;
          if (Util.isZero(rotation[2])) {
            cx = parent.cx + cx * parent.lx;
            cy = parent.cy + cy * parent.ly;
          } else {
            // we must rotate the real length, not normalized length
            const v = new Vector3(cx * parent.lx, cy * parent.ly, 0);
            v.applyAxisAngle(UNIT_VECTOR_POS_Z, rotation[2]);
            cx = parent.cx + v.x;
            cy = parent.cy + v.y;
          }
          break;
        case ObjectType.Cuboid:
          if (Util.isZero(rotation[2])) {
            cx = parent.cx + cx * parent.lx;
            cy = parent.cy + cy * parent.ly;
            cz = parent.cz + cz * parent.lz;
          } else {
            // we must rotate the real length, not normalized length
            const v = new Vector3(cx * parent.lx, cy * parent.ly, cz * parent.lz);
            v.applyAxisAngle(UNIT_VECTOR_POS_Z, rotation[2]);
            cx = parent.cx + v.x;
            cy = parent.cy + v.y;
            cz = parent.cz + v.z;
          }
          break;
      }
    }
  }
  const hz = lz / 2;
  const sensorModel = getElementById(id) as SensorModel;

  const labelText = useMemo(() => {
    return (
      (sensorModel?.label ? sensorModel.label : i18n.t('shared.SensorElement', lang)) +
      (sensorModel.locked ? ' (' + i18n.t('shared.ElementLocked', lang) + ')' : '') +
      '\n' +
      i18n.t('word.Coordinates', lang) +
      ': (' +
      cx.toFixed(1) +
      ', ' +
      cy.toFixed(1) +
      ', ' +
      cz.toFixed(1) +
      ') ' +
      i18n.t('word.MeterAbbreviation', lang)
    );
  }, [sensorModel?.label, locked, language, cx, cy, cz]);

  const euler = useMemo(() => {
    const n = new Vector3().fromArray(normal);
    // east face in model coordinate system
    if (Util.isSame(n, UNIT_VECTOR_POS_X)) {
      return new Euler(0, HALF_PI, rotation[2], 'ZXY');
    }
    // west face in model coordinate system
    if (Util.isSame(n, UNIT_VECTOR_NEG_X)) {
      return new Euler(0, -HALF_PI, rotation[2], 'ZXY');
    }
    // south face in the model coordinate system
    if (Util.isSame(n, UNIT_VECTOR_POS_Y)) {
      return new Euler(-HALF_PI, 0, rotation[2], 'ZXY');
    }
    // north face in the model coordinate system
    if (Util.isSame(n, UNIT_VECTOR_NEG_Y)) {
      return new Euler(HALF_PI, 0, rotation[2], 'ZXY');
    }
    // top face in model coordinate system
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
      {!selected && <Wireframe hx={lx / 2} hy={ly / 2} hz={lz / 2} lineColor={lineColor} lineWidth={lineWidth} />}

      {/* highlight with a thick wireframe when it is selected but locked */}
      {selected && locked && (
        <Wireframe
          hx={lx / 2}
          hy={ly / 2}
          hz={lz / 2}
          lineColor={LOCKED_ELEMENT_SELECTION_COLOR}
          lineWidth={lineWidth * 10}
        />
      )}

      {/* draw handle */}
      {selected && !locked && (
        <Sphere
          ref={handleRef}
          position={new Vector3(0, 0, 0)}
          args={[MOVE_HANDLE_RADIUS, 6, 6, 0, Math.PI]}
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
          userData={{ unintersectable: true }}
          name={'Label'}
          text={labelText}
          fontSize={20}
          fontFace={'Times Roman'}
          textHeight={0.2}
          position={[0, 0, lz + 0.2]}
        />
      )}
    </group>
  );
};

export default React.memo(Sensor);