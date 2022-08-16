/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Box, Cone, Line, Plane, Sphere } from '@react-three/drei';
import { CanvasTexture, DoubleSide, Euler, Mesh, RepeatWrapping, Texture, Vector3 } from 'three';
import { useStore } from '../../stores/common';
import { useStoreRef } from 'src/stores/commonRef';
import * as Selector from '../../stores/selector';
import { ThreeEvent, useThree } from '@react-three/fiber';
import {
  HALF_PI,
  HIGHLIGHT_HANDLE_COLOR,
  LOCKED_ELEMENT_SELECTION_COLOR,
  MOVE_HANDLE_RADIUS,
  RESIZE_HANDLE_COLOR,
  RESIZE_HANDLE_SIZE,
} from '../../constants';
import {
  ActionType,
  MoveHandleType,
  ObjectType,
  Orientation,
  ResizeHandleType,
  RotateHandleType,
  SolarPanelTextureType,
} from '../../types';
import { Util } from '../../Util';
import { SolarPanelModelOnWall } from '../../models/SolarPanelModel';
import { LineData } from '../LineData';
import { getSunDirection } from 'src/analysis/sunTools';
import i18n from 'src/i18n/i18n';
import { WallModel } from 'src/models/WallModel';
import { FoundationModel } from 'src/models/FoundationModel';

interface SumbeamProps {
  drawSunbeam: boolean;
  absRotation: number;
}

interface LabelProps {
  sp: SolarPanelModelOnWall;
}

const Sunbeam = React.memo(({ drawSunbeam, absRotation }: SumbeamProps) => {
  const normalVector = new Vector3(0, 0, 1);

  const date = useStore(Selector.world.date);
  const latitude = useStore(Selector.world.latitude);
  const sceneRadius = useStore(Selector.sceneRadius);
  const sunBeamLength = Math.max(100, 10 * sceneRadius);

  const sunDirection = useMemo(() => {
    return getSunDirection(new Date(date), latitude).applyEuler(new Euler(-HALF_PI, 0, -absRotation));
  }, [date, latitude, absRotation]);

  return (
    <>
      {drawSunbeam && sunDirection.z > 0 && (
        <group>
          <Line
            userData={{ unintersectable: true }}
            points={[
              normalVector.clone().multiplyScalar(0.75),
              [0, 0, 0],
              sunDirection.clone().multiplyScalar(sunBeamLength),
            ]}
            name={'Sun Beam'}
            lineWidth={0.5}
            color={'white'}
          />
          <Line
            userData={{ unintersectable: true }}
            points={[sunDirection.clone().multiplyScalar(0.5), normalVector.clone().multiplyScalar(0.5)]}
            name={'Angle'}
            lineWidth={0.5}
            color={'white'}
          />
          <textSprite
            userData={{ unintersectable: true }}
            name={'Angle Value'}
            text={Util.toDegrees(sunDirection.angleTo(normalVector)).toFixed(1) + '°'}
            fontSize={20}
            fontFace={'Times Roman'}
            textHeight={0.1}
            position={sunDirection
              .clone()
              .multiplyScalar(0.75)
              .add(normalVector.clone().multiplyScalar(0.75))
              .multiplyScalar(0.5)}
          />
          <group position={normalVector.clone().multiplyScalar(0.75)} rotation={[HALF_PI, 0, 0]}>
            <Cone userData={{ unintersectable: true }} args={[0.04, 0.2, 4, 2]} name={'Normal Vector Arrow Head'}>
              <meshStandardMaterial color={'white'} />
            </Cone>
          </group>
        </group>
      )}
    </>
  );
});

