/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Box, Cone, Cylinder, Line, Ring, Sphere } from '@react-three/drei';
import { DoubleSide, Euler, Mesh, Quaternion, Raycaster, RepeatWrapping, TextureLoader, Vector2, Vector3 } from 'three';
import { useStore } from '../stores/common';
import { ThreeEvent, useThree } from '@react-three/fiber';
import { HIGHLIGHT_HANDLE_COLOR, MOVE_HANDLE_RADIUS, RESIZE_HANDLE_COLOR, RESIZE_HANDLE_SIZE } from '../constants';
import {
  ActionType,
  MoveHandleType,
  ObjectType,
  Orientation,
  ResizeHandleType,
  RotateHandleType,
  TrackerType,
} from '../types';
import { Util } from '../Util';
import { SolarPanelModel } from '../models/SolarPanelModel';
import SolarPanelBlueLandscapeImage from '../resources/solar-panel-blue-landscape.png';
import SolarPanelBluePortraitImage from '../resources/solar-panel-blue-portrait.png';
import SolarPanelBlackLandscapeImage from '../resources/solar-panel-black-landscape.png';
import SolarPanelBlackPortraitImage from '../resources/solar-panel-black-portrait.png';
import { getSunDirection } from '../analysis/sunTools';
import RotateHandle from '../components/rotateHandle';

