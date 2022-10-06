/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Cylinder, Sphere } from '@react-three/drei';
import { Euler, Mesh, Vector3 } from 'three';
import { useStore } from '../stores/common';
import { useStoreRef } from 'src/stores/commonRef';
import * as Selector from '../stores/selector';
import { ThreeEvent, useThree } from '@react-three/fiber';
import { HALF_PI, MOVE_HANDLE_RADIUS, UNIT_VECTOR_POS_Z } from '../constants';
import { ActionType, MoveHandleType, ObjectType } from '../types';
import { Util } from '../Util';
import i18n from '../i18n/i18n';
import { WindTurbineModel } from '../models/WindTurbineModel';

const WindTurbine = ({
  id,
  cx,
  cy,
  cz,
  lx,
  ly,
  lz = 0.1,
  towerHeight,
  towerRadius,
  bladeRadius,
  rotation = [0, 0, 0],
  color = 'white',
  lineColor = 'black',
  lineWidth = 0.5,
  selected = false,
  showLabel = false,
  locked = false,
  parentId,
}: WindTurbineModel) => {
  const language = useStore(Selector.language);
  const getElementById = useStore(Selector.getElementById);
  const selectMe = useStore(Selector.selectMe);

  const {
    gl: { domElement },
  } = useThree();

  const [hovered, setHovered] = useState(false);
  const moveHandleRef = useRef<Mesh>();
  const pointerDown = useRef<boolean>(false);

  const lang = { lng: language };

  // be sure to get the updated parent so that this memorized element can move with it
  const parent = useStore((state) => {
    for (const e of state.elements) {
      if (e.id === parentId) {
        return e;
      }
    }
  });

  if (parent) {
    switch (parent.type) {
      case ObjectType.Foundation:
        cz = towerHeight + parent.lz;
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
    }
  }

  const turbine = getElementById(id) as WindTurbineModel;

  useEffect(() => {
    const handlePointerUp = () => {
      useStoreRef.getState().setEnableOrbitController(true);
      pointerDown.current = false;
    };
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, []);

  const labelText = useMemo(() => {
    return (
      (turbine?.label ? turbine.label : i18n.t('shared.WindTurbineElement', lang)) +
      (turbine.locked ? ' (' + i18n.t('shared.ElementLocked', lang) + ')' : '') +
      (turbine?.label
        ? ''
        : '\n' +
          i18n.t('word.Coordinates', lang) +
          ': (' +
          cx.toFixed(1) +
          ', ' +
          cy.toFixed(1) +
          ', ' +
          cz.toFixed(1) +
          ') ' +
          i18n.t('word.MeterAbbreviation', lang))
    );
  }, [turbine?.label, locked, language, cx, cy, cz]);

  // in model coordinate system
  const euler = useMemo(() => {
    return new Euler(0, 0, rotation[2], 'ZXY');
  }, [rotation]);

  const hoverHandle = (e: ThreeEvent<MouseEvent>, handle: MoveHandleType) => {
    if (e.intersections.length > 0) {
      const intersected = e.intersections[0].object === e.eventObject;
      if (intersected) {
        domElement.style.cursor = handle === MoveHandleType.Default ? 'move' : 'pointer';
      }
    }
  };

  const noHoverHandle = () => {
    domElement.style.cursor = 'default';
  };

  const moveHandleSize = MOVE_HANDLE_RADIUS * 4;

  return (
    <group name={'Wind Turbine Group ' + id} rotation={euler} position={[cx, cy, cz]}>
      <group>
        {/* move handle */}
        {selected && !locked && (
          <Sphere
            ref={moveHandleRef}
            position={new Vector3(0, 0, 0)}
            args={[moveHandleSize, 6, 6]}
            name={MoveHandleType.Default}
            castShadow={false}
            receiveShadow={false}
            onPointerOver={(e) => {
              hoverHandle(e, MoveHandleType.Default);
            }}
            onPointerOut={(e) => {
              noHoverHandle();
            }}
            onPointerDown={(e) => {
              selectMe(id, e, ActionType.Move);
            }}
          >
            <meshStandardMaterial attach="material" color={'orange'} />
          </Sphere>
        )}
      </group>

      {/* draw tower */}
      <Cylinder
        userData={{ unintersectable: true }}
        name={'Tower'}
        castShadow={false}
        receiveShadow={false}
        args={[towerRadius, towerRadius, towerHeight, 4, 1]}
        position={new Vector3(0, 0, 0)}
        rotation={[HALF_PI, 0, 0]}
      >
        <meshStandardMaterial attach="material" color={color} />
      </Cylinder>

      {/* draw label */}
      {(hovered || showLabel) && !selected && (
        <textSprite
          userData={{ unintersectable: true }}
          name={'Label'}
          text={labelText}
          fontSize={20}
          fontFace={'Times Roman'}
          textHeight={0.2}
          castShadow={false}
          receiveShadow={false}
          position={[0, 0, 0.2]}
        />
      )}
    </group>
  );
};

export default React.memo(WindTurbine);