const Label = ({ sp }: LabelProps) => {
  useStore(Selector.elements);
  const getElementById = useStore(Selector.getElementById);
  const language = useStore(Selector.language);
  const lang = { lng: language };

  if (!sp.foundationId) {
    return null;
  }

  const wall = getElementById(sp.parentId) as WallModel;
  const foundation = getElementById(sp.foundationId) as FoundationModel;

  if (!wall || !foundation) {
    return null;
  }

  const fCenter = new Vector3(foundation.cx, foundation.cy, foundation.cz);
  const wCenter = new Vector3(wall.cx, wall.cy, wall.cz);

  const center = new Vector3(sp.cx * wall.lx, 0, sp.cz * wall.lz)
    .applyEuler(new Euler(0, 0, wall.relativeAngle))
    .add(wCenter)
    .applyEuler(new Euler(0, 0, foundation.rotation[2]))
    .add(fCenter);

  const labelText =
    (sp.label ?? i18n.t('shared.SolarPanelElement', lang)) +
    (sp.locked ? ` ( + ${i18n.t('shared.ElementLocked', lang)} + )` : '') +
    (sp.label
      ? ''
      : '\n' +
        i18n.t('word.Coordinates', lang) +
        ': (' +
        center.x.toFixed(1) +
        ', ' +
        center.y.toFixed(1) +
        ', ' +
        center.z.toFixed(1) +
        ') ' +
        i18n.t('word.MeterAbbreviation', lang));

  return (
    <textSprite
      userData={{ unintersectable: true }}
      name={'Label'}
      text={labelText}
      fontSize={20}
      fontFace={'Times Roman'}
      textHeight={0.2}
      position={[0, 0, Math.max((sp.ly / 2) * Math.abs(Math.sin(sp.tiltAngle)) + 0.1, 0.2)]}
    />
  );
};

