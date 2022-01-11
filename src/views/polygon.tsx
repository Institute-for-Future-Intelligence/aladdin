/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import PolygonTexture01 from '../resources/foundation_01.png';
import PolygonTexture02 from '../resources/foundation_02.png';
import PolygonTexture03 from '../resources/foundation_03.png';
import PolygonTexture04 from '../resources/foundation_04.png';
import PolygonTexture05 from '../resources/foundation_05.png';
import PolygonTexture06 from '../resources/foundation_06.png';
import PolygonTexture07 from '../resources/foundation_07.png';
import PolygonTexture08 from '../resources/polygon_08.png';
import PolygonTexture09 from '../resources/polygon_09.png';
import PolygonTexture10 from '../resources/polygon_10.png';
import PolygonTexture00 from '../resources/foundation_00.png';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Box, Line, Sphere } from '@react-three/drei';
import { Euler, Mesh, RepeatWrapping, Shape, TextureLoader, Vector3 } from 'three';
import { useStore } from '../stores/common';
import * as Selector from '../stores/selector';
import { ThreeEvent, useThree } from '@react-three/fiber';
import {
  HALF_PI,
  HIGHLIGHT_HANDLE_COLOR,
  MOVE_HANDLE_RADIUS,
  RESIZE_HANDLE_COLOR,
  RESIZE_HANDLE_SIZE,
  UNIT_VECTOR_NEG_X,
  UNIT_VECTOR_NEG_Y,
  UNIT_VECTOR_POS_X,
  UNIT_VECTOR_POS_Y,
} from '../constants';
import { ActionType, LineStyle, MoveHandleType, ObjectType, PolygonTexture, ResizeHandleType } from '../types';
import { Util } from '../Util';
import i18n from '../i18n/i18n';
import { PolygonModel } from '../models/PolygonModel';
import { Point2 } from '../models/Point2';

