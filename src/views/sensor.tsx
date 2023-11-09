/*
 * @Copyright 2021-2023. Institute for Future Intelligence, Inc.
 */

import React, { useMemo, useRef, useState } from 'react';
import { Box, Cylinder, Sphere } from '@react-three/drei';
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
import { WallModel } from '../models/WallModel';
import { FoundationModel } from '../models/FoundationModel';
import { useRefStore } from 'src/stores/commonRef';
import { usePrimitiveStore } from 'src/stores/commonPrimitive';
import { getRotationFromNormal } from './solarPanel/solarPanelOnCuboid';
import { useSelected } from './hooks';

const Sensor = (sensorModel: SensorModel) => {
  let {
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
    locked = false,
    showLabel = false,
    parentId,
    foundationId,
    light = true,
    heatFlux = false,
  } = sensorModel;

  const setCommonStore = useStore(Selector.set);
  const language = useStore(Selector.language);
  const shadowEnabled = useStore(Selector.viewState.shadowEnabled);
  const selectMe = useStore(Selector.selectMe);
  const selected = useSelected(id);

  const {
    gl: { domElement },
  } = useThree();
  const [hovered, setHovered] = useState(false);
  const baseRef = useRef<Mesh>(null);
  const handleRef = useRef<Mesh>(null);

  const lang = useMemo(() => {
    return { lng: language };
  }, [language]);

  // be sure to get the updated parent so that this memorized element can move with it
  const parent = useStore((state) => {
    for (const e of state.elements) {
      if (e.id === parentId) {
        return e;
      }
    }
  });

  const foundation = useStore((state) => {
    for (const e of state.elements) {
      if (e.id === foundationId) {
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
        case ObjectType.Wall:
          if (foundation?.type === ObjectType.Foundation) {
            const absoluteCoordinates = Util.absoluteCoordinates(cx, cy, cz, parent, foundation as FoundationModel);
            cx = absoluteCoordinates.x;
            cy = absoluteCoordinates.y;
            cz = absoluteCoordinates.z;
          }
          break;
        case ObjectType.Roof:
          if (foundation?.type === ObjectType.Foundation) {
            const absoluteCoordinates = Util.absoluteCoordinates(cx, cy, cz, parent, foundation as FoundationModel);
            cx = absoluteCoordinates.x;
            cy = absoluteCoordinates.y;
            cz = absoluteCoordinates.z;
          }
          break;
      }
    }
  }
  const hz = lz / 2;

  const euler = useMemo(() => {
    if (parent?.type === ObjectType.Wall) {
      const wall = parent as WallModel;
      const wallAbsAngle = foundation ? foundation.rotation[2] + wall.relativeAngle : wall.relativeAngle;
      return new Euler(HALF_PI, 0, wallAbsAngle, 'ZXY');
    }
    if (parent?.type === ObjectType.Roof) {
      return new Euler(
        rotation[0],
        rotation[1],
        foundation ? foundation.rotation[2] + rotation[2] : rotation[2],
        'ZXY',
      );
    }
    if (parent?.type === ObjectType.Cuboid) {
      return getRotationFromNormal(normal);
    }
    // the normal below seems to be relative to its parent
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
  }, [normal, rotation, foundation?.rotation]);

  const labelText = useMemo(() => {
    return (
      (sensorModel?.label ? sensorModel.label : i18n.t('shared.SensorElement', lang)) +
      (sensorModel?.locked ? ' (' + i18n.t('shared.ElementLocked', lang) + ')' : '') +
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
          useRefStore.getState().setEnableOrbitController(false);
          usePrimitiveStore.getState().set((state) => {
            state.showWallIntersectionPlaneId = parentId;
            state.oldParentId = parentId;
            state.oldFoundationId = foundationId;
          });
          setCommonStore((state) => {
            state.moveHandleType = MoveHandleType.Default;
          });
        }}
        onContextMenu={(e) => {
          selectMe(id, e, ActionType.ContextMenu);
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
      <Cylinder
        userData={{ unintersectable: true }}
        name={'Meter'}
        castShadow={false}
        receiveShadow={false}
        args={[lx * 0.3, ly * 0.3, hz, 8, 1]}
        position={new Vector3(0, 0, hz)}
        rotation={[HALF_PI, 0, 0]}
      >
        <meshBasicMaterial attach="material" color={'black'} />
      </Cylinder>

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
            if (e.button === 2) {
              selectMe(id, e, ActionType.ContextMenu);
              setCommonStore((state) => {
                if (e.intersections.length > 0) {
                  const intersected = e.intersections[0].object === handleRef.current;
                  if (intersected) {
                    state.contextMenuObjectType = ObjectType.Sensor;
                  }
                }
              });
            } else {
              selectMe(id, e, ActionType.Move);
            }
            useRefStore.getState().setEnableOrbitController(false);
            usePrimitiveStore.getState().set((state) => {
              state.showWallIntersectionPlaneId = parentId;
              state.oldParentId = parentId;
              state.oldFoundationId = foundationId;
            });
            setCommonStore((state) => {
              state.moveHandleType = MoveHandleType.Default;
            });
          }}
        >
          <meshBasicMaterial attach="material" color={'orange'} />
        </Sphere>
      )}

      {(hovered || showLabel) && !selected && (
        <textSprite
          userData={{ unintersectable: true }}
          name={'Label'}
          fontFace={'Roboto'}
          text={labelText}
          color={sensorModel?.labelColor ?? 'white'}
          fontSize={sensorModel?.labelFontSize ?? 20}
          textHeight={sensorModel?.labelSize ?? 0.2}
          position={[0, 0, lz + (sensorModel?.labelHeight ?? 0.2)]}
        />
      )}
    </group>
  );
};

export default React.memo(Sensor);