const SolarPanelOnWall = ({
  id,
  pvModelName,
  cx,
  cy,
  cz,
  lx,
  ly,
  lz,
  color = 'white',
  selected = false,
  locked = false,
  parentId,
  orientation = Orientation.portrait,
  showLabel,
  drawSunBeam,
  absRotation,
}: SolarPanelModelOnWall) => {
  const setCommonStore = useStore(Selector.set);
  const showSolarRadiationHeatmap = useStore(Selector.showSolarRadiationHeatmap);
  const solarRadiationHeatmapMaxValue = useStore(Selector.viewState.solarRadiationHeatmapMaxValue);
  const getHeatmap = useStore(Selector.getHeatmap);
  const shadowEnabled = useStore(Selector.viewState.shadowEnabled);
  const getElementById = useStore(Selector.getElementById);
  const selectMe = useStore(Selector.selectMe);
  const getPvModule = useStore(Selector.getPvModule);
  const resizeHandleType = useStore(Selector.resizeHandleType);
  const solarPanelTextures = useStore(Selector.solarPanelTextures);
  const getSolarPanelTexture = useStore(Selector.getSolarPanelTexture);

  const {
    gl: { domElement },
  } = useThree();

  const [hovered, setHovered] = useState(false);
  const [hoveredHandle, setHoveredHandle] = useState<MoveHandleType | ResizeHandleType | RotateHandleType | null>(null);
  const [nx, setNx] = useState(1);
  const [ny, setNy] = useState(1);
  const [heatmapTexture, setHeatmapTexture] = useState<CanvasTexture | null>(null);
  const baseRef = useRef<Mesh>();
  const moveHandleRef = useRef<Mesh>();
  const resizeHandleLowerRef = useRef<Mesh>();
  const resizeHandleUpperRef = useRef<Mesh>();
  const resizeHandleLeftRef = useRef<Mesh>();
  const resizeHandleRightRef = useRef<Mesh>();
  const pointerDown = useRef<boolean>(false);
  const solarPanelLinesRef = useRef<LineData[]>();

  const pvModel = getPvModule(pvModelName) ?? getPvModule('SPR-X21-335-BLK');

  // be sure to get the updated parent so that this memorized element can move with it
  const parent = useStore((state) => {
    for (const e of state.elements) {
      if (e.id === parentId) {
        return e;
      }
    }
  });
  if (parent) {
    cx = cx * parent.lx;
    cz = cz * parent.lz;
  }

  if (pvModel) {
    lz = pvModel.thickness;
  }

  const hx = lx / 2;
  const hy = ly / 2;
  const hz = lz / 2;
  const positionLL = new Vector3(-hx, -hy, hz);
  const positionUL = new Vector3(-hx, hy, hz);
  const positionLR = new Vector3(hx, -hy, hz);
  const positionUR = new Vector3(hx, hy, hz);
  const solarPanel = getElementById(id) as SolarPanelModelOnWall;

  useEffect(() => {
    if (solarPanel && showSolarRadiationHeatmap) {
      const heatmap = getHeatmap(solarPanel.id);
      if (heatmap) {
        setHeatmapTexture(Util.fetchHeatmapTexture(heatmap, solarRadiationHeatmapMaxValue ?? 5));
      }
    }
  }, [showSolarRadiationHeatmap, solarRadiationHeatmapMaxValue]);

  useEffect(() => {
    if (pvModel) {
      let mx, my;
      if (orientation === Orientation.portrait) {
        mx = Math.max(1, Math.round(lx / pvModel.width));
        my = Math.max(1, Math.round(ly / pvModel.length));
      } else {
        mx = Math.max(1, Math.round(lx / pvModel.length));
        my = Math.max(1, Math.round(ly / pvModel.width));
      }
      setNx(mx);
      setNy(my);
      solarPanelLinesRef.current = [];
      const dx = lx / mx;
      const dy = ly / my;
      for (let i = 1; i < mx; i++) {
        solarPanelLinesRef.current.push({
          points: [new Vector3(-hx + i * dx, -hy, lz), new Vector3(-hx + i * dx, hy, lz)],
        } as LineData);
      }
      for (let i = 1; i < my; i++) {
        solarPanelLinesRef.current.push({
          points: [new Vector3(-hx, -hy + i * dy, lz), new Vector3(hx, -hy + i * dy, lz)],
        } as LineData);
      }
    }
  }, [orientation, pvModelName, lx, ly, lz]);

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

  const cachedTexture = useMemo(() => {
    let cachedTexture: Texture;
    switch (orientation) {
      case Orientation.portrait:
        cachedTexture =
          pvModel?.color === 'Blue'
            ? getSolarPanelTexture(SolarPanelTextureType.BluePortrait)
            : getSolarPanelTexture(SolarPanelTextureType.BlackPortrait);
        break;
      default:
        cachedTexture =
          pvModel?.color === 'Blue'
            ? getSolarPanelTexture(SolarPanelTextureType.BlueLandscape)
            : getSolarPanelTexture(SolarPanelTextureType.BlackLandscape);
    }
    return cachedTexture;
  }, [solarPanelTextures, orientation, pvModel?.color]);

  const texture = useMemo(() => {
    let t: Texture = new Texture();
    if (cachedTexture && cachedTexture.image) {
      t.image = cachedTexture.image;
      t.needsUpdate = true;
      t.wrapS = t.wrapT = RepeatWrapping;
      t.offset.set(0, 0);
      t.repeat.set(nx, ny);
    }
    return t;
  }, [cachedTexture, nx, ny]);

  const euler = useMemo(() => {
    return new Euler(HALF_PI, 0, 0);
  }, []);

  const hoverHandle = (e: ThreeEvent<MouseEvent>, handle: MoveHandleType | ResizeHandleType | RotateHandleType) => {
    if (e.intersections.length > 0) {
      const intersected = e.intersections[0].object === e.eventObject;
      if (intersected) {
        setHoveredHandle(handle);
        if (handle === MoveHandleType.Top) {
          domElement.style.cursor = 'move';
        } else if (
          handle === RotateHandleType.Lower ||
          handle === RotateHandleType.Upper ||
          handle === RotateHandleType.Tilt
        ) {
          domElement.style.cursor = 'grab';
        } else {
          domElement.style.cursor = 'pointer';
        }
      }
    }
  };

  const noHoverHandle = () => {
    setHoveredHandle(null);
    domElement.style.cursor = 'default';
  };

  const baseSize = Math.max(1, (lx + ly) / 16);
  const resizeHandleSize = RESIZE_HANDLE_SIZE * baseSize * 1.5;
  const moveHandleSize = MOVE_HANDLE_RADIUS * baseSize * 2;

  return (
    <group name={'Solar Panel Group Grandpa ' + id} rotation={euler} position={[cx, 0, cz + hz]}>
      <group name={'Solar Panel Group Dad ' + id}>
        {/* draw panel */}
        <Box
          receiveShadow={shadowEnabled}
          castShadow={shadowEnabled}
          uuid={id}
          ref={baseRef}
          args={[lx, ly, lz]}
          name={'Solar Panel'}
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
                  state.contextMenuObjectType = ObjectType.SolarPanel;
                }
              }
            });
          }}
          onPointerOver={(e) => {
            if (e.intersections.length > 0) {
              const intersected = e.intersections[0].object === baseRef.current;
              if (intersected) {
                domElement.style.cursor = 'move';
                setHovered(true);
              }
            }
          }}
          onPointerOut={(e) => {
            domElement.style.cursor = 'default';
            setHovered(false);
          }}
        >
          <meshStandardMaterial attachArray="material" color={color} />
          <meshStandardMaterial attachArray="material" color={color} />
          <meshStandardMaterial attachArray="material" color={color} />
          <meshStandardMaterial attachArray="material" color={color} />
          {showSolarRadiationHeatmap && heatmapTexture ? (
            <meshBasicMaterial attachArray="material" map={heatmapTexture} />
          ) : (
            <meshStandardMaterial attachArray="material" map={texture} color={color} />
          )}
          <meshStandardMaterial attachArray="material" color={color} />
        </Box>

        {showSolarRadiationHeatmap &&
          heatmapTexture &&
          solarPanelLinesRef.current &&
          solarPanelLinesRef.current.map((lineData, index) => {
            return (
              <Line
                name={'Solar Panel Lines'}
                key={index}
                userData={{ unintersectable: true }}
                points={lineData.points}
                castShadow={false}
                receiveShadow={false}
                lineWidth={0.2}
                color={'black'}
              />
            );
          })}

        {/* simulation panel */}
        <Plane
          name={'Solar Panel Simulation Plane'}
          uuid={id}
          args={[lx, ly]}
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
              [-hx, -hy, 0],
              [-hx, hy, 0],
              [hx, hy, 0],
              [hx, -hy, 0],
              [-hx, -hy, 0],
            ]}
            castShadow={false}
            receiveShadow={false}
            lineWidth={2}
            color={LOCKED_ELEMENT_SELECTION_COLOR}
          />
        )}

        {/* move & resize handles */}
        {selected && !locked && (
          <>
            {/* draw move handle */}
            <Sphere
              ref={moveHandleRef}
              position={new Vector3(0, 0, 0)}
              args={[moveHandleSize, 6, 6]}
              name={MoveHandleType.Default}
              onPointerOver={(e) => {
                hoverHandle(e, MoveHandleType.Top);
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

            {/* draw resize handles */}
            <group>
              <Box
                ref={resizeHandleLowerRef}
                position={[(positionLL.x + positionLR.x) / 2, positionLL.y, positionLL.z]}
                args={[resizeHandleSize, resizeHandleSize, lz * 1.2]}
                name={ResizeHandleType.Lower}
                onPointerDown={(e) => {
                  selectMe(id, e, ActionType.Resize);
                  if (resizeHandleLeftRef.current) {
                    setCommonStore((state) => {
                      const anchor = resizeHandleLowerRef.current!.localToWorld(new Vector3(0, ly, -positionLL.z));
                      state.resizeAnchor.copy(anchor);
                    });
                  }
                }}
                onPointerOver={(e) => {
                  hoverHandle(e, ResizeHandleType.Lower);
                }}
                onPointerOut={(e) => {
                  noHoverHandle();
                }}
              >
                <meshStandardMaterial
                  attach="material"
                  color={
                    hoveredHandle === ResizeHandleType.Lower || resizeHandleType === ResizeHandleType.Lower
                      ? HIGHLIGHT_HANDLE_COLOR
                      : RESIZE_HANDLE_COLOR
                  }
                />
              </Box>
              <Box
                ref={resizeHandleUpperRef}
                position={[(positionUL.x + positionUR.x) / 2, positionUL.y, positionUL.z]}
                args={[resizeHandleSize, resizeHandleSize, lz * 1.2]}
                name={ResizeHandleType.Upper}
                onPointerDown={(e) => {
                  selectMe(id, e, ActionType.Resize);
                  if (resizeHandleLeftRef.current) {
                    setCommonStore((state) => {
                      const anchor = resizeHandleUpperRef.current!.localToWorld(new Vector3(0, -ly, -positionUL.z));
                      state.resizeAnchor.copy(anchor);
                    });
                  }
                }}
                onPointerOver={(e) => {
                  hoverHandle(e, ResizeHandleType.Upper);
                }}
                onPointerOut={(e) => {
                  noHoverHandle();
                }}
              >
                <meshStandardMaterial
                  attach="material"
                  color={
                    hoveredHandle === ResizeHandleType.Upper || resizeHandleType === ResizeHandleType.Upper
                      ? HIGHLIGHT_HANDLE_COLOR
                      : RESIZE_HANDLE_COLOR
                  }
                />
              </Box>
              <Box
                ref={resizeHandleLeftRef}
                position={[positionLL.x, (positionLL.y + positionUL.y) / 2, positionLL.z]}
                args={[resizeHandleSize, resizeHandleSize, lz * 1.2]}
                name={ResizeHandleType.Left}
                onPointerDown={(e) => {
                  selectMe(id, e, ActionType.Resize);
                  if (resizeHandleLeftRef.current) {
                    setCommonStore((state) => {
                      const anchor = resizeHandleLeftRef.current!.localToWorld(new Vector3(lx, 0, -positionLL.z));
                      state.resizeAnchor.copy(anchor);
                    });
                  }
                }}
                onPointerOver={(e) => {
                  hoverHandle(e, ResizeHandleType.Left);
                }}
                onPointerOut={(e) => {
                  noHoverHandle();
                }}
              >
                <meshStandardMaterial
                  attach="material"
                  color={
                    hoveredHandle === ResizeHandleType.Left || resizeHandleType === ResizeHandleType.Left
                      ? HIGHLIGHT_HANDLE_COLOR
                      : RESIZE_HANDLE_COLOR
                  }
                />
              </Box>
              <Box
                ref={resizeHandleRightRef}
                position={[positionLR.x, (positionLR.y + positionUR.y) / 2, positionLR.z]}
                args={[resizeHandleSize, resizeHandleSize, lz * 1.2]}
                name={ResizeHandleType.Right}
                onPointerDown={(e) => {
                  selectMe(id, e, ActionType.Resize);
                  if (resizeHandleLeftRef.current) {
                    setCommonStore((state) => {
                      const anchor = resizeHandleRightRef.current!.localToWorld(new Vector3(-lx, 0, -positionLR.z));
                      state.resizeAnchor.copy(anchor);
                    });
                  }
                }}
                onPointerOver={(e) => {
                  hoverHandle(e, ResizeHandleType.Right);
                }}
                onPointerOut={(e) => {
                  noHoverHandle();
                }}
              >
                <meshStandardMaterial
                  attach="material"
                  color={
                    hoveredHandle === ResizeHandleType.Right || resizeHandleType === ResizeHandleType.Right
                      ? HIGHLIGHT_HANDLE_COLOR
                      : RESIZE_HANDLE_COLOR
                  }
                />
              </Box>
            </group>
          </>
        )}

        <Sunbeam drawSunbeam={drawSunBeam} absRotation={absRotation} />

        {/*draw label */}
        {(hovered || showLabel) && !selected && <Label sp={solarPanel} />}
      </group>
    </group>
  );
};

export default React.memo(SolarPanelOnWall);
