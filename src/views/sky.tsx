/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, { useMemo, useRef } from 'react';
import { BackSide, DoubleSide, Euler, Mesh, Object3D, Raycaster, Vector2, Vector3 } from 'three';
import { ThreeEvent, useThree } from '@react-three/fiber';
import { Plane, useTexture } from '@react-three/drei';

import DefaultDaySkyImage from '../resources/daysky.jpg';
import DefaultNightSkyImage from '../resources/nightsky.jpg';
import DesertDaySkyImage from '../resources/desert.jpg';
import DesertNightSkyImage from '../resources/desert-night.jpg';
import ForestDaySkyImage from '../resources/forest.jpg';
import ForestNightSkyImage from '../resources/forest-night.jpg';
import GrasslandDaySkyImage from '../resources/grassland.jpg';
import GrasslandNightSkyImage from '../resources/grassland-night.jpg';

import { useStore } from '../stores/common';
import { useStoreRef } from 'src/stores/commonRef';
import * as Selector from '../stores/selector';
import { IntersectionPlaneType, ObjectType, ResizeHandleType } from '../types';
import { ElementModel } from '../models/ElementModel';
import { DEFAULT_SKY_RADIUS, GROUND_ID, HALF_PI, ORIGIN_VECTOR2, TWO_PI, UNIT_VECTOR_POS_Z_ARRAY } from '../constants';
import { Util } from 'src/Util';
import { PolygonModel } from 'src/models/PolygonModel';
import { Point2 } from 'src/models/Point2';

export interface SkyProps {
  theme?: string;
}

