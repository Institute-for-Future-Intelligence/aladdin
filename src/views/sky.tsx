/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, { useMemo, useRef } from 'react';
import { BackSide, DoubleSide, Euler, Mesh, Raycaster, Vector2, Vector3 } from 'three';
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
import * as Selector from '../stores/selector';
import { IntersectionPlaneType, ObjectType, ResizeHandleType } from '../types';
import { ElementModel } from '../models/ElementModel';
import { DEFAULT_SKY_RADIUS } from '../constants';

export interface SkyProps {
  theme?: string;
}

const Sky = ({ theme = 'Default' }: SkyProps) => {
  const setCommonStore = useStore(Selector.set);
  const selectNone = useStore(Selector.selectNone);
  const getSelectedElement = useStore(Selector.getSelectedElement);
  const getCameraDirection = useStore(Selector.getCameraDirection);
  const getResizeHandlePosition = useStore(Selector.getResizeHandlePosition);
  const resizeHandleType = useStore(Selector.resizeHandleType);
  const sunlightDirection = useStore(Selector.sunlightDirection);

  const {
    camera,
    gl: { domElement },
  } = useThree();
  const meshRef = useRef<Mesh>(null!);
  const grabRef = useRef<ElementModel | null>(null);
  const intersectionPlaneRef = useRef<Mesh>();
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
    intersectionPlaneAngle.set(-Math.PI / 2, 0, rotation, 'ZXY');
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
              setCommonStore((state) => {
                state.enableOrbitController = false;
              });
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
                    }
                  }
                  state.selectedElementHeight = Math.max(1, p.z);
                });
              }
              break;
            case ObjectType.Wall:
              if (resizeHandleType === ResizeHandleType.UpperLeft || resizeHandleType === ResizeHandleType.UpperRight) {
                setCommonStore((state) => {
                  for (const e of state.elements) {
                    if (e.id === grabRef.current?.id) {
                      e.cz = Math.max(0.5, p.z / 2);
                      e.lz = Math.max(1, p.z);
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

  return (
    <>
      <mesh
        ref={meshRef}
        name={'Sky'}
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
        onPointerDown={(e) => {
          if (e.button === 2) return; // ignore right-click
          setCommonStore((state) => {
            state.contextMenuObjectType = null;
          });
          clickSky(e);
        }}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <sphereBufferGeometry args={[DEFAULT_SKY_RADIUS, 16, 8, 0, 2 * Math.PI, 0, Math.PI / 2]} />
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
          onPointerUp={() => {
            grabRef.current = null;
          }}
        >
          <meshStandardMaterial side={DoubleSide} />
        </Plane>
      )}
    </>
  );
};

export default React.memo(Sky);
