/*
 * @Copyright 2022-2024. Institute for Future Intelligence, Inc.
 */

import React, { useMemo, useRef, useState } from 'react';
import { Cylinder, Sphere } from '@react-three/drei';
import { Euler, Mesh, Vector3 } from 'three';
import { useStore } from '../stores/common';
import * as Selector from '../stores/selector';
import { useThree } from '@react-three/fiber';
import {
  HALF_PI,
  LOCKED_ELEMENT_SELECTION_COLOR,
  MOVE_HANDLE_RADIUS,
  TWO_PI,
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
import { LightModel } from '../models/LightModel';
import { RoofModel } from '../models/RoofModel';
import { useRefStore } from 'src/stores/commonRef';
import { usePrimitiveStore } from 'src/stores/commonPrimitive';
import { useLanguage, useSelected } from '../hooks';
import { SolarPanelUtil } from './solarPanel/SolarPanelUtil';

const Light = React.memo((lightModel: LightModel) => {
  const {
    id,
    cx,
    cy,
    cz,
    lx = 1,
    ly = 1,
    lz = 0.1,
    rotation = [0, 0, 0],
    normal = [0, 0, 1],
    color = '#ffff99',
    lineWidth = 0.1,
    locked = false,
    label,
    showLabel = false,
    parentId,
    foundationId,
    decay = 2,
    distance = 5,
    intensity = 3,
    inside = false,
  } = lightModel;

  const setCommonStore = useStore(Selector.set);
  const shadowEnabled = useStore(Selector.viewState.shadowEnabled);
  const selectMe = useStore(Selector.selectMe);
  const sunlightDirection = useStore(Selector.sunlightDirection);
  const night = sunlightDirection.z <= 0;
  const selected = useSelected(id);

  const {
    gl: { domElement },
  } = useThree();
  const [hovered, setHovered] = useState(false);
  const baseRef = useRef<Mesh>(null);
  const handleRef = useRef<Mesh>(null);

  const lang = useLanguage();

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

  let parentThickness = 0.1;

  let rx = cx;
  let ry = cy;
  let rz = cz;

  if (parentId) {
    if (parent) {
      switch (parent.type) {
        case ObjectType.Foundation:
          rz = parent.cz + parent.lz / 2;
          if (Util.isZero(rotation[2])) {
            rx = parent.cx + cx * parent.lx;
            ry = parent.cy + cy * parent.ly;
          } else {
            // we must rotate the real length, not normalized length
            const v = new Vector3(cx * parent.lx, cy * parent.ly, 0);
            v.applyAxisAngle(UNIT_VECTOR_POS_Z, rotation[2]);
            rx = parent.cx + v.x;
            ry = parent.cy + v.y;
          }
          break;
        case ObjectType.Wall:
          if (foundation?.type === ObjectType.Foundation) {
            const absoluteCoordinates = Util.absoluteCoordinates(cx, cy, cz, parent, foundation as FoundationModel);
            rx = absoluteCoordinates.x;
            ry = absoluteCoordinates.y;
            rz = absoluteCoordinates.z;
          }
          parentThickness = (parent as WallModel).ly;
          break;
        case ObjectType.Roof:
          if (foundation?.type === ObjectType.Foundation) {
            const absoluteCoordinates = Util.absoluteCoordinates(
              cx * foundation.lx,
              cy * foundation.ly,
              cz + foundation.cz,
              parent,
              foundation as FoundationModel,
            );
            rx = absoluteCoordinates.x;
            ry = absoluteCoordinates.y;
            rz = absoluteCoordinates.z + lz / 2;
          }
          parentThickness = (parent as RoofModel).thickness;
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
      return SolarPanelUtil.getRotationFromNormal(normal);
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
  }, [normal, rotation, foundation, parent]);

  const labelText = useMemo(() => {
    return (
      (label ? label : i18n.t('shared.LightElement', lang)) +
      (locked ? ' (' + i18n.t('shared.ElementLocked', lang) + ')' : '') +
      '\n' +
      i18n.t('word.Coordinates', lang) +
      ': (' +
      rx.toFixed(1) +
      ', ' +
      ry.toFixed(1) +
      ', ' +
      rz.toFixed(1) +
      ') ' +
      i18n.t('word.MeterAbbreviation', lang)
    );
  }, [label, locked, lang, rx, ry, rz]);

  return (
    <group name={'Light Group ' + id} rotation={euler} position={[rx, ry, rz]}>
      {night && (
        <pointLight
          color={color}
          name={'Point Light ' + id}
          position={[0, 0, inside ? -parentThickness - hz : hz]}
          decay={decay * 0.2} // backward compatibility: earlier versions of three.js decay more slowly
          distance={distance}
          intensity={intensity}
          castShadow={true}
        />
      )}
      <Cylinder
        receiveShadow={shadowEnabled}
        userData={{ unintersectable: true }}
        uuid={id}
        ref={baseRef}
        position={[0, 0, inside ? -parentThickness : 0]}
        rotation={[HALF_PI, 0, 0]}
        args={[lx * 0.5, ly * 0.5, hz, 16, 1]}
        name={'Light Base'}
        onPointerDown={(e) => {
          if (e.button === 2) return; // ignore right-click
          selectMe(id, e, ActionType.Move);
          useRefStore.getState().setEnableOrbitController(false);
          usePrimitiveStore.getState().set((state) => {
            state.showWallIntersectionPlaneId = parentId;
            state.oldParentId = parentId;
            state.oldFoundationId = foundationId;
          });
        }}
        onContextMenu={(e) => {
          selectMe(id, e, ActionType.ContextMenu);
          setCommonStore((state) => {
            if (e.intersections.length > 0) {
              const intersected = e.intersections[0].object === baseRef.current;
              if (intersected) {
                state.contextMenuObjectType = ObjectType.Light;
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
        <meshStandardMaterial attach="material" color={'lightgray'} />
      </Cylinder>
      <Sphere
        userData={{ unintersectable: true }}
        name={'Light Bulb'}
        castShadow={false}
        receiveShadow={shadowEnabled}
        args={[lx * 0.3, 8, 8, 0, TWO_PI, 0, Math.PI]}
        position={new Vector3(0, 0, inside ? -parentThickness - hz : hz)}
        rotation={[HALF_PI, 0, 0]}
      >
        {night ? (
          <meshBasicMaterial attach="material" color={'white'} />
        ) : (
          <meshStandardMaterial attach="material" color={'white'} />
        )}
      </Sphere>

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
          position={new Vector3(0, 0, inside ? -parentThickness - hz : hz)}
          args={[MOVE_HANDLE_RADIUS, 6, 6, inside ? Math.PI : 0, Math.PI]}
          name={MoveHandleType.Default}
          onPointerDown={(e) => {
            if (e.button === 2) {
              selectMe(id, e, ActionType.ContextMenu);
              setCommonStore((state) => {
                if (e.intersections.length > 0) {
                  const intersected = e.intersections[0].object === handleRef.current;
                  if (intersected) {
                    state.contextMenuObjectType = ObjectType.Light;
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
          color={lightModel?.labelColor ?? 'white'}
          fontSize={lightModel?.labelFontSize ?? 20}
          textHeight={lightModel?.labelSize ?? 0.2}
          position={[0, 0, (inside ? -parentThickness : 0) + lz + (lightModel?.labelHeight ?? 0.2)]}
        />
      )}
    </group>
  );
});

export default Light;