const SolarPanel = ({
  id,
  pvModel,
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
  parent,
  orientation = Orientation.portrait,
}: SolarPanelModel) => {
  const setCommonStore = useStore((state) => state.set);
  const date = useStore((state) => state.world.date);
  const latitude = useStore((state) => state.world.latitude);
  const shadowEnabled = useStore((state) => state.viewState.shadowEnabled);
  const getElementById = useStore((state) => state.getElementById);
  const selectMe = useStore((state) => state.selectMe);
  const updateElementById = useStore((state) => state.updateElementById);
  const resizeHandleType = useStore((state) => state.resizeHandleType);
  const rotateHandleType = useStore((state) => state.rotateHandleType);
  const {
    gl: { domElement },
    camera,
  } = useThree();
  const [hovered, setHovered] = useState(false);
  const [hoveredHandle, setHoveredHandle] = useState<MoveHandleType | ResizeHandleType | RotateHandleType | null>(null);
  const [nx, setNx] = useState(1);
  const [ny, setNy] = useState(1);
  const [updateFlag, setUpdateFlag] = useState(false);
  const baseRef = useRef<Mesh>();
  const moveHandleRef = useRef<Mesh>();
  const resizeHandleLowerRef = useRef<Mesh>();
  const resizeHandleUpperRef = useRef<Mesh>();
  const resizeHandleLeftRef = useRef<Mesh>();
  const resizeHandleRightRef = useRef<Mesh>();
  const tiltHandleRef = useRef<Mesh>();
  const pointerDown = useRef<boolean>(false);
  const ray = useMemo(() => new Raycaster(), []);

  const heliodonRadius = useStore((state) => state.heliodonRadius);
  const sunBeamLength = Math.max(100, heliodonRadius);

  if (parent) {
    const p = getElementById(parent.id);
    if (p) {
      switch (p.type) {
        case ObjectType.Foundation:
          cz = p.cz + p.lz / 2;
          if (Util.isZero(rotation[2])) {
            cx = p.cx + cx * p.lx;
            cy = p.cy + cy * p.ly;
          } else {
            // we must rotate the real length, not normalized length
            const v = new Vector3(cx * p.lx, cy * p.ly, 0);
            v.applyAxisAngle(Util.UNIT_VECTOR_POS_Z, rotation[2]);
            cx = p.cx + v.x;
            cy = p.cy + v.y;
          }
          break;
        case ObjectType.Cuboid:
          if (Util.isZero(rotation[2])) {
            cx = p.cx + cx * p.lx;
            cy = p.cy + cy * p.ly;
            cz = p.cz + cz * p.lz;
          } else {
            // we must rotate the real length, not normalized length
            const v = new Vector3(cx * p.lx, cy * p.ly, cz * p.lz);
            v.applyAxisAngle(Util.UNIT_VECTOR_POS_Z, rotation[2]);
            cx = p.cx + v.x;
            cy = p.cy + v.y;
            cz = p.cz + v.z;
          }
          break;
      }
    }
  }
  cz = poleHeight + lz / 2 + parent.lz;
  lz = pvModel.thickness;

  // deal with a single solar panel
  if (pvModel.width && ly === pvModel.length && orientation === Orientation.landscape) {
    const tmp = lx;
    lx = ly;
    ly = tmp;
  }

  const hx = lx / 2;
  const hy = ly / 2;
  const hz = lz / 2;
  const positionLL = new Vector3(-hx, -hy, hz);
  const positionUL = new Vector3(-hx, hy, hz);
  const positionLR = new Vector3(hx, -hy, hz);
  const positionUR = new Vector3(hx, hy, hz);
  const element = getElementById(id);

  useEffect(() => {
    if (orientation === Orientation.portrait) {
      setNx(Math.max(1, Math.round(lx / pvModel.width)));
      setNy(Math.max(1, Math.round(ly / pvModel.length)));
    } else {
      setNx(Math.max(1, Math.round(lx / pvModel.length)));
      setNy(Math.max(1, Math.round(ly / pvModel.width)));
    }
  }, [orientation, pvModel, lx, ly]);

  useEffect(() => {
    const handlePointerUp = () => {
      setCommonStore((state) => {
        state.enableOrbitController = true;
      });
      pointerDown.current = false;
      setShowTiltAngle(false);
    };
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, []);

  const texture = useMemo(() => {
    const loader = new TextureLoader();
    let texture;
    switch (orientation) {
      case Orientation.portrait:
        texture = loader.load(
          pvModel.color === 'Blue' ? SolarPanelBluePortraitImage : SolarPanelBlackPortraitImage,
          (texture) => {
            texture.wrapS = texture.wrapT = RepeatWrapping;
            texture.offset.set(0, 0);
            texture.repeat.set(nx, ny);
            setUpdateFlag(!updateFlag);
          },
        );
        break;
      default:
        texture = loader.load(
          pvModel.color === 'Blue' ? SolarPanelBlueLandscapeImage : SolarPanelBlackLandscapeImage,
          (texture) => {
            texture.wrapS = texture.wrapT = RepeatWrapping;
            texture.offset.set(0, 0);
            texture.repeat.set(nx, ny);
            setUpdateFlag(!updateFlag);
          },
        );
    }
    return texture;
  }, [orientation, pvModel.color, nx, ny]);

  const euler = useMemo(() => {
    const v = new Vector3().fromArray(normal);
    if (Util.isSame(v, Util.UNIT_VECTOR_POS_Z)) {
      // top face in model coordinate system
      return new Euler(0, 0, rotation[2]);
    } else if (Util.isSame(v, Util.UNIT_VECTOR_POS_X)) {
      // east face in model coordinate system
      return new Euler(0, Util.HALF_PI, rotation[2]);
    } else if (Util.isSame(v, Util.UNIT_VECTOR_NEG_X)) {
      // west face in model coordinate system
      return new Euler(0, Util.HALF_PI, rotation[2]);
    } else if (Util.isSame(v, Util.UNIT_VECTOR_POS_Y)) {
      // south face in the model coordinate system
      return new Euler(0, Util.HALF_PI, rotation[2] + Util.HALF_PI);
    } else if (Util.isSame(v, Util.UNIT_VECTOR_NEG_Y)) {
      // north face in the model coordinate system
      return new Euler(0, Util.HALF_PI, rotation[2] + Util.HALF_PI);
    }
    return new Euler(0, 0, rotation[2]);
  }, [normal, rotation]);

  const hoverHandle = (e: ThreeEvent<MouseEvent>, handle: MoveHandleType | ResizeHandleType | RotateHandleType) => {
    if (e.intersections.length > 0) {
      const intersected = e.intersections[0].object === e.eventObject;
      if (intersected) {
        setHoveredHandle(handle);
        if (
          // unfortunately, I cannot find a way to tell the type of an enum variable
          handle === MoveHandleType.Top ||
          handle === ResizeHandleType.Upper ||
          handle === ResizeHandleType.Lower ||
          handle === ResizeHandleType.Left ||
          handle === ResizeHandleType.Right ||
          handle === RotateHandleType.Lower ||
          handle === RotateHandleType.Upper ||
          handle === RotateHandleType.Tilt
        ) {
          domElement.style.cursor = 'move';
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

  const sunDirection = useMemo(() => {
    return getSunDirection(new Date(date), latitude);
  }, [date, latitude]);
  const rot = getElementById(parent.id)?.rotation[2];
  const rotatedSunDirection = rot ? sunDirection.clone().applyAxisAngle(Util.UNIT_VECTOR_POS_Z, -rot) : sunDirection;

  const relativeEuler = useMemo(() => {
    if (sunDirection.z > 0) {
      switch (trackerType) {
        case TrackerType.ALTAZIMUTH_DUAL_AXIS_TRACKER:
          const qrotAADAT = new Quaternion().setFromUnitVectors(Util.UNIT_VECTOR_POS_Z, rotatedSunDirection);
          return new Euler().setFromQuaternion(qrotAADAT);
        case TrackerType.HORIZONTAL_SINGLE_AXIS_TRACKER:
          const qrotHSAT = new Quaternion().setFromUnitVectors(
            Util.UNIT_VECTOR_POS_Z,
            new Vector3(rotatedSunDirection.x, 0, rotatedSunDirection.z).normalize(),
          );
          return new Euler().setFromQuaternion(qrotHSAT);
        case TrackerType.VERTICAL_SINGLE_AXIS_TRACKER:
          const v2d = new Vector3(rotatedSunDirection.x, 0, rotatedSunDirection.z).normalize();
          const dot = Util.UNIT_VECTOR_POS_Z.dot(v2d);
          return new Euler(tiltAngle, 0, Math.sign(v2d.x) * Math.acos(dot), 'ZXY');
      }
    }
    return new Euler(tiltAngle, 0, relativeAzimuth, 'ZXY');
  }, [trackerType, sunDirection, tiltAngle, relativeAzimuth]);

  const normalVector = useMemo(() => {
    const v = new Vector3();
    return drawSunBeam ? v.fromArray(normal).applyEuler(relativeEuler) : v;
  }, [drawSunBeam, normal, relativeEuler]);

  const poles: Vector3[] = [];
  const poleZ = -poleHeight / 2 - lz / 2;
  const poleNx = Math.floor((0.5 * lx) / poleSpacing);
  const poleNy = Math.floor((0.5 * ly) / poleSpacing);
  const sinTilt = 0.5 * Math.sin(tiltAngle);
  const cosAz = Math.cos(relativeAzimuth) * poleSpacing;
  const sinAz = Math.sin(relativeAzimuth) * poleSpacing;
  for (let ix = -poleNx; ix <= poleNx; ix++) {
    for (let iy = -poleNy; iy <= poleNy; iy++) {
      const xi = ix * cosAz - iy * sinAz;
      const yi = ix * sinAz + iy * cosAz;
      poles.push(new Vector3(xi, yi, poleZ + sinTilt * poleSpacing * iy));
    }
  }

  const ratio = Math.max(1, Math.max(lx, ly) / 8);
  const resizeHandleSize = RESIZE_HANDLE_SIZE * ratio;
  const moveHandleSize = MOVE_HANDLE_RADIUS * ratio;
  const rotateHandleSize = (ratio * 2) / 3;
  const tiltHandleSize = (ratio * 2) / 3;

  const degree = new Array(13).fill(0);
  const [showTiltAngle, setShowTiltAngle] = useState(false);

  return (
    <group name={'Solar Panel Group ' + id} rotation={euler} position={[cx, cy, cz + hz]}>
      <group rotation={relativeEuler}>
        {/* draw panel */}
        <Box
          receiveShadow={shadowEnabled}
          castShadow={shadowEnabled}
          userData={{ simulation: true, aabb: true }}
          uuid={id}
          ref={baseRef}
          args={[lx, lz, ly]}
          rotation={[Math.PI / 2, 0, 0]}
          name={'Solar Panel'}
          onPointerDown={(e) => {
            if (e.button === 2) return; // ignore right-click
            selectMe(id, e, ActionType.Select);
          }}
          onContextMenu={(e) => {
            selectMe(id, e, ActionType.Select);
            setCommonStore((state) => {
              state.contextMenuObjectType = ObjectType.SolarPanel;
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
          <meshStandardMaterial attachArray="material" map={texture} />
          <meshStandardMaterial attachArray="material" color={color} />
          <meshStandardMaterial attachArray="material" color={color} />
          <meshStandardMaterial attachArray="material" color={color} />
        </Box>

        {/* move & resize handles */}
        {selected && !locked && (
          <>
            {/* draw move handle */}
            <Sphere
              ref={moveHandleRef}
              position={new Vector3(0, 0, 0)}
              args={[moveHandleSize, 6, 6]}
              name={'Handle'}
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
                      const anchor = resizeHandleLowerRef.current!.localToWorld(new Vector3(0, ly, 0));
                      state.resizeAnchor.set(anchor.x, anchor.y);
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
                      const anchor = resizeHandleUpperRef.current!.localToWorld(new Vector3(0, -ly, 0));
                      state.resizeAnchor.set(anchor.x, anchor.y);
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
                      const anchor = resizeHandleLeftRef.current!.localToWorld(new Vector3(lx, 0, 0));
                      state.resizeAnchor.set(anchor.x, anchor.y);
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
                      const anchor = resizeHandleRightRef.current!.localToWorld(new Vector3(-lx, 0, 0));
                      state.resizeAnchor.set(anchor.x, anchor.y);
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

        {/* wireframe */}
        {!selected && (
          <group>
            {/* draw wireframe lines upper face */}
            <Line
              points={[positionLL, positionLR]}
              name={'Line LL-LR Upper Face'}
              lineWidth={lineWidth}
              color={lineColor}
            />
            <Line
              points={[positionLR, positionUR]}
              name={'Line LR-UR Upper Face'}
              lineWidth={lineWidth}
              color={lineColor}
            />
            <Line
              points={[positionUR, positionUL]}
              name={'Line UR-UL Upper Face'}
              lineWidth={lineWidth}
              color={lineColor}
            />
            <Line
              points={[positionUL, positionLL]}
              name={'Line UL-LL Upper Face'}
              lineWidth={lineWidth}
              color={lineColor}
            />

            {/* draw wireframe lines lower face */}
            <Line
              points={[
                [positionLL.x, positionLL.y, -hz],
                [positionLR.x, positionLR.y, -hz],
              ]}
              name={'Line LL-LR Lower Face'}
              lineWidth={lineWidth}
              color={lineColor}
            />
            <Line
              points={[
                [positionLR.x, positionLR.y, -hz],
                [positionUR.x, positionUR.y, -hz],
              ]}
              name={'Line LR-UR Lower Face'}
              lineWidth={lineWidth}
              color={lineColor}
            />
            <Line
              points={[
                [positionUR.x, positionUR.y, -hz],
                [positionUL.x, positionUL.y, -hz],
              ]}
              name={'Line UR-UL Lower Face'}
              lineWidth={lineWidth}
              color={lineColor}
            />
            <Line
              points={[
                [positionUL.x, positionUL.y, -hz],
                [positionLL.x, positionLL.y, -hz],
              ]}
              name={'Line UL-LL Lower Face'}
              lineWidth={lineWidth}
              color={lineColor}
            />

            {/* draw wireframe vertical lines */}
            <Line
              points={[[positionLL.x, positionLL.y, -hz], positionLL]}
              name={'Line LL-LL Vertical'}
              lineWidth={lineWidth}
              color={lineColor}
            />
            <Line
              points={[[positionLR.x, positionLR.y, -hz], positionLR]}
              name={'Line LR-LR Vertical'}
              lineWidth={lineWidth}
              color={lineColor}
            />
            <Line
              points={[[positionUL.x, positionUL.y, -hz], positionUL]}
              name={'Line UL-UL Vertical'}
              lineWidth={lineWidth}
              color={lineColor}
            />
            <Line
              points={[[positionUR.x, positionUR.y, -hz], positionUR]}
              name={'Line UR-UR Vertical'}
              lineWidth={lineWidth}
              color={lineColor}
            />
          </group>
        )}
      </group>

      {/* draw rotate handles */}
      {selected && !locked && trackerType === TrackerType.NO_TRACKER && (
        <group position={[0, 0, -poleHeight]} rotation={[0, 0, relativeEuler.z]}>
          {/* rotate handles */}
          <RotateHandle
            id={id}
            position={[0, -ly / 2 - rotateHandleSize / 2, poleHeight]}
            color={
              hoveredHandle === RotateHandleType.Upper || rotateHandleType === RotateHandleType.Upper
                ? HIGHLIGHT_HANDLE_COLOR
                : RESIZE_HANDLE_COLOR
            }
            ratio={rotateHandleSize}
            handleType={RotateHandleType.Upper}
            hoverHandle={hoverHandle}
            noHoverHandle={noHoverHandle}
          />
          <RotateHandle
            id={id}
            position={[0, ly / 2 + rotateHandleSize / 2, poleHeight]}
            color={
              hoveredHandle === RotateHandleType.Lower || rotateHandleType === RotateHandleType.Lower
                ? HIGHLIGHT_HANDLE_COLOR
                : RESIZE_HANDLE_COLOR
            }
            ratio={rotateHandleSize}
            handleType={RotateHandleType.Lower}
            hoverHandle={hoverHandle}
            noHoverHandle={noHoverHandle}
          />
        </group>
      )}

      {/* draw tilt handles */}
      {selected && !locked && trackerType === TrackerType.NO_TRACKER && (
        <>
          {/* ring handles */}
          <Ring
            name={RotateHandleType.Tilt}
            args={[tiltHandleSize, 1.1 * tiltHandleSize, 18, 2, -Math.PI / 2, Math.PI]}
            rotation={[0, -Math.PI / 2, relativeEuler.z, 'ZXY']}
            onPointerOver={(e) => {
              hoverHandle(e, RotateHandleType.Tilt);
            }}
            onPointerOut={(e) => {
              noHoverHandle();
            }}
            onPointerDown={(e) => {
              setShowTiltAngle(true);
              if (hoveredHandle) {
                setCommonStore((state) => {
                  state.enableOrbitController = false;
                });
                pointerDown.current = true;
              }
            }}
          >
            <meshStandardMaterial
              side={DoubleSide}
              color={
                hoveredHandle === RotateHandleType.Tilt || showTiltAngle ? HIGHLIGHT_HANDLE_COLOR : RESIZE_HANDLE_COLOR
              }
            />
          </Ring>
          {showTiltAngle && (
            <>
              {/* intersection plane */}
              <Ring
                ref={tiltHandleRef}
                name={'Solar panel tilt handle'}
                args={[tiltHandleSize, 2 * tiltHandleSize, 18, 2, -Math.PI / 2, Math.PI]}
                rotation={[0, -Math.PI / 2, relativeEuler.z, 'ZXY']}
                onPointerMove={(e) => {
                  if (pointerDown.current) {
                    const mouse = new Vector2();
                    mouse.x = (e.offsetX / domElement.clientWidth) * 2 - 1;
                    mouse.y = -(e.offsetY / domElement.clientHeight) * 2 + 1;
                    ray.setFromCamera(mouse, camera);
                    if (tiltHandleRef.current) {
                      const intersects = ray.intersectObjects([tiltHandleRef.current]);
                      if (intersects.length > 0) {
                        const p = intersects[0].point;
                        const parent = tiltHandleRef.current.parent;
                        if (parent) {
                          const ov = parent.position; // rotate point in world coordinate
                          const cv = new Vector3().subVectors(p, ov);
                          const wr = relativeAzimuth + rotation[2];
                          const sign =
                            wr % Math.PI === 0
                              ? Math.sign(-cv.y) * Math.sign(Math.cos(wr))
                              : Math.sign(cv.x) * Math.sign(Math.sin(wr));
                          const angle = cv.angleTo(new Vector3(0, 0, 1)) * sign;
                          updateElementById(id, { tiltAngle: angle });
                        }
                      }
                    }
                  }
                }}
              >
                <meshStandardMaterial depthTest={false} transparent={true} opacity={0.5} side={DoubleSide} />
              </Ring>
              {/* pointer */}
              <Line
                points={[
                  [0, 0, tiltHandleSize],
                  [0, 0, 1.75 * tiltHandleSize],
                ]}
                rotation={new Euler(tiltAngle, 0, relativeEuler.z, 'ZXY')}
                lineWidth={1}
              />
              {/* scale */}
              {degree.map((e, i) => {
                return (
                  <group key={i} rotation={new Euler((Math.PI / 12) * i - Math.PI / 2, 0, relativeEuler.z, 'ZXY')}>
                    <Line
                      points={[
                        [0, 0, 1.8 * tiltHandleSize],
                        [0, 0, 2 * tiltHandleSize],
                      ]}
                      color={'white'}
                      transparent={true}
                      opacity={0.5}
                    />
                    <textSprite
                      text={`${i * 15 - 90}°`}
                      fontSize={20 * tiltHandleSize}
                      fontFace={'Times Roman'}
                      textHeight={0.15 * tiltHandleSize}
                      position={[0, 0, 1.6 * tiltHandleSize]}
                    />
                  </group>
                );
              })}
              {/* show current degree */}
              <group rotation={new Euler(tiltAngle, 0, relativeEuler.z, 'ZXY')}>
                <textSprite
                  text={`${Math.floor((tiltAngle / Math.PI) * 180)}°`}
                  fontSize={20 * tiltHandleSize}
                  fontFace={'Times Roman'}
                  textHeight={0.2 * tiltHandleSize}
                  position={[0, 0, 0.75 * tiltHandleSize]}
                />
              </group>
            </>
          )}
        </>
      )}

      {/* draw poles */}
      {poleHeight > 0 &&
        poles.map((p, i) => {
          return (
            <Cylinder
              key={i}
              name={'Pole ' + i}
              castShadow={shadowEnabled}
              receiveShadow={shadowEnabled}
              args={[poleRadius, poleRadius, poleHeight + (p.z - poleZ) * 2 + lz, 6, 2]}
              position={p}
              rotation={[Math.PI / 2, 0, 0]}
            >
              <meshStandardMaterial attach="material" color={color} />
            </Cylinder>
          );
        })}

      {/*draw sun beam*/}
      {drawSunBeam && sunDirection.z > 0 && (
        <group>
          <Line
            points={[[0, 0, 0], rotatedSunDirection.clone().multiplyScalar(sunBeamLength)]}
            name={'Sun Beam'}
            lineWidth={0.5}
            color={'white'}
          />
          <Line
            points={[[0, 0, 0], normalVector.clone().multiplyScalar(0.75)]}
            name={'Normal Vector'}
            lineWidth={0.5}
            color={'white'}
          />
          <Line
            points={[rotatedSunDirection.clone().multiplyScalar(0.5), normalVector.clone().multiplyScalar(0.5)]}
            name={'Angle'}
            lineWidth={0.5}
            color={'white'}
          />
          <textSprite
            name={'Angle Value'}
            text={Util.toDegrees(rotatedSunDirection.angleTo(normalVector)).toFixed(1) + '°'}
            fontSize={20}
            fontFace={'Times Roman'}
            textHeight={0.1}
            position={rotatedSunDirection
              .clone()
              .multiplyScalar(0.75)
              .add(normalVector.clone().multiplyScalar(0.75))
              .multiplyScalar(0.5)}
          />
          <group rotation={relativeEuler}>
            <Cone
              args={[0.04, 0.2, 4, 2]}
              name={'Normal Vector Arrow Head'}
              rotation={[Math.PI / 2, 0, 0]}
              position={[0, 0, 0.75]}
            >
              <meshStandardMaterial attach="material" color={'white'} />
            </Cone>
          </group>
        </group>
      )}

      {/*draw label */}
      {(hovered || showLabel) && !selected && (
        <textSprite
          name={'Label'}
          text={element?.label ? element.label : 'Solar Panel'}
          fontSize={20}
          fontFace={'Times Roman'}
          textHeight={0.2}
          position={[0, 0, lz + 0.2]}
        />
      )}
    </group>
  );
};

// this one may not use React.memo as it needs to move with its parent.
// there may be a way to notify a memorized component when its parent changes
export default SolarPanel;
