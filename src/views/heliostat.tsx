/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Box, Cylinder, Line, Plane, Sphere } from '@react-three/drei';
import { CanvasTexture, Color, DoubleSide, Euler, FrontSide, Mesh, Vector3 } from 'three';
import { useStore } from '../stores/common';
import { useStoreRef } from 'src/stores/commonRef';
import * as Selector from '../stores/selector';
import { ThreeEvent, useThree } from '@react-three/fiber';
import { HALF_PI, LOCKED_ELEMENT_SELECTION_COLOR, MOVE_HANDLE_RADIUS, UNIT_VECTOR_POS_Z } from '../constants';
import { ActionType, MoveHandleType, ObjectType, SolarStructure } from '../types';
import { Util } from '../Util';
import { getSunDirection } from '../analysis/sunTools';
import i18n from '../i18n/i18n';
import { FoundationModel } from '../models/FoundationModel';
import { HeliostatModel } from '../models/HeliostatModel';

const Heliostat = ({
  id,
  cx,
  cy,
  cz,
  lx,
  ly,
  lz = 0.1,
  reflectance = 0.9,
  tiltAngle,
  relativeAzimuth,
  poleHeight,
  poleRadius = Math.min(lx, ly) / 20,
  drawSunBeam,
  rotation = [0, 0, 0],
  color = 'white',
  lineColor = 'black',
  lineWidth = 0.5,
  selected = false,
  showLabel = false,
  locked = false,
  parentId,
  towerId,
}: HeliostatModel) => {
  const setCommonStore = useStore(Selector.set);
  const language = useStore(Selector.language);
  const date = useStore(Selector.world.date);
  const latitude = useStore(Selector.world.latitude);
  const elements = useStore(Selector.elements);
  const showSolarRadiationHeatmap = useStore(Selector.showSolarRadiationHeatmap);
  const solarRadiationHeatmapMaxValue = useStore(Selector.viewState.solarRadiationHeatmapMaxValue);
  const getHeatmap = useStore(Selector.getHeatmap);
  const shadowEnabled = useStore(Selector.viewState.shadowEnabled);
  const getElementById = useStore(Selector.getElementById);
  const selectMe = useStore(Selector.selectMe);
  const sceneRadius = useStore(Selector.sceneRadius);

  const {
    gl: { domElement },
  } = useThree();

  const [hovered, setHovered] = useState(false);
  const [heatmapTexture, setHeatmapTexture] = useState<CanvasTexture | null>(null);
  const baseRef = useRef<Mesh>();
  const moveHandleRef = useRef<Mesh>();
  const pointerDown = useRef<boolean>(false);

  const sunBeamLength = Math.max(100, 10 * sceneRadius);
  const lang = { lng: language };

  const hx = lx / 2;
  const hy = ly / 2;
  const hz = lz / 2;
  const actualPoleHeight = poleHeight + Math.max(hx, hy);

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
        cz = actualPoleHeight + hz + parent.lz;
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

  const heliostat = getElementById(id) as HeliostatModel;

  useEffect(() => {
    if (heliostat && showSolarRadiationHeatmap) {
      const heatmap = getHeatmap(heliostat.id);
      if (heatmap) {
        setHeatmapTexture(Util.fetchHeatmapTexture(heatmap, solarRadiationHeatmapMaxValue ?? 5));
      }
    }
  }, [showSolarRadiationHeatmap, solarRadiationHeatmapMaxValue]);

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
      (heliostat?.label ? heliostat.label : i18n.t('shared.HeliostatElement', lang)) +
      (heliostat.locked ? ' (' + i18n.t('shared.ElementLocked', lang) + ')' : '') +
      (heliostat?.label
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
  }, [heliostat?.label, locked, language, cx, cy, cz]);

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

  const sunDirection = useMemo(() => {
    return getSunDirection(new Date(date), latitude);
  }, [date, latitude]);
  const rot = parent?.rotation[2];

  // TODO: how to get an updated version of the memorized tower
  const tower = towerId && towerId !== parentId ? getElementById(towerId) : null;

  const receiverCenter = useMemo(() => {
    if (tower) {
      if (tower.type === ObjectType.Foundation) {
        const foundation = tower as FoundationModel;
        if (foundation.solarStructure === SolarStructure.FocusTower && foundation.solarPowerTower) {
          // convert the receiver's coordinates into those relative to the center of this heliostat
          return new Vector3(
            foundation.cx - cx,
            foundation.cy - cy,
            foundation.cz - cz + foundation.lz / 2 + (foundation.solarPowerTower.towerHeight ?? 20),
          );
        }
      }
    } else {
      if (parent) {
        if (parent.type === ObjectType.Foundation) {
          const foundation = parent as FoundationModel;
          if (foundation.solarStructure === SolarStructure.FocusTower && foundation.solarPowerTower) {
            // convert the receiver's coordinates into those relative to the center of this heliostat
            return new Vector3(
              foundation.cx - cx,
              foundation.cy - cy,
              foundation.cz - cz + foundation.lz / 2 + (foundation.solarPowerTower.towerHeight ?? 20),
            );
          }
        }
      }
    }
    return null;
  }, [parent, cx, cy, cz, towerId, tower?.cx, tower?.cy, tower?.cz]);

  const relativeEuler = useMemo(() => {
    if (receiverCenter && sunDirection.z > 0) {
      const heliostatToReceiver = receiverCenter.clone().normalize();
      let normalVector = heliostatToReceiver.add(sunDirection).normalize();
      if (Util.isSame(normalVector, UNIT_VECTOR_POS_Z)) {
        normalVector = new Vector3(-0.001, 0, 1).normalize();
      }
      if (rot) {
        normalVector.applyAxisAngle(UNIT_VECTOR_POS_Z, -rot);
      }
      // convert the normal vector to euler
      const r = Math.hypot(normalVector.x, normalVector.y);
      return new Euler(Math.atan2(r, normalVector.z), 0, Math.atan2(normalVector.y, normalVector.x) + HALF_PI, 'ZXY');
    }
    return new Euler(tiltAngle, 0, relativeAzimuth, 'ZXY');
  }, [receiverCenter, sunDirection, tiltAngle, relativeAzimuth, rot, tower?.cx, tower?.cy, tower?.cz]);

  const poleZ = -(actualPoleHeight + lz) / 2;
  const baseSize = Math.max(1, (lx + ly) / 8);
  const moveHandleSize = MOVE_HANDLE_RADIUS * baseSize * 4;

  return (
    <group name={'Heliostat Group ' + id} rotation={euler} position={[cx, cy, cz + hz]}>
      <group rotation={relativeEuler}>
        {/* draw the upper side of the heliostat */}
        <Box
          receiveShadow={shadowEnabled}
          castShadow={shadowEnabled}
          uuid={id}
          ref={baseRef}
          args={[lx, ly, lz]}
          name={'Heliostat'}
          onPointerDown={(e) => {
            if (e.button === 2) return; // ignore right-click
            selectMe(id, e, ActionType.Select);
          }}
          onContextMenu={(e) => {
            selectMe(id, e, ActionType.Select);
            setCommonStore((state) => {
              if (e.intersections.length > 0) {
                const intersected = e.intersections[0].object === baseRef.current;
                if (intersected) {
                  state.contextMenuObjectType = ObjectType.Heliostat;
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
          <meshStandardMaterial attachArray="material" color={color} />
          <meshStandardMaterial attachArray="material" color={color} />
          <meshStandardMaterial attachArray="material" color={color} />
          <meshStandardMaterial attachArray="material" color={color} />
          {showSolarRadiationHeatmap && heatmapTexture ? (
            <meshBasicMaterial attachArray="material" side={FrontSide} map={heatmapTexture} />
          ) : (
            <meshPhongMaterial
              attachArray="material"
              specular={new Color('white')}
              shininess={100 * reflectance}
              side={FrontSide}
              color={'lightskyblue'}
            />
          )}
          <meshStandardMaterial attachArray="material" color={color} />
        </Box>

        {/* simulation element */}
        <Plane
          name={'Heliostat Simulation Plane'}
          uuid={id}
          args={[lx, ly]}
          position={[0, 0, hz]}
          userData={{ simulation: true }}
          receiveShadow={false}
          castShadow={false}
          visible={false}
        >
          <meshBasicMaterial side={DoubleSide} />
        </Plane>

        {/* highlight it when it is selected but locked */}
        {selected && locked && (
          <Line
            name={'Selection highlight lines'}
            userData={{ unintersectable: true }}
            points={[
              [-hx, -hy, hz],
              [-hx, hy, hz],
              [hx, hy, hz],
              [hx, -hy, hz],
              [-hx, -hy, hz],
            ]}
            castShadow={false}
            receiveShadow={false}
            lineWidth={1}
            color={LOCKED_ELEMENT_SELECTION_COLOR}
          />
        )}

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
            <meshBasicMaterial attach="material" color={'orange'} />
          </Sphere>
        )}
      </group>

      {/* draw poles */}
      {actualPoleHeight > 0 && (
        <Cylinder
          userData={{ unintersectable: true }}
          name={'Pole'}
          castShadow={false}
          receiveShadow={false}
          args={[poleRadius, poleRadius, actualPoleHeight + lz, elements.length < 100 ? 4 : 2, 1]}
          position={new Vector3(0, 0, poleZ)}
          rotation={[HALF_PI, 0, 0]}
        >
          <meshStandardMaterial attach="material" color={color} />
        </Cylinder>
      )}

      {/* draw sun beam */}
      {drawSunBeam && sunDirection.z > 0 && (
        <Line
          rotation={[-euler.x, 0, -euler.z]}
          userData={{ unintersectable: true }}
          points={
            receiverCenter
              ? [receiverCenter, new Vector3(0, 0, hz), sunDirection.clone().multiplyScalar(sunBeamLength)]
              : [new Vector3(0, 0, hz), sunDirection.clone().multiplyScalar(sunBeamLength)]
          }
          name={'Sun Beam'}
          lineWidth={0.25}
          color={'white'}
          castShadow={false}
          receiveShadow={false}
        />
      )}

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
          position={[0, 0, Math.max(hy * Math.abs(Math.sin(heliostat.tiltAngle)) + 0.1, 0.2)]}
        />
      )}
    </group>
  );
};

export default React.memo(Heliostat);
