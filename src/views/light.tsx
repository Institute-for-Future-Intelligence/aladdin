/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
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

const Light = ({
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
  lineColor = 'black',
  lineWidth = 0.1,
  selected = false,
  locked = false,
  showLabel = false,
  parentId,
  foundationId,
  decay = 2,
  distance = 5,
  intensity = 3,
  inside = false,
}: LightModel) => {
  const setCommonStore = useStore(Selector.set);
  const language = useStore(Selector.language);
  const shadowEnabled = useStore(Selector.viewState.shadowEnabled);
  const getElementById = useStore(Selector.getElementById);
  const selectMe = useStore(Selector.selectMe);
  const sunlightDirection = useStore(Selector.sunlightDirection);
  const night = sunlightDirection.z <= 0;

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

  const foundation = useStore((state) => {
    for (const e of state.elements) {
      if (e.id === foundationId) {
        return e;
      }
    }
  });

  let parentThickness = 0.1;

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
        case ObjectType.Wall:
          if (foundation?.type === ObjectType.Foundation) {
            const absoluteCoordinates = Util.absoluteCoordinates(cx, cy, cz, parent, foundation as FoundationModel);
            cx = absoluteCoordinates.x;
            cy = absoluteCoordinates.y;
            cz = absoluteCoordinates.z;
          }
          parentThickness = (parent as WallModel).ly;
          break;
        case ObjectType.Roof:
          if (foundation?.type === ObjectType.Foundation) {
            const absoluteCoordinates = Util.absoluteCoordinates(cx, cy, cz, parent, foundation as FoundationModel);
            cx = absoluteCoordinates.x;
            cy = absoluteCoordinates.y;
            cz = absoluteCoordinates.z;
          }
          parentThickness = (parent as RoofModel).thickness;
          break;
      }
    }
  }
  const hz = lz / 2;
  const lightModel = getElementById(id) as LightModel;

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
      (lightModel?.label ? lightModel.label : i18n.t('shared.LightElement', lang)) +
      (lightModel.locked ? ' (' + i18n.t('shared.ElementLocked', lang) + ')' : '') +
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
  }, [lightModel?.label, locked, language, cx, cy, cz]);

  return (
    <group name={'Light Group ' + id} rotation={euler} position={[cx, cy, cz]}>
      {night && (
        <pointLight
          color={color}
          name={'Point Light ' + id}
          position={[0, 0, inside ? -parentThickness - hz : hz]}
          decay={decay}
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
        }}
        onContextMenu={(e) => {
          selectMe(id, e);
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
            selectMe(id, e, ActionType.Move);
          }}
        >
          <meshBasicMaterial attach="material" color={'orange'} />
        </Sphere>
      )}

      {(hovered || showLabel) && !selected && (
        <textSprite
          userData={{ unintersectable: true }}
          name={'Label'}
          text={labelText}
          fontSize={20}
          fontFace={'Times Roman'}
          textHeight={lightModel?.labelSize ?? 0.2}
          position={[0, 0, (inside ? -parentThickness : 0) + lz + (lightModel?.labelHeight ?? 0.2)]}
        />
      )}
    </group>
  );
};

export default React.memo(Light);