const Sky = ({ theme = 'Default' }: SkyProps) => {
  const setCommonStore = useStore(Selector.set);
  const selectNone = useStore(Selector.selectNone);
  const getSelectedElement = useStore(Selector.getSelectedElement);
  const getCameraDirection = useStore(Selector.getCameraDirection);
  const getResizeHandlePosition = useStore(Selector.getResizeHandlePosition);
  const getChildren = useStore(Selector.getChildren);
  const getElementById = useStore(Selector.getElementById);
  const resizeHandleType = useStore(Selector.resizeHandleType);
  const sunlightDirection = useStore(Selector.sunlightDirection);

  const {
    camera,
    gl: { domElement },
  } = useThree();
  const meshRef = useRef<Mesh>(null!);
  const grabRef = useRef<ElementModel | null>(null);
  const intersectionPlaneRef = useRef<Mesh>();
  const absPosMapRef = useRef<Map<string, Vector3>>(new Map());
  const polygonsAbsPosMapRef = useRef<Map<string, Vector2[]>>(new Map());
  const oldPositionRef = useRef<Vector3>(new Vector3());
  const newPositionRef = useRef<Vector3>(new Vector3());
  const oldChildrenPositionsMapRef = useRef<Map<string, Vector3>>(new Map<string, Vector3>());
  const newChildrenPositionsMapRef = useRef<Map<string, Vector3>>(new Map<string, Vector3>());
  const oldPolygonVerticesMapRef = useRef<Map<string, Point2[]>>(new Map<string, Point2[]>());
  const newPolygonVerticesMapRef = useRef<Map<string, Point2[]>>(new Map<string, Point2[]>());
  const oldDimensionRef = useRef<Vector3>(new Vector3(1, 1, 1));
  const newDimensionRef = useRef<Vector3>(new Vector3(1, 1, 1));
  const oldRotationRef = useRef<number[]>([0, 0, 1]);
  const newRotationRef = useRef<number[]>([0, 0, 1]);
  const ray = useMemo(() => new Raycaster(), []);

  const night = sunlightDirection.z <= 0;

  let intersectionPlaneType = IntersectionPlaneType.Sky;
  const intersectionPlanePosition = useMemo(() => new Vector3(), []);
  const intersectionPlaneAngle = useMemo(() => new Euler(), []);
  if (grabRef.current && resizeHandleType) {
    intersectionPlaneType = IntersectionPlaneType.Vertical;
    const handlePosition = getResizeHandlePosition(grabRef.current, resizeHandleType);
    const cameraDir = getCameraDirection();
    const rotation = -Math.atan2(cameraDir.x, cameraDir.y);
    intersectionPlanePosition.set(handlePosition.x, handlePosition.y, 0);
    intersectionPlaneAngle.set(-HALF_PI, 0, rotation, 'ZXY');
  }

  const scale = useMemo(() => {
    switch (theme) {
      case 'Desert':
        return 0.5;
      case 'Forest':
        return 0.3;
      case 'Grassland':
        return 0.2;
      default:
        return 0.2;
    }
  }, [theme]);

  const textureImg = useMemo(() => {
    switch (theme) {
      case 'Desert':
        return night ? DesertNightSkyImage : DesertDaySkyImage;
      case 'Forest':
        return night ? ForestNightSkyImage : ForestDaySkyImage;
      case 'Grassland':
        return night ? GrasslandNightSkyImage : GrasslandDaySkyImage;
      default:
        return night ? DefaultNightSkyImage : DefaultDaySkyImage;
    }
  }, [theme, night]);

  const texture = useTexture(textureImg);

  const legalOnGround = (type: ObjectType) => {
    return (
      type === ObjectType.Foundation ||
      type === ObjectType.Cuboid ||
      type === ObjectType.Tree ||
      type === ObjectType.Human
    );
  };

  const clickSky = (e: ThreeEvent<MouseEvent>) => {
    // We must check if there is really a first intersection, onClick does not guarantee it
    // onClick listener for an object can still fire an event even when the object is behind another one
    if (e.intersections.length > 0) {
      const skyClicked = e.intersections[0].object === meshRef.current;
      if (skyClicked) {
        selectNone();
        setCommonStore((state) => {
          state.clickObjectType = ObjectType.Sky;
        });
      } else {
        const selectedElement = getSelectedElement();
        const wallResizeHandle = useStore.getState().resizeHandleType;
        if (selectedElement) {
          if (legalOnGround(selectedElement.type)) {
            grabRef.current = selectedElement;
            if (selectedElement.type !== ObjectType.Foundation && selectedElement.type !== ObjectType.Cuboid) {
              useStoreRef.getState().setEnableOrbitController(false);
            }
          } else if (
            selectedElement.type === ObjectType.Wall &&
            (wallResizeHandle === ResizeHandleType.UpperLeft || wallResizeHandle === ResizeHandleType.UpperRight)
          ) {
            grabRef.current = selectedElement;
          }
        }
      }
    }
  };

  const getObjectId = (obj: Object3D | null): string => {
    if (!obj) return '';

    const nameArray = obj.name.split(' ');
    if (nameArray[2]) {
      return nameArray[2];
    }

    return getObjectId(obj.parent);
  };

  const getObjectChildById = (object: Object3D | null | undefined, id: string) => {
    if (object === null || object === undefined) return null;
    for (const obj of object.children) {
      if (obj.name.includes(`${id}`)) {
        return obj;
      }
    }
    return null;
  };

  const handleDetachParent = (elem: ElementModel, e: ElementModel) => {
    const contentRef = useStoreRef.getState().contentRef;
    const parentObject = getObjectChildById(contentRef?.current, elem.id);
    if (parentObject) {
      for (const obj of parentObject.children) {
        if (obj.name.includes(`${e.id}`)) {
          useStoreRef.getState().contentRef?.current?.add(obj);
          break;
        }
      }
    }
    e.parentId = GROUND_ID;
    const absPos = new Vector3(e.cx, e.cy, e.cz)
      .applyEuler(new Euler(0, 0, elem.rotation[2]))
      .add(oldPositionRef.current);
    e.cx = absPos.x;
    e.cy = absPos.y;
    e.cz = 0;
  };

  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    if (grabRef.current && grabRef.current.type && !grabRef.current.locked) {
      const mouse = new Vector2();
      mouse.x = (e.offsetX / domElement.clientWidth) * 2 - 1;
      mouse.y = -(e.offsetY / domElement.clientHeight) * 2 + 1;
      ray.setFromCamera(mouse, camera);
      let intersects;
      if (intersectionPlaneRef.current && intersectionPlaneType === IntersectionPlaneType.Vertical) {
        intersects = ray.intersectObjects([intersectionPlaneRef.current]);
        if (intersects && intersects.length > 0) {
          const p = intersects[0].point;
          switch (grabRef.current.type) {
            case ObjectType.Cuboid:
              if (
                resizeHandleType === ResizeHandleType.LowerLeftTop ||
                resizeHandleType === ResizeHandleType.UpperLeftTop ||
                resizeHandleType === ResizeHandleType.LowerRightTop ||
                resizeHandleType === ResizeHandleType.UpperRightTop
              ) {
                setCommonStore((state) => {
                  for (const e of state.elements) {
                    if (e.id === grabRef.current?.id) {
                      e.cz = Math.max(0.5, p.z / 2);
                      e.lz = Math.max(1, p.z);
                      break;
                    }
                  }
                  state.selectedElementHeight = Math.max(1, p.z);
                });

                const cuboidRef = useStoreRef.getState().cuboidRef;
                if (cuboidRef?.current) {
                  for (const obj of cuboidRef.current.children) {
                    if (obj.name.includes('Human') || obj.name.includes('Tree')) {
                      const absPos = absPosMapRef.current.get(getObjectId(obj));
                      if (absPos) {
                        // stand on top face
                        if (Math.abs(oldDimensionRef.current.z - absPos.z) < 0.01) {
                          obj.position.setZ(Math.max(p.z / 2, 0.5));
                        }
                        // stand on side faces
                        else {
                          obj.position.setZ(absPos.z - cuboidRef.current.position.z);
                        }
                      }
                    }
                  }
                }
              }
              break;
            case ObjectType.Wall:
              if (resizeHandleType === ResizeHandleType.UpperLeft || resizeHandleType === ResizeHandleType.UpperRight) {
                setCommonStore((state) => {
                  for (const e of state.elements) {
                    if (e.id === grabRef.current?.id) {
                      e.cz = Math.max(0.5, p.z / 2);
                      e.lz = Math.max(1, p.z);
                      break;
                    }
                  }
                  state.selectedElementHeight = Math.max(1, p.z);
                });
              }
              break;
          }
        }
      }
    }
  };

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    if (e.button === 2) return; // ignore right-click
    setCommonStore((state) => {
      state.contextMenuObjectType = null;
    });
    clickSky(e);

    const selectedElement = grabRef.current;
    if (selectedElement) {
      // save info for undo
      oldPositionRef.current.set(selectedElement.cx, selectedElement.cy, selectedElement.cz);
      oldDimensionRef.current.set(selectedElement.lx, selectedElement.ly, selectedElement.lz);
      oldRotationRef.current = [...selectedElement.rotation];

      // store the positions of children
      switch (selectedElement.type) {
        case ObjectType.Cuboid: {
          absPosMapRef.current.clear();
          const cuboidCenter = new Vector3(selectedElement.cx, selectedElement.cy, selectedElement.cz);
          const cuboidChildren = getChildren(selectedElement.id);
          if (cuboidChildren.length > 0) {
            const a = selectedElement.rotation[2];
            for (const e of cuboidChildren) {
              switch (e.type) {
                case ObjectType.Tree:
                case ObjectType.Human:
                  const centerAbsPos = new Vector3(e.cx, e.cy, e.cz).applyEuler(new Euler(0, 0, a));
                  centerAbsPos.add(cuboidCenter);
                  absPosMapRef.current.set(e.id, centerAbsPos);
                  break;
                case ObjectType.SolarPanel:
                case ObjectType.Sensor:
                  if (Util.isIdentical(e.normal, UNIT_VECTOR_POS_Z_ARRAY)) {
                    const centerAbsPos = new Vector3(
                      e.cx * selectedElement.lx,
                      e.cy * selectedElement.ly,
                      e.cz * selectedElement.lz,
                    ).applyEuler(new Euler(0, 0, a));
                    centerAbsPos.add(cuboidCenter);
                    absPosMapRef.current.set(e.id, centerAbsPos);
                  }
                  break;
                case ObjectType.Polygon:
                  if (Util.isIdentical(e.normal, UNIT_VECTOR_POS_Z_ARRAY)) {
                    const polygon = e as PolygonModel;
                    const vertexAbsPosArray: Vector2[] = [];
                    for (const v of polygon.vertices) {
                      const vertexAbsPos = new Vector2(v.x * selectedElement.lx, v.y * selectedElement.ly).rotateAround(
                        ORIGIN_VECTOR2,
                        a,
                      );
                      vertexAbsPos.add(new Vector2(cuboidCenter.x, cuboidCenter.y));
                      vertexAbsPosArray.push(vertexAbsPos);
                    }
                    polygonsAbsPosMapRef.current.set(polygon.id, vertexAbsPosArray);
                  }
                  break;
              }
            }
          }
          break;
        }
      }
    }
  };

  const handlePointerUp = () => {
    if (grabRef.current) {
      const elem = getElementById(grabRef.current.id);
      if (elem) {
        setCommonStore((state) => {
          for (const e of state.elements) {
            if (e.parentId === elem.id) {
              if (e.type === ObjectType.Human || e.type === ObjectType.Tree) {
                // stand on top face
                if (Math.abs(oldDimensionRef.current.z / 2 - e.cz) < 0.01) {
                  e.cz = elem.lz / 2;
                }
                // stand on side faces
                else {
                  const newRelZ = e.cz + oldPositionRef.current.z - elem.cz;
                  if (Math.abs(newRelZ) > elem.lz / 2 + 0.5) {
                    handleDetachParent(elem, e);
                  } else {
                    e.cz = newRelZ;
                  }
                }
              }
            }
          }
        });
      }
      grabRef.current = null;
    }
  };

  return (
    <>
      <mesh
        ref={meshRef}
        name={'Sky'}
        rotation={[HALF_PI, 0, 0]}
        scale={[1, scale, 1]}
        onContextMenu={(e) => {
          if (e.intersections.length > 0) {
            const skyClicked = e.intersections[0].object === meshRef.current;
            if (skyClicked) {
              selectNone();
              setCommonStore((state) => {
                state.clickObjectType = ObjectType.Sky;
                state.contextMenuObjectType = ObjectType.Sky;
              });
            }
          }
        }}
        onPointerDown={handlePointerDown}
      >
        <sphereBufferGeometry args={[DEFAULT_SKY_RADIUS, 16, 8, 0, TWO_PI, 0, HALF_PI]} />
        <meshBasicMaterial map={texture} side={BackSide} opacity={1} color={'skyblue'} />
      </mesh>
      {grabRef.current && intersectionPlaneType !== IntersectionPlaneType.Sky && (
        <Plane
          ref={intersectionPlaneRef}
          visible={false}
          name={'Sky Intersection Plane'}
          rotation={intersectionPlaneAngle}
          position={intersectionPlanePosition}
          args={[1000, 1000]}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          <meshStandardMaterial side={DoubleSide} />
        </Plane>
      )}
    </>
  );
};

export default React.memo(Sky);
