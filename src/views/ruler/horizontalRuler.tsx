/*
 * @Copyright 2021-2025. Institute for Future Intelligence, Inc.
 */

import { Box } from '@react-three/drei';
import { ThreeEvent, useFrame, useThree } from '@react-three/fiber';
import { RulerModel, RulerGroundSnapPoint } from 'src/models/RulerModel';
import { useStore } from 'src/stores/common';
import { useCallback, useEffect, useRef } from 'react';
import { MoveHandleType, ObjectType, ResizeHandleType, RotateHandleType } from 'src/types';
import { useRefStore } from 'src/stores/commonRef';
import { Group, Mesh, Vector3 } from 'three';
import { useSelected } from 'src/hooks';
import MoveHandle from 'src/components/moveHandle';
import { RulerUtil } from './RulerUtil';
import { useIsFirstRender, useTransparent } from '../roof/hooks';
import TickMark, { TickMarkRef } from './tickMark';
import { useRulerGroundEndPointPosition } from './hooks';
import { tempEuler, tempVector3_0, tempVector3_1, tempVector3_2 } from 'src/helpers';
import { usePrimitiveStore } from 'src/stores/commonPrimitive';
import Wireframe from 'src/components/wireframe';
import { LOCKED_ELEMENT_SELECTION_COLOR } from 'src/constants';

