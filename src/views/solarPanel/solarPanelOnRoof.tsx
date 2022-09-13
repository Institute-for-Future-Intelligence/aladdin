/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Box, Circle, Cone, Cylinder, Line, Plane, Ring, Sphere, Torus } from '@react-three/drei';
import { CanvasTexture, DoubleSide, Euler, Mesh, Raycaster, RepeatWrapping, Texture, Vector2, Vector3 } from 'three';
import { useStore } from '../../stores/common';
import { useStoreRef } from 'src/stores/commonRef';
import * as Selector from '../../stores/selector';
import { ThreeEvent, useThree } from '@react-three/fiber';
import {
  HALF_PI,
  HIGHLIGHT_HANDLE_COLOR,
  MOVE_HANDLE_RADIUS,
  ORIGIN_VECTOR2,
  RESIZE_HANDLE_COLOR,
  RESIZE_HANDLE_SIZE,
  TWO_PI,
  UNIT_VECTOR_POS_Z,
  ZERO_TOLERANCE,
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
import { SolarPanelModel } from '../../models/SolarPanelModel';
import { LineData } from '../LineData';
import { FoundationModel } from 'src/models/FoundationModel';
import { RoofModel } from 'src/models/RoofModel';
import { WallModel } from 'src/models/WallModel';
import { spBoundaryCheck, spCollisionCheck } from '../roof/roofRenderer';
import { UndoableChange } from 'src/undo/UndoableChange';
import { UnoableResizeSolarPanelOnRoof } from 'src/undo/UndoableResize';
import { getSunDirection } from 'src/analysis/sunTools';
import i18n from 'src/i18n/i18n';
import { RoofUtil } from '../roof/RoofUtil';

interface MoveHandleProps {
  id: string;
  handleSize: number;
}

interface ResizeHandleProps {
  pos: number[]; // x, y, z
  dms: number[]; // lz, handleSize
  handleType: ResizeHandleType;
  initPointerDown: () => void;
}

interface RotateHandleProps {
  position: [x: number, y: number, z: number];
  ratio: number;
  handleType: RotateHandleType;
  initPointerDown: () => void;
}

interface TiltHanldeProps {
  rotationZ: number;
  tiltAngle: number;
  handleSize: number;
  initPointerDown: () => void;
  handlePointerMove: (e: ThreeEvent<PointerEvent>, tiltHandleRef: React.MutableRefObject<Mesh | undefined>) => void;
  handlePointerUp: () => void;
}

interface SumbeamProps {
  drawSunbeam: boolean;
  rotation: number[];
  normal: number[];
  relativeEuler: Euler;
  fRotation: number;
}

interface LabelProps {
  id: string;
}

const MoveHandle = ({ id, handleSize }: MoveHandleProps) => {
  const domElement = useThree().gl.domElement;

  return (
    <Sphere
      args={[handleSize, 6, 6]}
      name={MoveHandleType.Default}
      onPointerOver={() => {
        domElement.style.cursor = 'move';
      }}
      onPointerOut={() => {
        domElement.style.cursor = 'default';
      }}
      onPointerDown={(e) => {
        useStore.getState().selectMe(id, e, ActionType.Move);
      }}
    >
      <meshStandardMaterial color={'orange'} />
    </Sphere>
  );
};

const ResizeHandle = ({ pos, dms, handleType, initPointerDown }: ResizeHandleProps) => {
  const [cx, cy, cz] = pos;
  const [lz, handleSize] = dms;
  const domElement = useThree().gl.domElement;
  const [color, setColor] = useState(RESIZE_HANDLE_COLOR);
  const ref = useRef<Mesh>(null);

  const handlePointerDown = () => {
    initPointerDown();
    const vector = new Vector3();
    switch (handleType) {
      case ResizeHandleType.Left:
      case ResizeHandleType.Right:
        vector.set(-cx * 2, 0, -cz);
        break;
      case ResizeHandleType.Upper:
      case ResizeHandleType.Lower:
        vector.set(0, -cy * 2, -cz);
        break;
    }
    useStore.getState().set((state) => {
      if (ref.current) {
        state.resizeAnchor = ref.current.localToWorld(vector);
        state.resizeHandleType = handleType;
      }
    });
  };

  return (
    <Box
      ref={ref}
      position={[cx, cy, cz]}
      args={[handleSize, handleSize, lz * 1.2]}
      name={handleType}
      onPointerDown={handlePointerDown}
      onPointerOver={() => {
        domElement.style.cursor = 'pointer';
        setColor(HIGHLIGHT_HANDLE_COLOR);
      }}
      onPointerOut={() => {
        domElement.style.cursor = 'default';
        setColor(RESIZE_HANDLE_COLOR);
      }}
    >
      <meshStandardMaterial color={color} />
    </Box>
  );
};

const RotateHandle = ({ position, ratio, handleType, initPointerDown }: RotateHandleProps) => {
  const [color, setColor] = useState(RESIZE_HANDLE_COLOR);
  const domElement = useThree().gl.domElement;
  const rotationHandleLMesh = useMemo(() => <meshStandardMaterial color={color} />, [color]);

  const handlePointerDown = () => {
    initPointerDown();
    useStore.getState().set((state) => {
      state.rotateHandleType = handleType;
    });
  };

  return (
    <group position={position} rotation={[HALF_PI, 0, 0]} scale={ratio} name={handleType}>
      <group>
        <Torus args={[0.15, 0.05, 6, 8, (3 / 2) * Math.PI]} rotation={[HALF_PI, 0, HALF_PI]}>
          {rotationHandleLMesh}
        </Torus>
        <Cone args={[0.1, 0.1, 6]} rotation={[HALF_PI, 0, 0]} position={[0.15, 0, 0.05]}>
          {rotationHandleLMesh}
        </Cone>
        <Circle args={[0.05, 6]} rotation={[0, HALF_PI, 0]} position={[0, 0, 0.15]}>
          {rotationHandleLMesh}
        </Circle>
      </group>
      <Plane
        name={handleType}
        args={[0.35, 0.35]}
        position={[0, 0.05, 0]}
        rotation={[-HALF_PI, 0, 0]}
        visible={false}
        onPointerDown={handlePointerDown}
        onPointerOver={(e) => {
          domElement.style.cursor = 'grab';
          setColor(HIGHLIGHT_HANDLE_COLOR);
        }}
        onPointerOut={() => {
          domElement.style.cursor = 'default';
          setColor(RESIZE_HANDLE_COLOR);
        }}
      />
    </group>
  );
};

const TiltHandle = ({
  rotationZ,
  tiltAngle,
  handleSize,
  initPointerDown,
  handlePointerMove,
  handlePointerUp,
}: TiltHanldeProps) => {
  const { gl } = useThree();
  const [color, setColor] = useState(RESIZE_HANDLE_COLOR);
  const [showTiltAngle, setShowTiltAngle] = useState(false);
  const tiltHandleRef = useRef<Mesh>();
  const degree = useMemo(() => new Array(13).fill(0), []);
  const setCommonStore = useStore(Selector.set);

  return (
    <>
      {/* ring handles */}
      <Ring
        name={RotateHandleType.Tilt}
        args={[handleSize, 1.1 * handleSize, 18, 2, -HALF_PI, Math.PI]}
        rotation={[0, -HALF_PI, rotationZ, 'ZXY']}
        onPointerOver={() => {
          gl.domElement.style.cursor = 'grab';
          setColor(HIGHLIGHT_HANDLE_COLOR);
        }}
        onPointerOut={() => {
          gl.domElement.style.cursor = 'default';
          setColor(RESIZE_HANDLE_COLOR);
        }}
        onPointerDown={(e) => {
          initPointerDown();
          e.stopPropagation();
          setShowTiltAngle(true);
          setCommonStore((state) => {
            state.rotateHandleType = RotateHandleType.Tilt;
          });
        }}
      >
        <meshStandardMaterial side={DoubleSide} color={color} />
      </Ring>
      {showTiltAngle && (
        <>
          {/* intersection plane */}
          <Ring
            ref={tiltHandleRef}
            name={'Solar panel tilt handle'}
            args={[handleSize, 2 * handleSize, 18, 2, -HALF_PI, Math.PI]}
            rotation={[0, -HALF_PI, rotationZ, 'ZXY']}
            onPointerDown={(e) => {}}
            onPointerMove={(e) => {
              handlePointerMove(e, tiltHandleRef);
            }}
            onPointerUp={() => {
              setShowTiltAngle(false);
              handlePointerUp();
            }}
          >
            <meshStandardMaterial depthTest={false} transparent={true} opacity={0.5} side={DoubleSide} />
          </Ring>
          {/* pointer */}
          <Line
            points={[
              [0, 0, handleSize],
              [0, 0, 1.75 * handleSize],
            ]}
            rotation={new Euler(tiltAngle, 0, rotationZ, 'ZXY')}
            lineWidth={1}
          />
          {/* scale */}
          {degree.map((e, i) => {
            return (
              <group key={i} rotation={new Euler((Math.PI / 12) * i - HALF_PI, 0, rotationZ, 'ZXY')}>
                <Line
                  points={[
                    [0, 0, 1.8 * handleSize],
                    [0, 0, 2 * handleSize],
                  ]}
                  color={'white'}
                  transparent={true}
                  opacity={0.5}
                />
                <textSprite
                  userData={{ unintersectable: true }}
                  text={`${i * 15 - 90}°`}
                  fontSize={20 * handleSize}
                  fontFace={'Times Roman'}
                  textHeight={0.15 * handleSize}
                  position={[0, 0, 1.6 * handleSize]}
                />
              </group>
            );
          })}
          {/* show current degree */}
          <group rotation={new Euler(tiltAngle, 0, rotationZ, 'ZXY')}>
            <textSprite
              userData={{ unintersectable: true }}
              text={`${Math.floor((tiltAngle / Math.PI) * 180)}°`}
              fontSize={20 * handleSize}
              fontFace={'Times Roman'}
              textHeight={0.2 * handleSize}
              position={[0, 0, 0.75 * handleSize]}
            />
          </group>
        </>
      )}
    </>
  );
};

const Sunbeam = React.memo(({ drawSunbeam, rotation, normal, relativeEuler, fRotation }: SumbeamProps) => {
  const euler = new Euler().fromArray([...rotation, 'ZXY']);

  const normalVector = useMemo(() => {
    if (rotation[0] === 0) {
      return new Vector3()
        .fromArray(normal)
        .applyEuler(new Euler(relativeEuler.x, relativeEuler.y, relativeEuler.z + rotation[2] + fRotation, 'ZXY'));
    }
    return new Vector3(0, 0, 1).applyEuler(euler).applyEuler(new Euler(0, 0, fRotation));
  }, [rotation, relativeEuler, fRotation]);

  const date = useStore(Selector.world.date);
  const latitude = useStore(Selector.world.latitude);
  const sceneRadius = useStore(Selector.sceneRadius);
  const sunBeamLength = Math.max(100, 10 * sceneRadius);

  const sunDirection = useMemo(() => {
    return getSunDirection(new Date(date), latitude);
  }, [date, latitude]);

  return (
    <>
      {drawSunbeam && sunDirection.z > 0 && (
        <group rotation={[-euler.x, 0, -euler.z - fRotation]}>
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
          <group
            position={normalVector.clone().multiplyScalar(0.75)}
            rotation={[HALF_PI + euler.x + relativeEuler.x, 0, euler.z + relativeEuler.z + fRotation, 'ZXY']}
          >
            <Cone
              userData={{ unintersectable: true }}
              args={[0.04, 0.2, 4, 2]}
              name={'Normal Vector Arrow Head'}
              rotation={[0, 0, -relativeEuler.y]}
            >
              <meshStandardMaterial color={'white'} />
            </Cone>
          </group>
        </group>
      )}
    </>
  );
});

const Label = ({ id }: LabelProps) => {
  useStore(Selector.elements);
  const getElementById = useStore(Selector.getElementById);
  const language = useStore(Selector.language);
  const lang = { lng: language };

  const sp = getElementById(id) as SolarPanelModel;

  if (!sp || !sp.foundationId) {
    return null;
  }

  const foundation = getElementById(sp.foundationId) as FoundationModel;

  if (!foundation) {
    return null;
  }

  const fCenter = new Vector3(foundation.cx, foundation.cy, foundation.cz);

  const center = new Vector3(
    sp.cx * foundation.lx,
    sp.cy * foundation.ly,
    foundation.lz / 2 + sp.cz + sp.lz / 2 + sp.poleHeight,
  )
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

export const useSPTexture = (id: string, nx: number, ny: number, pvModelName: string, orientation: Orientation) => {
  const showSolarRadiationHeatmap = useStore(Selector.showSolarRadiationHeatmap);
  const solarRadiationHeatmapMaxValue = useStore(Selector.viewState.solarRadiationHeatmapMaxValue);
  const solarPanelTextures = useStore(Selector.solarPanelTextures);

  const getPvModule = useStore(Selector.getPvModule);
  const getSolarPanelTexture = useStore(Selector.getSolarPanelTexture);

  const pvModel = getPvModule(pvModelName) ?? getPvModule('SPR-X21-335-BLK');

  const [heatmapTexture, setHeatmapTexture] = useState<CanvasTexture | null>(null);

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

  useEffect(() => {
    if (showSolarRadiationHeatmap) {
      const heatmap = useStore.getState().getHeatmap(id);
      if (heatmap) {
        setHeatmapTexture(Util.fetchHeatmapTexture(heatmap, solarRadiationHeatmapMaxValue ?? 5));
      }
    }
  }, [showSolarRadiationHeatmap, solarRadiationHeatmapMaxValue]);

  return [texture, heatmapTexture];
};

const SolarPanelOnRoof = ({
  id,
  pvModelName,
  cx,
  cy,
  cz,
  lx,
  ly,
  lz,
  tiltAngle,
  relativeAzimuth,
  poleHeight,
  poleRadius,
  poleSpacing,
  drawSunBeam,
  rotation = [0, 0, 0],
  normal = [0, 0, 1],
  color = 'white',
  selected = false,
  showLabel = false,
  locked = false,
  parentId,
  foundationId,
  foundationModel,
  orientation = Orientation.portrait,
}: SolarPanelModel) => {
  const setCommonStore = useStore(Selector.set);
  const selectMe = useStore(Selector.selectMe);
  const getPvModule = useStore(Selector.getPvModule);
  const getElementById = useStore(Selector.getElementById);
  const showSolarRadiationHeatmap = useStore(Selector.showSolarRadiationHeatmap);
  const shadowEnabled = useStore(Selector.viewState.shadowEnabled);

  const pvModel = getPvModule(pvModelName) ?? getPvModule('SPR-X21-335-BLK');
  if (pvModel) {
    lz = pvModel.thickness;
  }

  const hx = lx / 2;
  const hy = ly / 2;
  const hz = lz / 2;
  const radialSegmentsPole = useStore.getState().elements.length < 100 ? 4 : 2;
  const poleZ = -poleHeight / 2 - lz / 2;

  const [nx, setNx] = useState(1);
  const [ny, setNy] = useState(1);
  const [drawPole, setDrawPole] = useState(rotation[0] === 0);
  const [showIntersectionPlane, setShowIntersectionPlane] = useState(false);
  const [hovered, setHovered] = useState(false);
  const { gl, camera } = useThree();
  const [texture, heapmapTexture] = useSPTexture(id, nx, ny, pvModelName, orientation);

  const baseRef = useRef<Mesh>();
  const solarPanelLinesRef = useRef<LineData[]>();
  const intersectionPlaneRef = useRef<Mesh>(null);
  const pointerDownRef = useRef<boolean>(false);

  const oldPosRef = useRef<number[] | null>(null);
  const oldDmsRef = useRef<number[] | null>(null);
  const oldAziRef = useRef<number | null>(null);
  const oldTiltRef = useRef<number | null>(null);
  const oldRotRef = useRef<number[] | null>(null);
  const oldNorRef = useRef<number[] | null>(null);

  const ray = useMemo(() => new Raycaster(), []);
  const mouse = useMemo(() => new Vector2(), []);

  const position = useMemo(() => {
    if (drawPole) {
      return new Vector3(cx, cy, cz + hz + poleHeight);
    }
    return new Vector3(cx, cy, cz + hz);
  }, [cx, cy, cz, hz, drawPole, poleHeight]);

  const euler = useMemo(() => {
    return new Euler().fromArray([...rotation, 'ZXY']);
  }, [rotation]);

  const relativeEuler = useMemo(() => {
    if (drawPole) {
      return new Euler(tiltAngle, 0, relativeAzimuth, 'ZXY');
    }
    return new Euler();
  }, [tiltAngle, relativeAzimuth, drawPole]);

  const poles = useMemo<Vector3[]>(() => {
    const poleArray: Vector3[] = [];
    const poleNx = Math.floor((0.5 * lx) / poleSpacing);
    const poleNy = Math.floor((0.5 * ly * Math.abs(Math.cos(tiltAngle))) / poleSpacing);
    const sinTilt = 0.5 * Math.sin(tiltAngle);
    const cosAz = Math.cos(relativeAzimuth) * poleSpacing;
    const sinAz = Math.sin(relativeAzimuth) * poleSpacing;
    for (let ix = -poleNx; ix <= poleNx; ix++) {
      for (let iy = -poleNy; iy <= poleNy; iy++) {
        const xi = ix * cosAz - iy * sinAz;
        const yi = ix * sinAz + iy * cosAz;
        poleArray.push(new Vector3(xi, yi, poleZ + sinTilt * poleSpacing * iy));
      }
    }
    return poleArray;
  }, [relativeAzimuth, tiltAngle, poleSpacing, lx, ly, poleHeight, lz]);

  useEffect(() => {
    setDrawPole(rotation[0] === 0);
  }, [rotation]);

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

  const undoOperation = () => {
    setCommonStore((state) => {
      if (
        oldPosRef.current &&
        oldAziRef.current !== null &&
        oldNorRef.current &&
        oldDmsRef.current &&
        oldRotRef.current
      ) {
        for (const e of state.elements) {
          if (e.id === id) {
            [e.cx, e.cy, e.cz] = [...oldPosRef.current];
            [e.lx, e.ly, e.lz] = [...oldDmsRef.current];
            (e as SolarPanelModel).relativeAzimuth = oldAziRef.current;
            e.normal = [...oldNorRef.current];
            e.rotation = [...oldRotRef.current];
            break;
          }
        }
      }
    });
  };

  // add pointerup eventlistener
  useEffect(() => {
    const handlePointerUp = () => {
      if (pointerDownRef.current && (useStore.getState().rotateHandleType || useStore.getState().resizeHandleType)) {
        const roof = getElementById(parentId) as RoofModel;
        if (roof && foundationId) {
          const wall = getElementById(roof.wallsId[0]) as WallModel;
          const sp = getElementById(id) as SolarPanelModel;
          const foundation = getElementById(foundationId) as FoundationModel;

          if (sp && foundation && wall) {
            const boundaryVertices = RoofUtil.getBoundaryVertices(roof.id, wall, roof.overhang);
            const solarPanelVertices = RoofUtil.getSolarPanelVerticesOnRoof(sp, foundation);
            if (
              !spBoundaryCheck(solarPanelVertices, boundaryVertices) ||
              !spCollisionCheck(sp, foundation, solarPanelVertices)
            ) {
              undoOperation();
            } else {
              AddUndoableOperation(sp);
            }
          }
        }
        useStoreRef.getState().setEnableOrbitController(true);
        pointerDownRef.current = false;
        setShowIntersectionPlane(false);
        setCommonStore((state) => {
          state.moveHandleType = null;
          state.resizeHandleType = null;
          state.rotateHandleType = null;
          state.updateSolarPanelOnRoofFlag = !state.updateSolarPanelOnRoofFlag;
        });
      }
    };
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, []);

  const baseSize = Math.max(1, (lx + ly) / 16);
  const moveHandleSize = MOVE_HANDLE_RADIUS * baseSize * 2;
  const resizeHandleSize = RESIZE_HANDLE_SIZE * baseSize * 1.5;
  const rotateHandleSize = (baseSize * 2) / 3;
  const tiltHandleSize = rotateHandleSize;

  const initPointerDown = () => {
    if (foundationModel) {
      oldPosRef.current = [cx / foundationModel.lx, cy / foundationModel.ly, cz - foundationModel.lz / 2];
      oldDmsRef.current = [lx, ly, lz];
      oldAziRef.current = relativeAzimuth;
      oldTiltRef.current = tiltAngle;
      oldNorRef.current = [...normal];
      oldRotRef.current = [...rotation];
    }
    setShowIntersectionPlane(true);
    pointerDownRef.current = true;
    useStoreRef.getState().setEnableOrbitController(false);
  };

  const setRayCast = (e: PointerEvent) => {
    mouse.x = (e.offsetX / gl.domElement.clientWidth) * 2 - 1;
    mouse.y = -(e.offsetY / gl.domElement.clientHeight) * 2 + 1;
    ray.setFromCamera(mouse, camera);
  };

  const isTouchingRoof = (newLy: number, newTAngle: number) => {
    if (drawPole && newTAngle !== 0 && 0.5 * newLy * Math.abs(Math.sin(newTAngle)) > poleHeight) {
      return true;
    }
    return false;
  };

  const intersectionPlanePointerMove = (event: ThreeEvent<PointerEvent>) => {
    if (intersectionPlaneRef.current && pointerDownRef.current && foundationModel) {
      setRayCast(event);
      const intersects = ray.intersectObjects([intersectionPlaneRef.current]);
      if (intersects.length > 0) {
        const pointer = intersects[0].point;
        if (pointer.z < 0.001) {
          return;
        }
        const rotateHandleType = useStore.getState().rotateHandleType;
        if (useStore.getState().resizeHandleType) {
          const azimuth = drawPole ? relativeAzimuth : 0;
          const anchor = useStore.getState().resizeAnchor;
          const fCenter = new Vector3(foundationModel.cx, foundationModel.cy, foundationModel.lz);
          const r = new Vector3()
            .subVectors(pointer, anchor)
            .applyEuler(new Euler(0, 0, -rotation[2] - foundationModel.rotation[2] - azimuth));
          setCommonStore((state) => {
            for (const e of state.elements) {
              if (e.id === id && foundationModel) {
                switch (state.resizeHandleType) {
                  case ResizeHandleType.Left:
                  case ResizeHandleType.Right: {
                    const unitLenght =
                      (e as SolarPanelModel).orientation === Orientation.landscape ? pvModel.length : pvModel.width;
                    const dx = Math.abs(r.x);
                    const nx = Math.max(1, Math.ceil((dx - unitLenght / 2) / unitLenght));
                    const lx = nx * unitLenght;
                    const v = new Vector3((Math.sign(r.x) * lx) / 2, 0, 0).applyEuler(
                      new Euler(0, 0, rotation[2] + foundationModel.rotation[2] + azimuth),
                    );
                    const center = new Vector3()
                      .addVectors(anchor, v)
                      .sub(fCenter)
                      .applyEuler(new Euler(0, 0, -foundationModel.rotation[2]));
                    e.lx = lx;
                    e.cx = center.x / foundationModel.lx;
                    e.cy = center.y / foundationModel.ly;
                    break;
                  }
                  case ResizeHandleType.Upper:
                  case ResizeHandleType.Lower: {
                    const dy = Math.abs(r.y);
                    const dz = Math.abs(r.z);
                    const dl = Math.hypot(dy, dz);
                    const unitLenght =
                      (e as SolarPanelModel).orientation === Orientation.landscape ? pvModel.width : pvModel.length;
                    const nl = Math.max(1, Math.ceil((dl - unitLenght / 2) / unitLenght));
                    const l = nl * unitLenght;
                    const v = new Vector3(0, (l * Math.sign(r.y)) / 2, 0).applyEuler(
                      new Euler(rotation[0], rotation[1], rotation[2] + foundationModel.rotation[2] + azimuth, 'ZXY'),
                    );
                    const center = new Vector3()
                      .addVectors(anchor, v)
                      .sub(fCenter)
                      .applyEuler(new Euler(0, 0, -foundationModel.rotation[2]));
                    if (!isTouchingRoof(l, tiltAngle)) {
                      e.ly = l;
                      e.cx = center.x / foundationModel.lx;
                      e.cy = center.y / foundationModel.ly;
                      if (!drawPole) {
                        e.cz = center.z - hz;
                      }
                    }
                    break;
                  }
                }
                break;
              }
            }
          });
        } else if (rotateHandleType === RotateHandleType.Lower || rotateHandleType === RotateHandleType.Upper) {
          const pr = foundationModel.rotation[2]; // parent rotation
          const pc = new Vector2(foundationModel.cx, foundationModel.cy); // world parent center
          const cc = new Vector2(cx, cy).rotateAround(ORIGIN_VECTOR2, pr);
          const wc = new Vector2().addVectors(cc, pc); // world current center
          const rotation =
            Math.atan2(-pointer.x + wc.x, pointer.y - wc.y) -
            pr +
            (rotateHandleType === RotateHandleType.Lower ? Math.PI : 0);
          const offset = Math.abs(rotation) > Math.PI ? -Math.sign(rotation) * TWO_PI : 0; // make sure angle is between -PI to PI
          const newAzimuth = rotation + offset;
          useStore.getState().updateSolarCollectorRelativeAzimuthById(id, newAzimuth);
        }
      }
    }
  };

  const tiltHandlePointerMove = (
    e: ThreeEvent<PointerEvent>,
    tiltHandleRef: React.MutableRefObject<Mesh | undefined>,
  ) => {
    if (pointerDownRef.current) {
      setRayCast(e);
      if (tiltHandleRef.current && useStore.getState().rotateHandleType === RotateHandleType.Tilt) {
        const intersects = ray.intersectObjects([tiltHandleRef.current]);
        if (intersects.length > 0) {
          const pointer = intersects[0].point;
          const center = tiltHandleRef.current.parent?.localToWorld(new Vector3()); // rotate center in world coordinate
          if (center) {
            const cv = new Vector3().subVectors(pointer, center);
            let angle = cv.angleTo(UNIT_VECTOR_POS_Z);
            const touch = 0.5 * ly * Math.abs(Math.sin(angle)) > poleHeight;
            if (!touch) {
              const wr = relativeAzimuth + rotation[2] + (foundationModel?.rotation[2] ?? 0);
              const sign =
                wr % Math.PI === 0
                  ? Math.sign(-cv.y) * Math.sign(Math.cos(wr))
                  : Math.sign(cv.x) * Math.sign(Math.sin(wr));
              angle *= sign;
              useStore.getState().updateSolarPanelTiltAngleById(id, angle);
            }
          }
        }
      }
    }
  };

  const tiltHandlePointerUp = () => {
    const sp = getElementById(id) as SolarPanelModel;
    if (sp && oldTiltRef.current && Math.abs(sp.tiltAngle - oldTiltRef.current) > ZERO_TOLERANCE) {
      const undoableChange = {
        name: 'Set Solar Panel Tilt Angle',
        timestamp: Date.now(),
        oldValue: oldTiltRef.current,
        newValue: sp.tiltAngle,
        changedElementId: id,
        changedElementType: ObjectType.SolarPanel,
        undo: () => {
          useStore
            .getState()
            .updateSolarPanelTiltAngleById(undoableChange.changedElementId, undoableChange.oldValue as number);
        },
        redo: () => {
          useStore
            .getState()
            .updateSolarPanelTiltAngleById(undoableChange.changedElementId, undoableChange.newValue as number);
        },
      } as UndoableChange;
      useStore.getState().addUndoable(undoableChange);
    }
  };

  const AddUndoableOperation = (sp: SolarPanelModel) => {
    if (useStore.getState().resizeHandleType) {
      if (oldDmsRef.current && oldPosRef.current && oldNorRef.current && oldRotRef.current) {
        const undoableResize = {
          name: 'Resize Solar Panel On Roof',
          timestamp: Date.now(),
          id: sp.id,
          oldDms: [...oldDmsRef.current],
          oldNor: [...oldNorRef.current],
          oldPos: [...oldPosRef.current],
          oldRot: [...oldRotRef.current],
          newDms: [sp.lx, sp.ly, sp.lz],
          newPos: [sp.cx, sp.cy, sp.cz],
          newNor: [...sp.normal],
          newRot: [...sp.rotation],
          undo() {
            setCommonStore((state) => {
              for (const e of state.elements) {
                if (e.id === undoableResize.id) {
                  [e.cx, e.cy, e.cz] = [...undoableResize.oldPos];
                  [e.lx, e.ly, e.lz] = [...undoableResize.oldDms];
                  e.normal = [...undoableResize.oldNor];
                  e.rotation = [...undoableResize.oldRot];
                  break;
                }
              }
            });
          },
          redo() {
            setCommonStore((state) => {
              for (const e of state.elements) {
                if (e.id === undoableResize.id) {
                  [e.cx, e.cy, e.cz] = [...undoableResize.newPos];
                  [e.lx, e.ly, e.lz] = [...undoableResize.newDms];
                  e.normal = [...undoableResize.newNor];
                  e.rotation = [...undoableResize.newRot];
                  break;
                }
              }
            });
          },
        } as UnoableResizeSolarPanelOnRoof;
        useStore.getState().addUndoable(undoableResize);
      }
    } else if (useStore.getState().rotateHandleType) {
      if (oldAziRef.current !== undefined) {
        const undoableRotate = {
          name: 'Rotate Solar Panel On Roof',
          timestamp: Date.now(),
          oldValue: oldAziRef.current,
          newValue: sp.relativeAzimuth,
          changedElementId: sp.id,
          changedElementType: sp.type,
          undo: () => {
            useStore
              .getState()
              .updateSolarCollectorRelativeAzimuthById(
                undoableRotate.changedElementId,
                undoableRotate.oldValue as number,
              );
          },
          redo: () => {
            useStore
              .getState()
              .updateSolarCollectorRelativeAzimuthById(
                undoableRotate.changedElementId,
                undoableRotate.newValue as number,
              );
          },
        } as UndoableChange;
        useStore.getState().addUndoable(undoableRotate);
      }
    }
  };

  const parent = useStore((state) => {
    for (const e of state.elements) {
      if (e.id === parentId) {
        return e;
      }
    }
  });

  if (parent && parent.type === ObjectType.Roof && (parent as RoofModel).opacity === 0) {
    return null;
  }

  return (
    <group name={'Solar Panel Group Grandpa ' + id} rotation={euler} position={position}>
      <group name={'Solar Panel Group Dad ' + id} rotation={relativeEuler}>
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
                setHovered(true);
              }
            }
          }}
          onPointerOut={(e) => {
            setHovered(false);
          }}
        >
          <meshStandardMaterial attachArray="material" color={color} />
          <meshStandardMaterial attachArray="material" color={color} />
          <meshStandardMaterial attachArray="material" color={color} />
          <meshStandardMaterial attachArray="material" color={color} />
          <meshStandardMaterial
            attachArray="material"
            color={color}
            map={showSolarRadiationHeatmap && heapmapTexture ? heapmapTexture : texture}
          />
          <meshStandardMaterial attachArray="material" color={color} />
        </Box>

        {/* move & resize handles */}
        {selected && !locked && (
          <>
            {/* move handle */}
            <MoveHandle id={id} handleSize={moveHandleSize} />

            {/* resize handles */}
            <group name="Resize Handle Group">
              <ResizeHandle
                pos={[-hx, 0, hz]}
                dms={[lz, resizeHandleSize]}
                handleType={ResizeHandleType.Left}
                initPointerDown={initPointerDown}
              />
              <ResizeHandle
                pos={[hx, 0, hz]}
                dms={[lz, resizeHandleSize]}
                handleType={ResizeHandleType.Right}
                initPointerDown={initPointerDown}
              />
              <ResizeHandle
                pos={[0, -hy, hz]}
                dms={[lz, resizeHandleSize]}
                handleType={ResizeHandleType.Lower}
                initPointerDown={initPointerDown}
              />
              <ResizeHandle
                pos={[0, hy, hz]}
                dms={[lz, resizeHandleSize]}
                handleType={ResizeHandleType.Upper}
                initPointerDown={initPointerDown}
              />
            </group>
          </>
        )}

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

        {showSolarRadiationHeatmap &&
          heapmapTexture &&
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
      </group>

      {/* rotate and tilt handles */}
      {drawPole && selected && !locked && (
        <>
          <group name={'Rotate Handle Group'} rotation={[0, 0, relativeEuler.z]}>
            <RotateHandle
              position={[0, -hy - 1, 0]}
              ratio={1}
              handleType={RotateHandleType.Lower}
              initPointerDown={initPointerDown}
            />
            <RotateHandle
              position={[0, hy + 1, 0]}
              ratio={1}
              handleType={RotateHandleType.Upper}
              initPointerDown={initPointerDown}
            />
          </group>
          <TiltHandle
            rotationZ={relativeAzimuth}
            tiltAngle={tiltAngle}
            handleSize={tiltHandleSize}
            initPointerDown={initPointerDown}
            handlePointerMove={tiltHandlePointerMove}
            handlePointerUp={tiltHandlePointerUp}
          />
        </>
      )}

      {/* intersection plane */}
      {showIntersectionPlane && (
        <Plane
          ref={intersectionPlaneRef}
          args={[1000, 1000]}
          visible={false}
          onPointerMove={intersectionPlanePointerMove}
        />
      )}

      {drawPole &&
        poleHeight > 0 &&
        poles.map((p, i) => {
          return (
            <Cylinder
              userData={{ unintersectable: true }}
              key={i}
              name={'Pole ' + i}
              castShadow={false}
              receiveShadow={false}
              args={[poleRadius, poleRadius, poleHeight + (p.z - poleZ) * 2 + lz, radialSegmentsPole, 1]}
              position={p}
              rotation={[HALF_PI, 0, 0]}
            >
              <meshStandardMaterial attach="material" color={color} />
            </Cylinder>
          );
        })}

      {/*draw sun beam*/}
      <Sunbeam
        drawSunbeam={drawSunBeam}
        rotation={rotation}
        normal={normal}
        relativeEuler={relativeEuler}
        fRotation={foundationModel?.rotation[2] ?? 0}
      />

      {/*draw label */}
      {(hovered || showLabel) && !selected && <Label id={id} />}
    </group>
  );
};

export default SolarPanelOnRoof;
