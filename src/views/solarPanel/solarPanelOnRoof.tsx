/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Box, Line, Plane, Sphere } from '@react-three/drei';
import { CanvasTexture, Euler, Mesh, Raycaster, RepeatWrapping, Texture, Vector2, Vector3 } from 'three';
import { useStore } from '../../stores/common';
import { useStoreRef } from 'src/stores/commonRef';
import * as Selector from '../../stores/selector';
import { ThreeEvent, useThree } from '@react-three/fiber';
import {
  HALF_PI,
  HIGHLIGHT_HANDLE_COLOR,
  MOVE_HANDLE_RADIUS,
  RESIZE_HANDLE_COLOR,
  RESIZE_HANDLE_SIZE,
  UNIT_VECTOR_POS_Z,
} from '../../constants';
import {
  ActionType,
  MoveHandleType,
  ObjectType,
  Orientation,
  ResizeHandleType,
  RotateHandleType,
  SolarPanelTextureType,
  TrackerType,
} from '../../types';
import { Util } from '../../Util';
import { SolarPanelModel } from '../../models/SolarPanelModel';
import { getSunDirection } from '../../analysis/sunTools';
import i18n from '../../i18n/i18n';
import { LineData } from '../LineData';
import { FoundationModel } from 'src/models/FoundationModel';
import { init } from 'i18next';

interface MoveHandleProps {
  id: string;
  handleSize: number;
}

