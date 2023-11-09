/*
 * @Copyright 2021-2023. Institute for Future Intelligence, Inc.
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
import PolygonTexture00 from '../resources/tiny_white_square.png';

import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Box, Line, Sphere, Text } from '@react-three/drei';
import { Color, DoubleSide, Euler, FrontSide, Mesh, RepeatWrapping, Shape, TextureLoader, Vector3 } from 'three';
import { CommonStoreState, useStore } from '../stores/common';
import * as Selector from '../stores/selector';
import { ThreeEvent, useThree } from '@react-three/fiber';
import {
  HALF_PI,
  HIGHLIGHT_HANDLE_COLOR,
  LOCKED_ELEMENT_SELECTION_COLOR,
  MOVE_HANDLE_RADIUS,
  RESIZE_HANDLE_COLOR,
  RESIZE_HANDLE_SIZE,
  UNIT_VECTOR_NEG_X,
  UNIT_VECTOR_NEG_Y,
  UNIT_VECTOR_POS_X,
  UNIT_VECTOR_POS_Y,
  UNIT_VECTOR_POS_Z_ARRAY,
} from '../constants';
import { ActionType, LineStyle, MoveHandleType, ObjectType, PolygonTexture, ResizeHandleType } from '../types';
import { Util } from '../Util';
import i18n from '../i18n/i18n';
import { PolygonModel } from '../models/PolygonModel';
import { Point2 } from '../models/Point2';
import { useRefStore } from '../stores/commonRef';
import { usePrimitiveStore } from '../stores/commonPrimitive';
import { useSelected } from './hooks';

const Polygon = ({
  id,
  lz = 0.1,
  filled = false,
  rotation = [0, 0, 0],
  normal = [0, 0, 1],
  color = 'yellow',
  label,
  text,
  fontSize = 1,
  fontColor = 'black',
  fontOutlineWidth = 0,
  fontOutlineColor = 'white',
  fontStrokeWidth = 0,
  fontStrokeColor = 'black',
  lineStyle = LineStyle.Solid,
  lineColor = 'black',
  lineWidth = 1,
  locked = false,
  showLabel = false,
  parentId,
  foundationId,
  vertices,
  opacity = 1,
  noOutline = false,
  shininess = 0,
  selectedIndex = -1,
  textureType = PolygonTexture.NoTexture,
}: PolygonModel) => {
  const setCommonStore = useStore(Selector.set);
  const language = useStore(Selector.language);
  const selectMe = useStore(Selector.selectMe);
  const objectTypeToAdd = useStore(Selector.objectTypeToAdd);
  const shadowEnabled = useStore(Selector.viewState.shadowEnabled);

  const selected = useSelected(id);

  const {
    gl: { domElement },
  } = useThree();
  const [hovered, setHovered] = useState(false);
  const [centerX, setCenterX] = useState(0);
  const [centerY, setCenterY] = useState(0);
  const [hoveredHandle, setHoveredHandle] = useState<MoveHandleType | ResizeHandleType | null>(null);

  const baseRef = useRef<Mesh>(null);
  const centerRef = useRef<Mesh>(null);

  // be sure to get the updated parent so that this memorized element can move with it
  const parent = useStore((state) => {
    for (const e of state.elements) {
      if (e.id === parentId) {
        return e;
      }
    }
  });

  // if any
  const cuboidWorldPosition = new Vector3();
  const cuboidWorldRotation = new Euler();
  if (parent?.type === ObjectType.Cuboid) {
    const { pos, rot } = Util.getWorldDataById(parent.id);
    cuboidWorldPosition.copy(pos);
    cuboidWorldRotation.set(0, 0, rot);
  }

  const ratio = parent ? Math.max(1, Math.max(parent.lx, parent.ly) / 24) : 1;
  const resizeHandleSize = RESIZE_HANDLE_SIZE * ratio;
  const moveHandleSize = MOVE_HANDLE_RADIUS * ratio;

  const lang = useMemo(() => {
    return { lng: language };
  }, [language]);

  const updatePolygonSelectedIndexById = (id: string, index: number) => {
    setCommonStore((state: CommonStoreState) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.Polygon && e.id === id) {
          (e as PolygonModel).selectedIndex = index;
          break;
        }
      }
    });
  };

  const absoluteVertices = useMemo(() => {
    const av = new Array<Point2>();
    if (parent) {
      switch (parent.type) {
        case ObjectType.Foundation:
          for (const v of vertices) {
            av.push({ x: v.x * parent.lx, y: v.y * parent.ly } as Point2);
          }
          break;
        case ObjectType.Wall:
          for (const v of vertices) {
            av.push({ x: v.x * parent.lx, y: v.y * parent.lz } as Point2);
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
  }, [vertices, parent, normal]);

  const getCz = () => {
    if (parent?.type === ObjectType.Cuboid) {
      const top = Util.isIdentical(normal, UNIT_VECTOR_POS_Z_ARRAY);
      // not sure why we need lz here
      return cuboidWorldPosition.z + (parent.lz + (top ? 0 : lz)) / 2 + 0.01;
    }
    if (parent?.type === ObjectType.Foundation) {
      return parent.lz + 0.01;
    }
    return lz / 2 + 0.01;
  };

  const cz = getCz();

  const getEuler = () => {
    if (parent?.type === ObjectType.Wall) {
      return new Euler(-HALF_PI, 0, Math.PI, 'ZXY');
    }
    const n = new Vector3().fromArray(normal);
    let r = rotation[2];
    if (parent?.type === ObjectType.Cuboid) {
      r = cuboidWorldRotation.z;
    }
    // east face in model coordinate system
    if (Util.isSame(n, UNIT_VECTOR_POS_X)) {
      return new Euler(0, HALF_PI, r, 'ZXY');
    }
    // west face
    if (Util.isSame(n, UNIT_VECTOR_NEG_X)) {
      return new Euler(0, -HALF_PI, r, 'ZXY');
    }
    // north face
    if (Util.isSame(n, UNIT_VECTOR_POS_Y)) {
      return new Euler(-HALF_PI, 0, r, 'ZXY');
    }
    // south face
    if (Util.isSame(n, UNIT_VECTOR_NEG_Y)) {
      return new Euler(HALF_PI, 0, r, 'ZXY');
    }
    // top face
    return new Euler(0, 0, r, 'ZXY');
  };

  const euler = getEuler();

  const getPosition = () => {
    if (parent) {
      if (parent.type === ObjectType.Cuboid) {
        const p = new Vector3(cuboidWorldPosition.x, cuboidWorldPosition.y, cz);
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
          shift.applyEuler(cuboidWorldRotation);
          p.x = cuboidWorldPosition.x + shift.x;
          p.y = cuboidWorldPosition.y + shift.y;
          p.z = cuboidWorldPosition.z + shift.z;
        }
        return p;
      } else if (parent.type === ObjectType.Wall) {
        // polygon on wall is relative to the wall
        return new Vector3(0, -0.01, 0);
      }
    }
    return new Vector3(parent?.cx ?? 0, parent?.cy ?? 0, cz);
  };

  const position = getPosition();

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
      const n = new Vector3().fromArray(normal);
      if (Util.isSame(n, UNIT_VECTOR_POS_X)) {
        t.rotation = HALF_PI;
      } else if (Util.isSame(n, UNIT_VECTOR_NEG_X)) {
        t.rotation = -HALF_PI;
      } else if (Util.isSame(n, UNIT_VECTOR_NEG_Y)) {
        t.rotation = Math.PI;
      }
      setTexture(t);
    });
  }, [textureType, normal]);
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
            selectMe(id, e, ActionType.ContextMenu);
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
          <shapeGeometry attach="geometry" args={[shape]} />
          {shininess === undefined || shininess === 0 ? (
            <meshStandardMaterial
              attach="material"
              color={textureType === PolygonTexture.NoTexture ? color : 'white'}
              map={texture}
              side={DoubleSide}
              transparent={opacity < 1}
              opacity={opacity}
            />
          ) : (
            <meshPhongMaterial
              attach="material"
              color={textureType === PolygonTexture.NoTexture ? color : 'white'}
              map={texture}
              side={FrontSide}
              specular={new Color('white')}
              shininess={shininess}
              transparent={opacity < 1}
              opacity={opacity}
            />
          )}
        </mesh>
      )}

      {text && (
        <Text
          fontSize={fontSize}
          scale={[1, 1, 1]}
          color={fontColor}
          position={[centerX, centerY, 0.01]}
          rotation={[0, 0, parent?.type === ObjectType.Wall ? Math.PI : 0]}
          anchorX="center"
          anchorY="middle"
          outlineWidth={fontOutlineWidth}
          outlineColor={fontOutlineColor}
          strokeWidth={fontStrokeWidth}
          strokeColor={fontStrokeColor}
        >
          {text}
        </Text>
      )}

      {/* wireframe */}
      {(!noOutline || (locked && selected)) && (
        <Line
          points={points}
          color={locked && selected ? LOCKED_ELEMENT_SELECTION_COLOR : lineColor}
          lineWidth={lineWidth}
          dashed={lineStyle && lineStyle !== LineStyle.Solid}
          dashSize={lineStyle === LineStyle.Dashed ? 0.3 : 0.1}
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
            selectMe(id, e, ActionType.ContextMenu);
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
      )}
      {/* if not filled, add an enlarged, lifted invisible line for easier selection */}
      {!filled && (
        <Line
          position={[0, 0, 0.1]}
          points={points}
          visible={false}
          lineWidth={Math.min(lineWidth * 10, 10)}
          receiveShadow={false}
          castShadow={false}
          uuid={id}
          name={'Polygon Enlarged Line'}
          onPointerDown={(e) => {
            if (e.button === 2) return; // ignore right-click
            selectMe(id, e);
          }}
          onContextMenu={(e) => {
            if (objectTypeToAdd !== ObjectType.None) return;
            selectMe(id, e, ActionType.ContextMenu);
            setCommonStore((state) => {
              if (e.intersections.length > 0) {
                const obj = e.intersections[0].object;
                const intersected = obj.name === 'Polygon Enlarged Line' && obj.uuid === id;
                if (intersected) {
                  state.contextMenuObjectType = ObjectType.Polygon;
                }
              }
            });
          }}
        />
      )}

      {/* draw handle */}
      {selected && !locked && (
        <Sphere
          ref={centerRef}
          position={[centerX, centerY, 0]}
          args={[moveHandleSize, 6, 6]}
          name={MoveHandleType.Default}
          onPointerDown={(e) => {
            if (e.button === 2) return;
            selectMe(id, e, ActionType.Move);
            useRefStore.getState().setEnableOrbitController(false);
            usePrimitiveStore.getState().set((state) => {
              state.showWallIntersectionPlaneId = parentId;
              state.oldParentId = parentId;
              state.oldFoundationId = foundationId;
            });
            setCommonStore((state) => {
              state.moveHandleType = MoveHandleType.Default;
            });
          }}
          onPointerOver={(e) => {
            hoverHandle(e, MoveHandleType.Default);
          }}
          onPointerOut={noHoverHandle}
        >
          <meshBasicMaterial attach="material" color={'orange'} />
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
                args={[resizeHandleSize, resizeHandleSize, lz / 2 + (filled ? 0 : 0.1)]}
                onPointerDown={(e) => {
                  if (e.button === 2) return;
                  selectMe(id, e, ActionType.Resize);
                  updatePolygonSelectedIndexById(id, i);
                  useRefStore.getState().setEnableOrbitController(false);
                  usePrimitiveStore.getState().set((state) => {
                    state.showWallIntersectionPlaneId = parentId;
                    state.oldParentId = parentId;
                    state.oldFoundationId = foundationId;
                  });
                  setCommonStore((state) => {
                    state.resizeHandleType = ResizeHandleType.Default;
                  });
                }}
                onPointerOver={(e) => {
                  hoverHandle(e, ResizeHandleType.Default);
                  updatePolygonSelectedIndexById(id, i);
                }}
                onPointerOut={noHoverHandle}
                onContextMenu={(e) => {
                  setCommonStore((state) => {
                    if (e.intersections.length > 0) {
                      const vertexIndex = e.intersections[0].object.userData.vertexIndex;
                      if (vertexIndex !== undefined) {
                        state.contextMenuObjectType = ObjectType.PolygonVertex;
                        updatePolygonSelectedIndexById(id, vertexIndex);
                      }
                    }
                  });
                }}
              >
                <meshBasicMaterial
                  attach="material"
                  color={
                    (hoveredHandle === ResizeHandleType.Default ||
                      useStore.getState().resizeHandleType === ResizeHandleType.Default) &&
                    selectedIndex === i
                      ? HIGHLIGHT_HANDLE_COLOR
                      : RESIZE_HANDLE_COLOR
                  }
                />
              </Box>
              <textSprite
                name={'Label ' + i}
                text={'' + i}
                fontSize={20 * ratio}
                fontFace={'Times Roman'}
                textHeight={0.2 * ratio}
                position={[p.x, p.y, 0.2 * ratio]}
              />
            </React.Fragment>
          );
        })}

      {(hovered || showLabel) && !selected && (
        <textSprite
          userData={{ unintersectable: true }}
          name={'Label'}
          text={
            (label ?? i18n.t('shared.PolygonElement', lang)) +
            (locked ? ' (' + i18n.t('shared.ElementLocked', lang) + ')' : '')
          }
          fontSize={20 * ratio}
          fontFace={'Times Roman'}
          textHeight={0.2 * ratio}
          position={[0, 0, lz + 0.2]}
        />
      )}
    </group>
  );
};

export default Polygon;
