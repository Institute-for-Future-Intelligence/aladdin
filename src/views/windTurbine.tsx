/*
 * @Copyright 2023. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Cylinder, Line, RoundedBox, Sphere } from '@react-three/drei';
import { BackSide, Euler, FrontSide, Mesh, Shape, Vector2, Vector3 } from 'three';
import { useStore } from '../stores/common';
import { useRefStore } from 'src/stores/commonRef';
import * as Selector from '../stores/selector';
import { ThreeEvent, useThree } from '@react-three/fiber';
import { HALF_PI, LOCKED_ELEMENT_SELECTION_COLOR, MOVE_HANDLE_RADIUS, UNIT_VECTOR_POS_Z } from '../constants';
import { ActionType, MoveHandleType, ObjectType } from '../types';
import { Util } from '../Util';
import i18n from '../i18n/i18n';
import { WindTurbineModel } from '../models/WindTurbineModel';
import { useSelected } from './hooks';

const WindTurbine = ({
  id,
  cx,
  cy,
  cz,
  lx,
  lz,
  numberOfBlades = 3,
  speed = 10,
  hubRadius = 0.75,
  hubLength = 1.5,
  maximumChordRadius = 3,
  maximumChordLength = 1,
  towerHeight,
  towerRadius,
  bladeRadius,
  bladeTipWidth = 0.2,
  bladeRootRadius = 0.3,
  rotation = [0, 0, 0],
  relativeYawAngle = 0,
  initialRotorAngle = 0,
  pitchAngle = Util.toRadians(10),
  color = 'white',
  bladeColor = 'white',
  lineColor = 'black',
  lineWidth = 0.5,
  showLabel = false,
  locked = false,
  parentId,
}: WindTurbineModel) => {
  const setCommonStore = useStore(Selector.set);
  const language = useStore(Selector.language);
  const getElementById = useStore(Selector.getElementById);
  const selectMe = useStore(Selector.selectMe);
  const selected = useSelected(id);
  const shadowEnabled = useStore(Selector.viewState.shadowEnabled);
  const dateString = useStore(Selector.world.date);

  const {
    gl: { domElement },
  } = useThree();

  const [hovered, setHovered] = useState(false);
  const baseRef = useRef<Mesh>(null);
  const moveHandleRef = useRef<Mesh>(null);
  const pointerDown = useRef<boolean>(false);

  const lang = useMemo(() => {
    return { lng: language };
  }, [language]);

  const texture = useMemo(() => {
    return Util.fetchBladeTexture(bladeRadius, bladeRootRadius * 2, 100);
  }, [bladeRootRadius, bladeRadius]);

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
        cz = parent.lz;
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
  const nacelleWidth = hubRadius * 1.25;
  const nacelleLength = hubLength * 2.5;
  const bladeLength = bladeRadius - maximumChordRadius / 3;

  const bladeShape = useMemo(() => {
    const maximumChordOffset = maximumChordLength - bladeRootRadius;
    const s = new Shape();
    const points: Vector2[] = [];
    points.push(new Vector2(-bladeRootRadius, 0));
    points.push(new Vector2(-maximumChordOffset / 2, bladeRadius - bladeLength));
    points.push(new Vector2(-maximumChordOffset, maximumChordRadius));
    points.push(new Vector2(bladeRootRadius - bladeTipWidth, bladeRadius));
    s.moveTo(-bladeRootRadius, 0);
    s.splineThru(points);
    s.lineTo(bladeRootRadius, bladeRadius);
    s.lineTo(bladeRootRadius, 0);
    s.closePath();
    return s;
  }, [bladeRadius, maximumChordLength, maximumChordRadius, bladeRootRadius, bladeTipWidth]);

  const timeAngle = useMemo(() => {
    // A wind turbine rotates 10-20 revolutions per minute, which is too fast to show in a 24-hour animation
    // with a step length of 15 minutes or so. So we have to slow it down by a divider (144).
    const now = new Date(dateString);
    return initialRotorAngle + (speed * (now.getHours() * 60 + now.getMinutes()) * Math.PI) / 72;
  }, [dateString, speed, initialRotorAngle]);

  useEffect(() => {
    const handlePointerUp = () => {
      useRefStore.getState().setEnableOrbitController(true);
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
      (turbine?.locked ? ' (' + i18n.t('shared.ElementLocked', lang) + ')' : '') +
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
  }, [turbine?.label, turbine?.locked, lang, cx, cy, cz]);

  // in model coordinate system
  const euler = useMemo(() => {
    return new Euler(0, 0, rotation[2] + relativeYawAngle, 'ZXY');
  }, [rotation, relativeYawAngle]);

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

  const bladeAngles = useMemo(() => {
    const bladeAngleExtent = (Math.PI * 2) / numberOfBlades;
    const angles = new Array<number>();
    for (let i = 0; i < numberOfBlades; i++) {
      angles.push(timeAngle + bladeAngleExtent * i);
    }
    return angles;
  }, [numberOfBlades, timeAngle]);

  return (
    <group name={'Wind Turbine Group ' + id} rotation={euler} position={[cx, cy, cz]}>
      <group>
        {/* move handle */}
        {selected && !locked && (
          <Sphere
            ref={moveHandleRef}
            position={new Vector3(0, 0, 0)}
            args={[moveHandleSize + towerRadius, 6, 6]}
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
              if (e.button === 2) return;
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
        ref={baseRef}
        castShadow={shadowEnabled}
        receiveShadow={shadowEnabled}
        args={[towerRadius * 0.8, towerRadius * 1.2, towerHeight, 4, 1]}
        position={new Vector3(0, 0, towerHeight * 0.5)}
        rotation={[HALF_PI, 0, 0]}
        onPointerDown={(e) => {
          if (e.button === 2) return; // ignore right-click
          selectMe(id, e, ActionType.Select);
          useRefStore.getState().setEnableOrbitController(false);
        }}
        onContextMenu={(e) => {
          selectMe(id, e, ActionType.ContextMenu);
          setCommonStore((state) => {
            if (e.intersections.length > 0) {
              const intersected = e.intersections[0].object === baseRef.current;
              if (intersected) {
                state.contextMenuObjectType = ObjectType.WindTurbine;
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
        onPointerOut={(e) => {
          setHovered(false);
          domElement.style.cursor = 'default';
        }}
      >
        <meshStandardMaterial attach="material" color={color} />
      </Cylinder>

      {/*draw hub */}
      <Sphere
        userData={{ unintersectable: true }}
        name={'Hub'}
        castShadow={shadowEnabled}
        receiveShadow={shadowEnabled}
        args={[hubRadius, 8, 8, HALF_PI, Math.PI, 0, Math.PI]}
        position={new Vector3(0, -hubLength * 0.5, towerHeight)}
        rotation={[Math.PI, 0, HALF_PI]}
        scale={[hubLength / hubRadius, 1, 1]}
      >
        <meshStandardMaterial attach="material" color={color} />
      </Sphere>
      <Cylinder
        userData={{ unintersectable: true }}
        name={'Hub Cap'}
        castShadow={shadowEnabled}
        receiveShadow={shadowEnabled}
        args={[hubRadius, hubRadius, 0.01, 16, 1]}
        position={new Vector3(0, -hubLength * 0.5, towerHeight)}
        rotation={[Math.PI, 0, 0]}
      >
        <meshStandardMaterial attach="material" color={color} />
      </Cylinder>

      {/*draw nacelle */}
      <RoundedBox
        userData={{ unintersectable: true }}
        name={'Nacelle'}
        castShadow={shadowEnabled}
        receiveShadow={shadowEnabled}
        radius={0.1}
        smoothness={4}
        args={[nacelleWidth, nacelleWidth, nacelleLength]}
        position={new Vector3(0, (nacelleLength - hubLength) * 0.5 - 0.1, towerHeight)}
        rotation={[HALF_PI, 0, 0]}
      >
        <meshStandardMaterial attach="material" color={color} />
      </RoundedBox>

      {/*draw blades*/}
      {bladeAngles.map((value, index) => {
        return (
          <group
            key={index}
            position={new Vector3(0, -hubLength * 0.85, towerHeight)}
            rotation={[HALF_PI, pitchAngle, value, 'XZY']}
          >
            <mesh name={'Blade ' + index + ' Font Side'} receiveShadow={shadowEnabled} castShadow={shadowEnabled}>
              <shapeGeometry attach="geometry" args={[bladeShape]} />
              <meshStandardMaterial attach="material" color={bladeColor} side={FrontSide} map={texture} />
            </mesh>
            <mesh
              name={'Blade ' + index + ' Back Side'}
              receiveShadow={shadowEnabled}
              castShadow={shadowEnabled}
              position={new Vector3(0, -0.05, 0)}
            >
              <shapeGeometry attach="geometry" args={[bladeShape]} />
              <meshStandardMaterial attach="material" color={bladeColor} side={BackSide} map={texture} />
            </mesh>
            <Cylinder
              name={'Blade root'}
              castShadow={false}
              receiveShadow={false}
              args={[bladeRootRadius * 1.1, bladeRootRadius * 1.1, 0.24, 12, 1]}
              position={new Vector3(0, hubRadius - 0.14, 0)}
            >
              <meshStandardMaterial attach="material" color={color} />
            </Cylinder>
          </group>
        );
      })}

      {/* highlight it when it is selected but locked */}
      {selected && locked && (
        <Line
          name={'Selection highlight lines'}
          userData={{ unintersectable: true }}
          points={[
            [-lx / 2, 0, 0],
            [-lx / 2, lz, 0],
            [-lx / 2, lz, 0],
            [lx / 2, lz, 0],
            [lx / 2, 0, 0],
            [lx / 2, lz, 0],
            [lx / 2, 0, 0],
            [-lx / 2, 0, 0],
          ]}
          rotation={[HALF_PI, 0, 0]}
          castShadow={false}
          receiveShadow={false}
          lineWidth={1}
          color={LOCKED_ELEMENT_SELECTION_COLOR}
        />
      )}

      {/* draw label */}
      {(hovered || showLabel) && !selected && (
        <textSprite
          userData={{ unintersectable: true }}
          name={'Label'}
          fontFace={'Roboto'}
          text={labelText}
          color={turbine?.labelColor ?? 'white'}
          fontSize={turbine?.labelFontSize ?? 20}
          textHeight={turbine?.labelSize ?? 1}
          castShadow={false}
          receiveShadow={false}
          position={[0, 0, 1 + towerHeight + hubRadius]}
        />
      )}
    </group>
  );
};

export default React.memo(WindTurbine);