const Polygon = ({
  id,
  lz = 0.1,
  filled = false,
  rotation = [0, 0, 0],
  normal = [0, 0, 1],
  color = 'yellow',
  lineColor = 'black',
  lineWidth = 1,
  selected = false,
  locked = false,
  showLabel = false,
  parentId,
  vertices,
  opacity = 1,
  textureType = PolygonTexture.NoTexture,
}: PolygonModel) => {
  const setCommonStore = useStore(Selector.set);
  const language = useStore(Selector.language);
  const getElementById = useStore(Selector.getElementById);
  const selectMe = useStore(Selector.selectMe);
  const updatePolygonSelectedIndexById = useStore(Selector.updatePolygonSelectedIndexById);
  const objectTypeToAdd = useStore(Selector.objectTypeToAdd);
  const shadowEnabled = useStore(Selector.viewState.shadowEnabled);

  const {
    gl: { domElement },
  } = useThree();
  const [hovered, setHovered] = useState(false);
  const [centerX, setCenterX] = useState(0);
  const [centerY, setCenterY] = useState(0);
  const [hoveredHandle, setHoveredHandle] = useState<MoveHandleType | ResizeHandleType | null>(null);

  const resizeHandleTypeRef = useRef(useStore.getState().resizeHandleType);
  const baseRef = useRef<Mesh>();
  const centerRef = useRef<Mesh>();

  const lang = { lng: language };
  const parent = getElementById(parentId);
  const ratio = parent ? Math.max(1, Math.max(parent.lx, parent.ly) / 12) : 1;
  const resizeHandleSize = RESIZE_HANDLE_SIZE * ratio;
  const moveHandleSize = MOVE_HANDLE_RADIUS * ratio;

  useEffect(() => {
    const unsubscribe = useStore.subscribe((state) => {
      resizeHandleTypeRef.current = state.resizeHandleType;
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const absoluteVertices = useMemo(() => {
    const av = new Array<Point2>();
    if (parent) {
      switch (parent.type) {
        case ObjectType.Foundation:
          for (const v of vertices) {
            const p2 = { x: v.x * parent.lx, y: v.y * parent.ly } as Point2;
            av.push(p2);
          }
          break;
        case ObjectType.Cuboid:
          const n = new Vector3().fromArray(normal);
          let lx, ly;
          if (Util.isUnitVectorX(n)) {
            // east or west face in model coordinate system
            lx = parent.lz;
            ly = parent.ly;
          } else if (Util.isUnitVectorY(n)) {
            // south or north face
            lx = parent.lx;
            ly = parent.lz;
          } else {
            // top face
            lx = parent.lx;
            ly = parent.ly;
          }
          for (const v of vertices) {
            av.push({ x: v.x * lx, y: v.y * ly } as Point2);
          }
          break;
      }
      const centroid = Util.calculatePolygonCentroid(av);
      setCenterX(centroid.x);
      setCenterY(centroid.y);
    }
    return av;
  }, [vertices, parent]);

  const cz = useMemo(() => {
    if (parent?.type === ObjectType.Cuboid) {
      return parent.cz + (parent.lz + lz) / 2 + 0.01;
    }
    if (parent?.type === ObjectType.Foundation) {
      return parent.lz + 0.01;
    }
    return lz / 2 + 0.01;
  }, [parent]);

  const polygonModel = getElementById(id) as PolygonModel;

  const euler = useMemo(() => {
    const n = new Vector3().fromArray(normal);
    // east face in model coordinate system
    if (Util.isSame(n, UNIT_VECTOR_POS_X)) {
      return new Euler(0, HALF_PI, rotation[2], 'ZXY');
    }
    // west face
    if (Util.isSame(n, UNIT_VECTOR_NEG_X)) {
      return new Euler(0, -HALF_PI, rotation[2], 'ZXY');
    }
    // north face
    if (Util.isSame(n, UNIT_VECTOR_POS_Y)) {
      return new Euler(-HALF_PI, 0, rotation[2], 'ZXY');
    }
    // south face
    if (Util.isSame(n, UNIT_VECTOR_NEG_Y)) {
      return new Euler(HALF_PI, 0, rotation[2], 'ZXY');
    }
    // top face
    return new Euler(0, 0, rotation[2], 'ZXY');
  }, [normal, rotation]);

  const position = useMemo(() => {
    const p = new Vector3(parent?.cx ?? 0, parent?.cy ?? 0, cz);
    if (parent && parent.type === ObjectType.Cuboid) {
      const n = new Vector3().fromArray(normal);
      let sideFace = false;
      const shift = new Vector3();
      if (Util.isSame(n, UNIT_VECTOR_POS_X)) {
        // east face in model coordinate system
        sideFace = true;
        shift.x = parent.lx / 2 + 0.01;
      } else if (Util.isSame(n, UNIT_VECTOR_NEG_X)) {
        // west face
        sideFace = true;
        shift.x = -parent.lx / 2 - 0.01;
      } else if (Util.isSame(n, UNIT_VECTOR_POS_Y)) {
        // north face
        sideFace = true;
        shift.y = parent.ly / 2 + 0.01;
      } else if (Util.isSame(n, UNIT_VECTOR_NEG_Y)) {
        // south face
        sideFace = true;
        shift.y = -parent.ly / 2 - 0.01;
      }
      if (sideFace) {
        shift.applyEuler(new Euler(0, 0, rotation[2]));
        p.x = parent.cx + shift.x;
        p.y = parent.cy + shift.y;
        p.z = parent.cz + shift.z;
      }
    }
    return p;
  }, [normal, rotation, cz, parent?.cx, parent?.cy, parent?.cz, parent?.lx, parent?.ly, parent?.lz]);

  const points = useMemo(() => {
    const p = new Array<Vector3>();
    for (const v of absoluteVertices) {
      p.push(new Vector3(v.x, v.y, 0));
    }
    // close the polygon
    p.push(new Vector3(absoluteVertices[0].x, absoluteVertices[0].y, 0));
    return p;
  }, [absoluteVertices]);

  const shape = useMemo(() => {
    const s = new Shape();
    s.moveTo(absoluteVertices[0].x, absoluteVertices[0].y);
    for (let i = 1; i < absoluteVertices.length; i++) {
      s.lineTo(absoluteVertices[i].x, absoluteVertices[i].y);
    }
    s.closePath();
    return s;
  }, [absoluteVertices]);

  const hoverHandle = useCallback((e: ThreeEvent<MouseEvent>, handle: MoveHandleType | ResizeHandleType) => {
    if (e.intersections.length > 0) {
      const intersected = e.intersections[0].object === e.eventObject;
      if (intersected) {
        setHoveredHandle(handle);
        if (handle === MoveHandleType.Default) {
          domElement.style.cursor = 'move';
        } else {
          domElement.style.cursor = 'pointer';
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const noHoverHandle = useCallback(() => {
    setHoveredHandle(null);
    domElement.style.cursor = 'default';
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchRepeatDividers = (textureType: PolygonTexture) => {
    switch (textureType) {
      case PolygonTexture.Texture01:
        return { x: 1, y: 1 };
      case PolygonTexture.Texture02:
        return { x: 2, y: 2 };
      case PolygonTexture.Texture03:
        return { x: 0.4, y: 0.4 };
      case PolygonTexture.Texture04:
        return { x: 0.25, y: 0.25 };
      case PolygonTexture.Texture05:
        return { x: 5, y: 5 };
      case PolygonTexture.Texture06:
        return { x: 1, y: 1 };
      case PolygonTexture.Texture07:
        return { x: 1, y: 1 };
      case PolygonTexture.Texture08:
        return { x: 2, y: 2 };
      case PolygonTexture.Texture09:
        return { x: 2, y: 2 };
      case PolygonTexture.Texture10:
        return { x: 4, y: 4 };
      default:
        return { x: 1, y: 1 };
    }
  };

  const textureLoader = useMemo(() => {
    let textureImg;
    switch (textureType) {
      case PolygonTexture.Texture01:
        textureImg = PolygonTexture01;
        break;
      case PolygonTexture.Texture02:
        textureImg = PolygonTexture02;
        break;
      case PolygonTexture.Texture03:
        textureImg = PolygonTexture03;
        break;
      case PolygonTexture.Texture04:
        textureImg = PolygonTexture04;
        break;
      case PolygonTexture.Texture05:
        textureImg = PolygonTexture05;
        break;
      case PolygonTexture.Texture06:
        textureImg = PolygonTexture06;
        break;
      case PolygonTexture.Texture07:
        textureImg = PolygonTexture07;
        break;
      case PolygonTexture.Texture08:
        textureImg = PolygonTexture08;
        break;
      case PolygonTexture.Texture09:
        textureImg = PolygonTexture09;
        break;
      case PolygonTexture.Texture10:
        textureImg = PolygonTexture10;
        break;
      default:
        textureImg = PolygonTexture00;
    }
    return new TextureLoader().load(textureImg, (t) => {
      const params = fetchRepeatDividers(textureType);
      t.wrapT = t.wrapS = RepeatWrapping;
      // Don't know why, but we have to use 1, instead of the actual dimension, to divide as follows
      t.repeat.set(1 / params.x, 1 / params.y);
      const n = new Vector3().fromArray(polygonModel.normal);
      if (Util.isSame(n, UNIT_VECTOR_POS_X)) {
        t.rotation = HALF_PI;
      } else if (Util.isSame(n, UNIT_VECTOR_NEG_X)) {
        t.rotation = -HALF_PI;
      } else if (Util.isSame(n, UNIT_VECTOR_NEG_Y)) {
        t.rotation = Math.PI;
      }
      setTexture(t);
    });
  }, [textureType, absoluteVertices]);
  const [texture, setTexture] = useState(textureLoader);

  return (
    <group name={'Polygon Group ' + id} rotation={euler} position={position}>
      {filled && (
        <mesh
          uuid={id}
          ref={baseRef}
          receiveShadow={shadowEnabled}
          castShadow={false}
          name={ObjectType.Polygon}
          onPointerDown={(e) => {
            if (e.button === 2) return; // ignore right-click
            if (objectTypeToAdd === ObjectType.None) {
              selectMe(id, e);
            }
          }}
          onContextMenu={(e) => {
            selectMe(id, e);
            setCommonStore((state) => {
              if (e.intersections.length > 0) {
                const intersected = e.intersections[0].object === baseRef.current;
                if (intersected) {
                  if (e.intersections.length > 1) {
                    // pass paste point to its parent
                    state.pastePoint.copy(e.intersections[1].point);
                  }
                  state.contextMenuObjectType = ObjectType.Polygon;
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
          onPointerOut={() => {
            setHovered(false);
            domElement.style.cursor = 'default';
          }}
        >
          <shapeBufferGeometry attach="geometry" args={[shape]} />
          <meshStandardMaterial
            attach="material"
            color={textureType === PolygonTexture.NoTexture ? color : 'white'}
            map={texture}
            transparent={opacity < 1}
            opacity={opacity}
          />
        </mesh>
      )}

      {/* wireframe */}
      <Line
        points={points}
        color={lineColor}
        lineWidth={lineWidth}
        dashed={polygonModel.lineStyle && polygonModel.lineStyle !== LineStyle.Solid}
        dashSize={polygonModel.lineStyle === LineStyle.Dashed ? 0.3 : 0.1}
        gapSize={0.1}
        uuid={id}
        receiveShadow={false}
        castShadow={false}
        name={'Polygon Wireframe'}
        onPointerDown={(e) => {
          if (e.button === 2) return; // ignore right-click
          selectMe(id, e);
        }}
        onContextMenu={(e) => {
          if (objectTypeToAdd !== ObjectType.None) return;
          selectMe(id, e);
          setCommonStore((state) => {
            if (e.intersections.length > 0) {
              const obj = e.intersections[0].object;
              const intersected = obj.name === 'Polygon Wireframe' && obj.uuid === id;
              if (intersected) {
                state.contextMenuObjectType = ObjectType.Polygon;
              }
            }
          });
        }}
      />

      {/* draw handle */}
      {selected && !locked && (
        <Sphere
          ref={centerRef}
          position={[centerX, centerY, 0]}
          args={[moveHandleSize, 6, 6]}
          name={MoveHandleType.Default}
          onPointerDown={(e) => {
            selectMe(id, e, ActionType.Move);
          }}
          onPointerOver={(e) => {
            hoverHandle(e, MoveHandleType.Default);
          }}
          onPointerOut={noHoverHandle}
        >
          <meshStandardMaterial attach="material" color={'orange'} />
        </Sphere>
      )}
      {selected &&
        !locked &&
        absoluteVertices.map((p, i) => {
          return (
            <React.Fragment key={'resize-handle-' + i}>
              <Box
                userData={{ vertexIndex: i }}
                position={[p.x, p.y, 0]}
                name={ResizeHandleType.Default}
                args={[resizeHandleSize, resizeHandleSize, lz * 0.2]}
                onPointerDown={(e) => {
                  selectMe(id, e, ActionType.Resize);
                  updatePolygonSelectedIndexById(polygonModel.id, i);
                }}
                onPointerOver={(e) => {
                  hoverHandle(e, ResizeHandleType.Default);
                  updatePolygonSelectedIndexById(polygonModel.id, i);
                }}
                onPointerOut={noHoverHandle}
                onContextMenu={(e) => {
                  setCommonStore((state) => {
                    if (e.intersections.length > 0) {
                      const vertexIndex = e.intersections[0].object.userData.vertexIndex;
                      if (vertexIndex !== undefined) {
                        state.contextMenuObjectType = ObjectType.PolygonVertex;
                        state.updatePolygonSelectedIndexById(polygonModel.id, vertexIndex);
                      }
                    }
                  });
                }}
              >
                <meshStandardMaterial
                  attach="material"
                  color={
                    (hoveredHandle === ResizeHandleType.Default ||
                      resizeHandleTypeRef.current === ResizeHandleType.Default) &&
                    polygonModel.selectedIndex === i
                      ? HIGHLIGHT_HANDLE_COLOR
                      : RESIZE_HANDLE_COLOR
                  }
                />
              </Box>
              <textSprite
                name={'Label ' + i}
                text={'' + i}
                fontSize={20}
                fontFace={'Times Roman'}
                textHeight={0.2}
                position={[p.x, p.y, 0.3]}
              />
            </React.Fragment>
          );
        })}

      {(hovered || showLabel) && !selected && (
        <textSprite
          name={'Label'}
          text={
            (polygonModel?.label ? polygonModel.label : i18n.t('shared.PolygonElement', lang)) +
            (polygonModel.locked ? ' (' + i18n.t('shared.ElementLocked', lang) + ')' : '')
          }
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
export default Polygon;
