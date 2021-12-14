/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, { useMemo, useRef, useState } from 'react';
import { Box, Sphere } from '@react-three/drei';
import { Euler, Mesh, Shape, Vector3 } from 'three';
import { useStore } from '../stores/common';
import * as Selector from '../stores/selector';
import { useThree } from '@react-three/fiber';
import {
  HALF_PI,
  MOVE_HANDLE_RADIUS,
  RESIZE_HANDLE_COLOR,
  RESIZE_HANDLE_SIZE,
  UNIT_VECTOR_NEG_X,
  UNIT_VECTOR_NEG_Y,
  UNIT_VECTOR_POS_X,
  UNIT_VECTOR_POS_Y,
  UNIT_VECTOR_POS_Z,
} from '../constants';
import { ActionType, MoveHandleType, ObjectType, ResizeHandleType } from '../types';
import { Util } from '../Util';
import i18n from '../i18n/i18n';
import { PolygonModel } from '../models/PolygonModel';
import { Line } from '@react-three/drei';

const Polygon = ({
  id,
  cx,
  cy,
  cz,
  lx = 0.1,
  ly = 0.1,
  lz = 0.1,
  filled = false,
  rotation = [0, 0, 0],
  normal = [0, 0, 1],
  color = 'yellow',
  lineColor = 'black',
  lineWidth = 1,
  selected = false,
  showLabel = false,
  parentId,
  vertices,
}: PolygonModel) => {
  const setCommonStore = useStore(Selector.set);
  const language = useStore(Selector.language);
  const getElementById = useStore(Selector.getElementById);
  const selectMe = useStore(Selector.selectMe);
  const updatePolygonSelectedIndexById = useStore(Selector.updatePolygonSelectedIndexById);

  const {
    gl: { domElement },
  } = useThree();
  const [hovered, setHovered] = useState(false);
  const baseRef = useRef<Mesh>();
  const handleRef = useRef<Mesh>();

  const lang = { lng: language };
  const ratio = Math.max(1, Math.max(lx, ly) / 8);
  const resizeHandleSize = RESIZE_HANDLE_SIZE * ratio;
  const moveHandleSize = MOVE_HANDLE_RADIUS * ratio;

  if (parentId) {
    const p = getElementById(parentId);
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
            v.applyAxisAngle(UNIT_VECTOR_POS_Z, rotation[2]);
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
            v.applyAxisAngle(UNIT_VECTOR_POS_Z, rotation[2]);
            cx = p.cx + v.x;
            cy = p.cy + v.y;
            cz = p.cz + v.z;
          }
          break;
      }
    }
  }
  const hz = lz / 2;
  const polygonModel = getElementById(id) as PolygonModel;

  const euler = useMemo(() => {
    const v = new Vector3().fromArray(normal);
    if (Util.isSame(v, UNIT_VECTOR_POS_Z)) {
      // top face in model coordinate system
      return new Euler(0, 0, rotation[2]);
    } else if (Util.isSame(v, UNIT_VECTOR_POS_X)) {
      // east face in model coordinate system
      return new Euler(0, HALF_PI, rotation[2], 'ZXY');
    } else if (Util.isSame(v, UNIT_VECTOR_NEG_X)) {
      // west face in model coordinate system
      return new Euler(0, -HALF_PI, rotation[2], 'ZXY');
    } else if (Util.isSame(v, UNIT_VECTOR_POS_Y)) {
      // south face in the model coordinate system
      return new Euler(-HALF_PI, 0, rotation[2], 'ZXY');
    } else if (Util.isSame(v, UNIT_VECTOR_NEG_Y)) {
      // north face in the model coordinate system
      return new Euler(HALF_PI, 0, rotation[2], 'ZXY');
    }
    return new Euler(0, 0, rotation[2]);
  }, [normal, rotation]);

  const points = useMemo(() => {
    const p = new Array<Vector3>(vertices.length);
    for (const v of vertices) {
      p.push(new Vector3(v.x, v.y, 0));
    }
    // close the polygon
    p.push(new Vector3(vertices[0].x, vertices[0].y, 0));
    return p;
  }, [vertices]);

  const shape = useMemo(() => {
    const s = new Shape();
    for (const v of vertices) {
      s.lineTo(v.x, v.y);
    }
    s.lineTo(vertices[0].x, vertices[0].y);
    return s;
  }, [vertices]);

  return (
    <group name={'Polygon Group ' + id} rotation={euler} position={[cx, cy, cz + hz]}>
      <mesh
        uuid={id}
        ref={baseRef}
        position={[0, 0, 0]}
        receiveShadow={true}
        castShadow={false}
        visible={filled}
        name={'Polygon'}
        onPointerDown={(e) => {
          if (e.button === 2) return; // ignore right-click
          selectMe(id, e, ActionType.Move);
        }}
        onContextMenu={(e) => {
          selectMe(id, e);
          setCommonStore((state) => {
            if (e.intersections.length > 0) {
              const intersected = e.intersections[0].object === baseRef.current;
              if (intersected) {
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
              domElement.style.cursor = 'move';
            }
          }
        }}
        onPointerOut={() => {
          setHovered(false);
          domElement.style.cursor = 'default';
        }}
      >
        <shapeBufferGeometry attach="geometry" args={[shape]} />
        <meshBasicMaterial color={color} transparent={true} opacity={0.5} />
      </mesh>

      {/* wireframe */}
      <Line
        points={points}
        color={lineColor}
        lineWidth={lineWidth}
        uuid={id}
        receiveShadow={false}
        castShadow={false}
        name={'Polygon Wireframe'}
      />

      {/* draw handle */}
      {selected && (
        <Sphere
          ref={handleRef}
          position={new Vector3(0, 0, 0)}
          args={[moveHandleSize, 6, 6]}
          name={MoveHandleType.Default}
          onPointerDown={(e) => {
            selectMe(id, e, ActionType.Move);
          }}
        >
          <meshStandardMaterial attach="material" color={'orange'} />
        </Sphere>
      )}
      {selected &&
        polygonModel.vertices.map((p, i) => {
          return (
            <Box
              key={'resize-handle-' + i}
              position={[p.x, p.y, 0]}
              name={ResizeHandleType.Default}
              args={[resizeHandleSize, resizeHandleSize, lz * 1.2]}
              onPointerDown={(e) => {
                selectMe(id, e, ActionType.Resize);
                updatePolygonSelectedIndexById(polygonModel.id, i);
              }}
              onPointerOver={(e) => {}}
              onPointerOut={() => {}}
            >
              <meshStandardMaterial attach="material" color={RESIZE_HANDLE_COLOR} />
            </Box>
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
