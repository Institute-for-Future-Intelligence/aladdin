/*
 * @Copyright 2022-2024. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Box, Cylinder, Line, Plane, Sphere } from '@react-three/drei';
import { CanvasTexture, Color, DoubleSide, Euler, FrontSide, Mesh, Vector3 } from 'three';
import { useStore } from '../stores/common';
import { useRefStore } from 'src/stores/commonRef';
import * as Selector from '../stores/selector';
import { ThreeEvent, useThree } from '@react-three/fiber';
import { HALF_PI, LOCKED_ELEMENT_SELECTION_COLOR, MOVE_HANDLE_RADIUS, UNIT_VECTOR_POS_Z } from '../constants';
import { ActionType, MoveHandleType, ObjectType, SolarStructure } from '../types';
import { Util } from '../Util';
import { getSunDirection } from '../analysis/sunTools';
import i18n from '../i18n/i18n';
import { FoundationModel } from '../models/FoundationModel';
import { HeliostatModel } from '../models/HeliostatModel';
import { usePrimitiveStore } from '../stores/commonPrimitive';
import { useDataStore } from '../stores/commonData';
import { useLanguage, useSelected } from '../hooks';

const Heliostat = React.memo((heliostat: HeliostatModel) => {
  const {
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
    showLabel = false,
    locked = false,
    parentId,
    towerId,
  } = heliostat;

  const setCommonStore = useStore(Selector.set);
  const date = useStore(Selector.world.date);
  const latitude = useStore(Selector.world.latitude);
  const elements = useStore(Selector.elements);
  const showSolarRadiationHeatmap = usePrimitiveStore(Selector.showSolarRadiationHeatmap);
  const solarRadiationHeatmapMaxValue = useStore(Selector.viewState.solarRadiationHeatmapMaxValue);
  const getHeatmap = useDataStore(Selector.getHeatmap);
  const shadowEnabled = useStore(Selector.viewState.shadowEnabled);
  const getElementById = useStore(Selector.getElementById);
  const selectMe = useStore(Selector.selectMe);
  const sceneRadius = useStore(Selector.sceneRadius);

  const selected = useSelected(id);

  const {
    gl: { domElement },
  } = useThree();

  const [hovered, setHovered] = useState(false);
  const [heatmapTexture, setHeatmapTexture] = useState<CanvasTexture | null>(null);
  const baseRef = useRef<Mesh>(null);
  const moveHandleRef = useRef<Mesh>(null);
  const pointerDown = useRef<boolean>(false);

  const sunBeamLength = Math.max(100, 10 * sceneRadius);
  const lang = useLanguage();

  let rx = cx;
  let ry = cy;
  let rz = cz;

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
        rz = actualPoleHeight + hz + parent.lz;
        const foundation = parent as FoundationModel;
        if (foundation.enableSlope) {
          rz = rz + Util.getZOnSlope(foundation.lx, foundation.slope, cx * foundation.lx);
        }
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
    }
  }

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
      (heliostat?.label ? heliostat.label : i18n.t('shared.HeliostatElement', lang)) +
      (heliostat?.locked ? ' (🔒)' : '') +
      (heliostat?.label
        ? ''
        : '\n' +
          i18n.t('word.Coordinates', lang) +
          ': (' +
          rx.toFixed(1) +
          ', ' +
          ry.toFixed(1) +
          ', ' +
          rz.toFixed(1) +
          ') ' +
          i18n.t('word.MeterAbbreviation', lang))
    );
  }, [heliostat?.label, heliostat?.locked, lang, rx, ry, rz]);

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
            foundation.cx - rx,
            foundation.cy - ry,
            foundation.cz - rz + foundation.lz / 2 + (foundation.solarPowerTower.towerHeight ?? 20),
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
              foundation.cx - rx,
              foundation.cy - ry,
              foundation.cz - rz + foundation.lz / 2 + (foundation.solarPowerTower.towerHeight ?? 20),
            );
          }
        }
      }
    }
    return null;
  }, [parent, rx, ry, rz, tower]);

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
  }, [receiverCenter, sunDirection, tiltAngle, relativeAzimuth, rot]);

  const poleZ = -(actualPoleHeight + lz) / 2;
  const baseSize = Math.max(1, (lx + ly) / 8);
  const moveHandleSize = MOVE_HANDLE_RADIUS * baseSize * 4;

  return (
    <group name={'Heliostat Group ' + id} rotation={euler} position={[rx, ry, rz + hz]}>
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
            selectMe(id, e, ActionType.ContextMenu);
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
          onPointerOut={() => {
            setHovered(false);
            domElement.style.cursor = 'default';
          }}
        >
          <meshStandardMaterial attach="material-0" color={color} />
          <meshStandardMaterial attach="material-1" color={color} />
          <meshStandardMaterial attach="material-2" color={color} />
          <meshStandardMaterial attach="material-3" color={color} />
          {showSolarRadiationHeatmap && heatmapTexture ? (
            <meshBasicMaterial attach="material-4" side={FrontSide} map={heatmapTexture} />
          ) : (
            <meshPhongMaterial
              attach="material-4"
              specular={new Color('white')}
              shininess={100 * reflectance}
              side={FrontSide}
              color={'lightskyblue'}
            />
          )}
          <meshStandardMaterial attach="material-5" color={color} />
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
            onPointerOut={() => {
              noHoverHandle();
            }}
            onPointerDown={(e) => {
              if (e.button === 2) return;
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
          fontFace={'Roboto'}
          text={labelText}
          color={heliostat?.labelColor ?? 'white'}
          fontSize={heliostat?.labelFontSize ?? 20}
          textHeight={heliostat?.labelSize ?? 0.2}
          castShadow={false}
          receiveShadow={false}
          position={[0, 0, heliostat?.labelHeight ?? Math.max(hy * Math.abs(Math.sin(heliostat.tiltAngle)) + 0.1, 0.2)]}
        />
      )}
    </group>
  );
});

export default Heliostat;