const HorizontalRuler = (ruler: RulerModel) => {
  const { id, ly, lz, leftEndPoint, rightEndPoint, locked, color = '#D3D3D3', tickColor = '#000000' } = ruler;

  const leftEndPointPosition = useRulerGroundEndPointPosition(leftEndPoint);
  const rightEndPointPosition = useRulerGroundEndPointPosition(rightEndPoint);

  const [leftPointX, leftPointY] = leftEndPointPosition.current;
  const [rightPointX, rightPointY] = rightEndPointPosition.current;

  const [cx, cy] = [(rightPointX + leftPointX) / 2, (rightPointY + leftPointY) / 2];
  const [dx, dy] = [rightPointX - leftPointX, rightPointY - leftPointY];
  const rotationZ = Math.atan2(dy, dx);
  const length = Math.hypot(dx, dy);

  const operationRef = useRef<string | null>(null);
  const snapPointsRef = useRef<RulerGroundSnapPoint[]>([]);
  const snappedPointsRef = useRef<{ left: RulerGroundSnapPoint | null; right: RulerGroundSnapPoint | null }>({
    left: null,
    right: null,
  });
  const moveOffsetRef = useRef(new Vector3()); // from center to pointer

  const handlesGroupRef = useRef<Group>(null!);
  const boxRef = useRef<Mesh>(null!);
  const tickMarkRef = useRef<TickMarkRef>(null!);

  const { transparent, opacity } = useTransparent();
  const selected = useSelected(id);
  const { set, gl } = useThree();
  useEffect(() => {
    if (boxRef.current) {
      // @ts-expect-error ignore
      boxRef.current.material.needsUpdate = true;
    }
  }, [transparent]);

  const isFirst = useIsFirstRender();
  const changedRef = useRef(false);
  useEffect(() => {
    if (isFirst) return;
    changedRef.current = true;
  }, [leftPointX, leftPointY, rightPointX, rightPointY, isFirst]);

  const updateTickMark = (length: number) => {
    if (tickMarkRef.current) {
      tickMarkRef.current.update(length);
    }
  };

  const updateHandlesByResize = (operationName: string, p: Vector3) => {
    if (handlesGroupRef.current) {
      for (const obj of handlesGroupRef.current.children) {
        if (obj.name === operationName) {
          obj.position.x = p.x;
          obj.position.y = p.y;
        }
      }
    }
  };

  const updateHandlesByMove = (leftPoint: Vector3, rightPoint: Vector3) => {
    if (handlesGroupRef.current) {
      for (const obj of handlesGroupRef.current.children) {
        if (obj.name === MoveHandleType.Left) {
          obj.position.x = leftPoint.x;
          obj.position.y = leftPoint.y;
        } else if (obj.name === MoveHandleType.Right) {
          obj.position.x = rightPoint.x;
          obj.position.y = rightPoint.y;
        }
      }
    }
  };

  const updateBoxGroupResize = () => {
    if (handlesGroupRef.current && boxRef.current && boxRef.current.parent) {
      const left = { x: 0, y: 0 };
      const right = { x: 0, y: 0 };
      for (const obj of handlesGroupRef.current.children) {
        if (obj.name === MoveHandleType.Left) {
          left.x = obj.position.x;
          left.y = obj.position.y;
        } else if (obj.name === MoveHandleType.Right) {
          right.x = obj.position.x;
          right.y = obj.position.y;
        }
      }
      const parentGroup = boxRef.current.parent;
      const [dx, dy] = [right.x - left.x, right.y - left.y];
      const length = Math.hypot(dx, dy);
      parentGroup.position.x = (left.x + right.x) / 2;
      parentGroup.position.y = (left.y + right.y) / 2;
      parentGroup.rotation.z = Math.atan2(dy, dx);
      boxRef.current.scale.x = length;
      updateTickMark(length);
    }
  };

  const handleSnappingPointsByMove = (
    center: Vector3,
    leftPoint: Vector3,
    rightPoint: Vector3,
    points: RulerGroundSnapPoint[],
  ) => {
    let leftMin = Infinity;
    let rightMin = Infinity;

    snappedPointsRef.current = {
      left: null,
      right: null,
    };

    for (const point of points) {
      const leftDist = leftPoint.distanceTo(point.position);
      const rightDist = rightPoint.distanceTo(point.position);
      if (leftDist < RulerUtil.GroundSnapDistance && leftDist < leftMin) {
        leftMin = leftDist;
        snappedPointsRef.current.left = {
          elementId: point.elementId,
          position: point.position.clone(),
          direction: point.direction.clone(),
        };
      }
      if (rightDist < RulerUtil.GroundSnapDistance && rightDist < rightMin) {
        rightMin = rightDist;
        snappedPointsRef.current.right = {
          elementId: point.elementId,
          position: point.position.clone(),
          direction: point.direction.clone(),
        };
      }
    }

    if (snappedPointsRef.current.left) {
      leftPoint.copy(snappedPointsRef.current.left.position);
    }
    if (snappedPointsRef.current.right) {
      rightPoint.copy(snappedPointsRef.current.right.position);
    }
    center.addVectors(leftPoint, rightPoint).divideScalar(2);
  };

  /** events */
  const hoverHandle = useCallback(
    (e: ThreeEvent<MouseEvent>, handle: MoveHandleType | ResizeHandleType | RotateHandleType) => {
      if (usePrimitiveStore.getState().duringCameraInteraction) return;
      if (e.intersections.length > 0) {
        const intersected =
          e.intersections[0].object === e.eventObject ||
          (e.intersections.length > 1 && e.intersections[1].object === e.eventObject);
        if (intersected) {
          gl.domElement.style.cursor = 'pointer';
          useStore.getState().set((state) => {
            state.hoveredHandle = handle;
          });
        }
      }
    },
    [],
  );

  const noHoverHandle = useCallback(() => {
    gl.domElement.style.cursor = 'default';
    useStore.getState().set((state) => {
      state.hoveredHandle = null;
    });
  }, []);

  const hoverBody = () => {
    if (!selected || locked) return;
    gl.domElement.style.cursor = 'grab';
  };

  const noHoverBody = () => {
    if (!selected) return;
    gl.domElement.style.cursor = 'default';
  };

  const onGroupPointerDown = (event: ThreeEvent<PointerEvent>) => {
    if (event.intersections.length == 0 || event.intersections[0].object !== event.object) return;
    if (
      event.button === 0 &&
      selected &&
      !locked &&
      event.object.name !== MoveHandleType.Left &&
      event.object.name !== MoveHandleType.Right
    ) {
      operationRef.current = MoveHandleType.Mid;
      const point = event.point;
      moveOffsetRef.current.subVectors(new Vector3(cx, cy), point).setZ(0);
      set({ frameloop: 'always' });
      useRefStore.getState().setEnableOrbitController(false);
      // prepare for snap
      snapPointsRef.current = RulerUtil.getGroundSnapPointsArray();
    }
    useStore.getState().selectElement(id);
    // right click
    if (event.button === 2) {
      useStore.getState().set((state) => {
        state.contextMenuObjectType = ObjectType.Ruler;
      });
    }
  };

  const onHandlesPointDown = (event: ThreeEvent<PointerEvent>) => {
    if (
      event.intersections.length == 0 ||
      event.intersections[0].object !== event.object ||
      useStore.getState().addedRulerId === id
    )
      return;
    set({ frameloop: 'always' });
    useRefStore.getState().setEnableOrbitController(false);
    operationRef.current = event.object.name;

    // prepare for snap
    snapPointsRef.current = RulerUtil.getGroundSnapPointsArray();
  };

  const onPointerUp = () => {
    /**
     * change caused by snapped elements, this update is not affecting the model,
     * it only updates the number in the element array
     */
    // if (changedRef.current) {
    //   useStore.getState().set((state) => {
    //     if (changedRef.current) {
    //       const ruler = state.elements.find((e) => e.id === id && e.type === ObjectType.Ruler) as RulerModel;
    //       if (!ruler) return;

    //       if (changedRef.current) {
    //         const [leftPointX, leftPointY, leftPointZ] = leftEndPointPosition.current;
    //         const [rightPointX, rightPointY, rightPointZ] = rightEndPointPosition.current;
    //         ruler.leftEndPoint.position = [leftPointX, leftPointY, leftPointZ];
    //         ruler.rightEndPoint.position = [rightPointX, rightPointY, rightPointZ];
    //         changedRef.current = false;
    //       }
    //     }
    //   });
    // }

    if (operationRef.current) {
      const oldRuler = useStore
        .getState()
        .elements.find((e) => e.id === id && e.type === ObjectType.Ruler) as RulerModel;

      useStore.getState().set((state) => {
        if (handlesGroupRef.current) {
          const ruler = state.elements.find((e) => e.id === id && e.type === ObjectType.Ruler) as RulerModel;
          if (!ruler) return;

          const leftPosition = handlesGroupRef.current.children[0].position;
          const rightPosition = handlesGroupRef.current.children[1].position;
          ruler.leftEndPoint.position = leftPosition.toArray();
          ruler.rightEndPoint.position = rightPosition.toArray();

          if (snappedPointsRef.current) {
            const { left, right } = snappedPointsRef.current;
            if (operationRef.current === MoveHandleType.Left || operationRef.current === MoveHandleType.Mid) {
              if (left) {
                ruler.leftEndPoint.snappedHandle = { elementId: left.elementId, direction: left.direction.toArray() };
              } else {
                delete ruler.leftEndPoint.snappedHandle;
              }
            }
            if (operationRef.current === MoveHandleType.Right || operationRef.current === MoveHandleType.Mid) {
              if (right) {
                ruler.rightEndPoint.snappedHandle = {
                  elementId: right.elementId,
                  direction: right.direction.toArray(),
                };
              } else {
                delete ruler.rightEndPoint.snappedHandle;
              }
            }
          }
        }
      });

      const newRuler = useStore
        .getState()
        .elements.find((e) => e.id === id && e.type === ObjectType.Ruler) as RulerModel;

      if (oldRuler && newRuler) {
        RulerUtil.addUndoChanged(oldRuler, newRuler);
      }
    }
    set({ frameloop: 'demand' });
    useRefStore.getState().setEnableOrbitController(true);
    operationRef.current = null;
    snappedPointsRef.current = { left: null, right: null };
    snapPointsRef.current = [];
  };

  // pointer up
  useEffect(() => {
    window.addEventListener('pointerup', onPointerUp);
    return () => window.removeEventListener('pointerup', onPointerUp);
  }, []);

  useFrame(({ camera, scene, raycaster }) => {
    if (operationRef.current === null) return;

    const point = RulerUtil.getGroudPointer(raycaster, scene, camera);
    if (!point) return;

    if (operationRef.current === MoveHandleType.Left || operationRef.current === MoveHandleType.Right) {
      const { pointer, snappedPoint } = RulerUtil.getGroundSnappedPoint(point, snapPointsRef.current);
      snappedPointsRef.current = { left: null, right: null };
      if (operationRef.current === MoveHandleType.Left) {
        snappedPointsRef.current.left = snappedPoint;
      } else if (operationRef.current === MoveHandleType.Right) {
        snappedPointsRef.current.right = snappedPoint;
      }
      updateHandlesByResize(operationRef.current, pointer);
      updateBoxGroupResize();
    } else if (operationRef.current === MoveHandleType.Mid) {
      const center = tempVector3_0.addVectors(point, moveOffsetRef.current);
      const euler = tempEuler.set(0, 0, rotationZ);
      const hx = length / 2;
      const leftPoint = tempVector3_1.set(-hx, 0, 0).applyEuler(euler).add(center);

      // set left point on grid
      leftPoint.setX(Math.round(leftPoint.x * 2) / 2);
      leftPoint.setY(Math.round(leftPoint.y * 2) / 2);
      const rightPoint = tempVector3_2.set(length, 0, 0).applyEuler(euler).add(leftPoint);

      handleSnappingPointsByMove(center, leftPoint, rightPoint, snapPointsRef.current);
      if (boxRef.current && boxRef.current.parent) {
        const l = leftPoint.distanceTo(rightPoint);
        boxRef.current.scale.x = l;
        boxRef.current.parent.position.set(center.x, center.y, 0);
        boxRef.current.parent.rotation.z = RulerUtil.getRotation(leftPoint, rightPoint);
        updateTickMark(l);
        updateHandlesByMove(leftPoint, rightPoint);
      }
    }
  });

  const hy = ly / 2;
  const hz = lz / 2;

  return (
    <group name={'Ruler Group'} onPointerDown={onGroupPointerDown}>
      {/* body group */}
      <group position={[cx, cy, 0]} rotation={[0, 0, rotationZ]}>
        <Box
          ref={boxRef}
          position={[0, -hy, hz]}
          scale={[length, ly, lz]}
          onPointerMove={hoverBody}
          onPointerOut={noHoverBody}
        >
          <meshStandardMaterial color={color} transparent={transparent} opacity={opacity} />
        </Box>
        <group position={[0, 0, lz]}>
          <TickMark ref={tickMarkRef} length={length} color={tickColor} />
        </group>

        {selected && locked && (
          <group position={[0, -hy, hz]}>
            <Wireframe hx={length / 2} hy={hy} hz={hz} lineColor={LOCKED_ELEMENT_SELECTION_COLOR} lineWidth={3} />
          </group>
        )}
      </group>

      {/* handles */}
      {selected && !locked && (
        <group ref={handlesGroupRef} onPointerDown={onHandlesPointDown}>
          <MoveHandle
            handleType={MoveHandleType.Left}
            position={[leftPointX, leftPointY, hz]}
            size={0.75}
            onPointerOver={hoverHandle}
            onPointerOut={noHoverHandle}
          />
          <MoveHandle
            handleType={MoveHandleType.Right}
            position={[rightPointX, rightPointY, hz]}
            size={0.75}
            onPointerOver={hoverHandle}
            onPointerOut={noHoverHandle}
          />
        </group>
      )}
    </group>
  );
};

export default HorizontalRuler;