interface ResizeHandleProps {
  pos: number[]; // x, y, z
  dms: number[]; // lz, handleSize
  handleType: ResizeHandleType;
  initResizeing: () => void;
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

const ResizeHandle = ({ pos, dms, handleType, initResizeing }: ResizeHandleProps) => {
  const [cx, cy, cz] = pos;
  const [lz, handleSize] = dms;
  const domElement = useThree().gl.domElement;
  const [color, setColor] = useState(RESIZE_HANDLE_COLOR);
  const ref = useRef<Mesh>(null);

  const handlePointerDown = () => {
    initResizeing();
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

export const useTexture = (id: string, nx: number, ny: number, pvModelName: string, orientation: Orientation) => {
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
  trackerType = TrackerType.NO_TRACKER,
  poleHeight,
  poleRadius,
  poleSpacing,
  drawSunBeam,
  rotation = [0, 0, 0],
  normal = [0, 0, 1],
  color = 'white',
  lineColor = 'black',
  lineWidth = 0.1,
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
  const showSolarRadiationHeatmap = useStore(Selector.showSolarRadiationHeatmap);
  const shadowEnabled = useStore(Selector.viewState.shadowEnabled);

  const pvModel = getPvModule(pvModelName) ?? getPvModule('SPR-X21-335-BLK');
  if (pvModel) {
    lz = pvModel.thickness;
  }

  const hx = lx / 2;
  const hy = ly / 2;
  const hz = lz / 2;

  const [nx, setNx] = useState(1);
  const [ny, setNy] = useState(1);
  const [showIntersectionPlane, setShowIntersectionPlane] = useState(false);
  const { gl, camera } = useThree();
  const [texture, heapmapTexture] = useTexture(id, nx, ny, pvModelName, orientation);

  const baseRef = useRef<Mesh>();
  const solarPanelLinesRef = useRef<LineData[]>();
  const intersectionPlaneRef = useRef<Mesh>(null);
  const pointerDownRef = useRef<boolean>(false);

  const position = useMemo(() => new Vector3(cx, cy, cz + hz), [cx, cy, cz, hz]);
  const euler = useMemo(() => new Euler().fromArray([...rotation, 'ZXY']), [rotation]);
  const ray = useMemo(() => new Raycaster(), []);
  const mouse = useMemo(() => new Vector2(), []);

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

  // add pointerup eventlistener
  useEffect(() => {
    const handlePointerUp = () => {
      useStoreRef.getState().setEnableOrbitController(true);
      pointerDownRef.current = false;
      setShowIntersectionPlane(false);
    };
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, []);

  const baseSize = Math.max(1, (lx + ly) / 16);
  const moveHandleSize = MOVE_HANDLE_RADIUS * baseSize * 2;
  const resizeHandleSize = RESIZE_HANDLE_SIZE * baseSize * 1.5;

  const initResizing = () => {
    setShowIntersectionPlane(true);
    pointerDownRef.current = true;
    useStoreRef.getState().setEnableOrbitController(false);
  };

  const setRayCast = (e: PointerEvent) => {
    mouse.x = (e.offsetX / gl.domElement.clientWidth) * 2 - 1;
    mouse.y = -(e.offsetY / gl.domElement.clientHeight) * 2 + 1;
    ray.setFromCamera(mouse, camera);
  };

  const handleIntersectionPlanePointerMove = (event: ThreeEvent<PointerEvent>) => {
    if (intersectionPlaneRef.current && pointerDownRef.current) {
      setRayCast(event);
      const intersects = ray.intersectObjects([intersectionPlaneRef.current]);
      if (intersects.length > 0) {
        const pointer = intersects[0].point;
        if (pointer.z < 0.001) {
          return;
        }
        setCommonStore((state) => {
          for (const e of state.elements) {
            if (e.id === id && foundationModel) {
              const anchor = state.resizeAnchor;
              const fCenter = new Vector3(foundationModel.cx, foundationModel.cy, foundationModel.lz);
              const r = new Vector3()
                .subVectors(pointer, anchor)
                .applyEuler(new Euler(0, 0, -rotation[2] - foundationModel.rotation[2]));

              switch (state.resizeHandleType) {
                case ResizeHandleType.Left:
                case ResizeHandleType.Right: {
                  const unitLenght =
                    (e as SolarPanelModel).orientation === Orientation.landscape ? pvModel.length : pvModel.width;
                  const dx = Math.abs(r.x);
                  const nx = Math.max(1, Math.ceil((dx - unitLenght / 2) / unitLenght));
                  const lx = nx * unitLenght;
                  const v = new Vector3((Math.sign(r.x) * lx) / 2, 0, 0).applyEuler(
                    new Euler(0, 0, rotation[2] + foundationModel.rotation[2]),
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
                  const dl = Util.squareRootOfSquareSum(dy, dz);
                  const unitLenght =
                    (e as SolarPanelModel).orientation === Orientation.landscape ? pvModel.width : pvModel.length;
                  const nl = Math.max(1, Math.ceil((dl - unitLenght / 2) / unitLenght));
                  const l = nl * unitLenght;
                  const v = new Vector3(0, (l * Math.sign(r.y)) / 2, 0).applyEuler(
                    new Euler(rotation[0], rotation[1], rotation[2] + foundationModel.rotation[2], 'ZXY'),
                  );
                  const center = new Vector3()
                    .addVectors(anchor, v)
                    .sub(fCenter)
                    .applyEuler(new Euler(0, 0, -foundationModel.rotation[2]));
                  e.ly = l;
                  e.cx = center.x / foundationModel.lx;
                  e.cy = center.y / foundationModel.ly;
                  e.cz = center.z - hz;
                  break;
                }
              }

              break;
            }
          }
        });
      }
    }
  };

  return (
    <group name={'Solar Panel Group Grandpa ' + id} rotation={euler} position={position}>
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
                initResizeing={initResizing}
              />
              <ResizeHandle
                pos={[hx, 0, hz]}
                dms={[lz, resizeHandleSize]}
                handleType={ResizeHandleType.Right}
                initResizeing={initResizing}
              />
              <ResizeHandle
                pos={[0, -hy, hz]}
                dms={[lz, resizeHandleSize]}
                handleType={ResizeHandleType.Lower}
                initResizeing={initResizing}
              />
              <ResizeHandle
                pos={[0, hy, hz]}
                dms={[lz, resizeHandleSize]}
                handleType={ResizeHandleType.Upper}
                initResizeing={initResizing}
              />
            </group>

            {/* intersection plane */}
            {showIntersectionPlane && (
              <Plane
                ref={intersectionPlaneRef}
                args={[1000, 1000]} // todo
                visible={false}
                onPointerMove={handleIntersectionPlanePointerMove}
              />
            )}
          </>
        )}

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
    </group>
  );
};

export default SolarPanelOnRoof;
