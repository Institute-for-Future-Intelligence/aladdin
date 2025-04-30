import { Box, Plane } from '@react-three/drei';
import { ThreeEvent, useFrame, useThree } from '@react-three/fiber';
import { useCallback, useEffect, useRef, useState } from 'react';
import MoveHandle from 'src/components/moveHandle';
import { RulerModel, RulerGroundSnapPoint, RulerVerticalSnapPoint } from 'src/models/RulerModel';
import { useStore } from 'src/stores/common';
import { usePrimitiveStore } from 'src/stores/commonPrimitive';
import { MoveHandleType, ObjectType, ResizeHandleType, RotateHandleType } from 'src/types';
import { useRulerGroundEndPointPosition, useRulerVerticalPosition } from './hooks';
import { Camera, DoubleSide, Group, Mesh, Raycaster } from 'three';
import { useRefStore } from 'src/stores/commonRef';
import { RulerUtil } from './RulerUtil';
import { HALF_PI, LOCKED_ELEMENT_SELECTION_COLOR } from 'src/constants';
import { useSelected } from 'src/hooks';
import TickMark, { TickMarkRef } from './tickMark';
import { Util } from 'src/Util';
import Wireframe from 'src/components/wireframe';

const VerticalRuler = (ruler: RulerModel) => {
  const {
    id,
    ly,
    lz,
    leftEndPoint,
    rightEndPoint,
    verticalOffset = 0,
    locked,
    color = '#D3D3D3',
    tickColor = '#000000',
  } = ruler;

  const bottomPointPositionRef = useRulerGroundEndPointPosition(leftEndPoint);
  const topPointZRef = useRulerVerticalPosition(rightEndPoint, verticalOffset);

  const selected = useSelected(id);
  const { gl, set } = useThree();

  const [showIntersectionPlane, setIntersectionPlane] = useState(false);

  const operationRef = useRef<'move' | 'resize' | 'offset' | null>(null);
  const snapPointsOnGroundRef = useRef<RulerGroundSnapPoint[]>([]); // possible snapping points of other elements
  const snappedPointOnGroundRef = useRef<RulerGroundSnapPoint | null>(null);
  const verticalOffsetDiffRef = useRef(0);
  const verticalSnappingPointsRef = useRef<RulerVerticalSnapPoint[]>([]);
  const verticalSnappedPointRef = useRef<RulerVerticalSnapPoint | null>(null);

  const groupRef = useRef<Group>(null!);
  const boxRef = useRef<Mesh>(null!);
  const handlesGroupRef = useRef<Group>(null!);
  const intersectionPlaneRef = useRef<Mesh>(null!);
  const indicationPlaneRef = useRef<Mesh>(null!);
  const frontTickMarkGroupRef = useRef<Group>(null!);
  const frontTickMarkRef = useRef<TickMarkRef>(null!);
  const backTickMarkGroupRef = useRef<Group>(null!);
  const backTickMarkRef = useRef<TickMarkRef>(null!);

  const [leftPointX, leftPointY] = bottomPointPositionRef.current;
  const topPointZ = topPointZRef.current;

  const getIntersectionPlanePoint = (raycaster: Raycaster, camera: Camera) => {
    if (intersectionPlaneRef.current) {
      const pointer = useRefStore.getState().pointer;
      raycaster.setFromCamera(pointer, camera);
      const intersections = raycaster.intersectObjects([intersectionPlaneRef.current]);
      if (intersections.length) {
        return intersections[0].point;
      }
    }
    return null;
  };

  const updateTickMark = (length: number, offset: number) => {
    if (frontTickMarkGroupRef.current && frontTickMarkRef.current) {
      frontTickMarkRef.current.update(length - offset);
      frontTickMarkGroupRef.current.position.z = offset / 2;
    }
    if (backTickMarkGroupRef.current && backTickMarkRef.current) {
      backTickMarkRef.current.update(length - offset);
      backTickMarkGroupRef.current.position.z = offset / 2;
    }
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

  const onGroupPointerDown = (event: ThreeEvent<PointerEvent>) => {
    if (event.intersections.length == 0 || event.intersections[0].object !== event.object) return;
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
    ) {
      return;
    }
    set({ frameloop: 'always' });
    useRefStore.getState().setEnableOrbitController(false);
    const handleName = event.object.name;
    if (handleName === MoveHandleType.Lower) {
      snapPointsOnGroundRef.current = RulerUtil.getGroundSnapPointsArray();
      operationRef.current = 'move';
    } else if (handleName === MoveHandleType.Upper) {
      setIntersectionPlane(true);
      operationRef.current = 'resize';
      verticalSnappingPointsRef.current = RulerUtil.getVerticalSnapPointsArray();
    } else if (handleName === 'offset') {
      setIntersectionPlane(true);
      operationRef.current = 'offset';
      const z = event.point.z;
      verticalOffsetDiffRef.current = z - verticalOffset;
      verticalSnappingPointsRef.current = RulerUtil.getVerticalSnapPointsArray();
    }
  };

  const onPointerUp = () => {
    if (operationRef.current) {
      const oldRuler = useStore
        .getState()
        .elements.find((e) => e.id === id && e.type === ObjectType.Ruler) as RulerModel;

      useStore.getState().set((state) => {
        const ruler = state.elements.find((e) => e.id === id && e.type === ObjectType.Ruler) as RulerModel;
        if (!ruler) return;

        if (operationRef.current === 'move') {
          if (groupRef.current) {
            const [cx, cy] = groupRef.current.position.toArray();
            ruler.leftEndPoint.position[0] = cx;
            ruler.leftEndPoint.position[1] = cy;
            ruler.rightEndPoint.position[0] = cx;
            ruler.rightEndPoint.position[1] = cy;
          }
          if (snappedPointOnGroundRef.current) {
            const { elementId, direction } = snappedPointOnGroundRef.current;
            ruler.leftEndPoint.snappedHandle = { elementId, direction: direction.toArray() };
          } else {
            delete ruler.leftEndPoint.snappedHandle;
          }
        } else if (operationRef.current === 'resize') {
          if (boxRef.current) {
            const lz = boxRef.current.scale.z;
            ruler.rightEndPoint.position[2] = lz;
          }
          if (verticalSnappedPointRef.current) {
            const { elementId, z } = verticalSnappedPointRef.current;
            ruler.rightEndPoint.snappedHandle = { elementId, direction: [0, 0, 1] };
          } else {
            delete ruler.rightEndPoint.snappedHandle;
          }
        } else if (operationRef.current === 'offset') {
          if (frontTickMarkGroupRef.current) {
            ruler.verticalOffset = frontTickMarkGroupRef.current.position.z * 2;
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
    setIntersectionPlane(false);
    verticalSnappingPointsRef.current = [];
  };

  // pointer up
  useEffect(() => {
    window.addEventListener('pointerup', onPointerUp);
    return () => window.removeEventListener('pointerup', onPointerUp);
  }, []);

  useFrame(({ camera, scene, raycaster }) => {
    if (operationRef.current === null) return;

    if (operationRef.current === 'move') {
      const point = RulerUtil.getGroudPointer(raycaster, scene, camera);
      if (!point) return;

      const { pointer, snappedPoint } = RulerUtil.getGroundSnappedPoint(point, snapPointsOnGroundRef.current);
      if (groupRef.current) {
        groupRef.current.position.x = pointer.x;
        groupRef.current.position.y = pointer.y;
        snappedPointOnGroundRef.current = snappedPoint;
      }
    } else if (operationRef.current === 'resize') {
      const point = getIntersectionPlanePoint(raycaster, camera);
      if (!point) return;

      const { z, snappedPoint } = RulerUtil.getVerticalSnappedPoint(point.z, verticalSnappingPointsRef.current);
      const topZ = Math.max(0.1, Math.max(verticalOffset, z));
      const hz = topZ / 2;

      verticalSnappedPointRef.current = snappedPoint;

      if (groupRef.current) {
        groupRef.current.position.z = hz;
      }
      if (boxRef.current) {
        boxRef.current.scale.z = topZ;
      }
      if (handlesGroupRef.current) {
        handlesGroupRef.current.children[0].position.z = -hz;
        handlesGroupRef.current.children[1].position.z = hz;
      }
      if (indicationPlaneRef.current) {
        indicationPlaneRef.current.position.z = hz;
      }
      updateTickMark(z, verticalOffset);
    } else if (operationRef.current === 'offset') {
      const point = getIntersectionPlanePoint(raycaster, camera);
      if (!point) return;

      const { z } = RulerUtil.getVerticalSnappedPoint(
        point.z - verticalOffsetDiffRef.current,
        verticalSnappingPointsRef.current,
      );
      const offset = Util.clamp(z, 0, topPointZ);
      if (indicationPlaneRef.current) {
        indicationPlaneRef.current.position.z = -hl + offset;
      }
      updateTickMark(topPointZ, offset);
    }
  });

  const hy = ly / 2;
  const hl = topPointZ / 2;
  const tickMarkLength = topPointZ - verticalOffset;

  return (
    <group
      name={'Ruler Group'}
      ref={groupRef}
      position={[leftPointX, leftPointY, hl]}
      onPointerDown={onGroupPointerDown}
    >
      <Box ref={boxRef} scale={[ly, lz, topPointZ]} position={[hy, 0, 0]}>
        <meshStandardMaterial color={color} />
      </Box>

      {selected && !locked && (
        <group ref={handlesGroupRef} onPointerDown={onHandlesPointDown}>
          <MoveHandle
            handleType={MoveHandleType.Lower}
            position={[0, 0, -hl]}
            size={0.75}
            onPointerOver={hoverHandle}
            onPointerOut={noHoverHandle}
          />
          <MoveHandle
            handleType={MoveHandleType.Upper}
            position={[0, 0, hl]}
            size={0.75}
            full
            onPointerOver={hoverHandle}
            onPointerOut={noHoverHandle}
          />
          <Plane
            name={'offset'}
            position={[hy / 2, -lz / 2 - 0.01, 0]}
            rotation={[HALF_PI, 0, 0]}
            scale={[hy, topPointZ, 1]}
            onPointerMove={() => {
              gl.domElement.style.cursor = 'pointer';
            }}
            onPointerOut={() => {
              gl.domElement.style.cursor = 'default';
            }}
          >
            <meshBasicMaterial color={'yellow'} visible={false} />
          </Plane>
        </group>
      )}

      {/* tick marks */}
      <>
        <group
          ref={frontTickMarkGroupRef}
          position={[0, -lz / 2 - 0.01, verticalOffset / 2]}
          rotation={[0, -HALF_PI, HALF_PI, 'ZXY']}
        >
          <TickMark ref={frontTickMarkRef} length={tickMarkLength} color={tickColor} />
        </group>
        <group
          ref={backTickMarkGroupRef}
          position={[ly, lz / 2 + 0.01, verticalOffset / 2]}
          rotation={[-HALF_PI, -HALF_PI, 0, 'YXZ']}
        >
          <TickMark ref={backTickMarkRef} length={tickMarkLength} color={tickColor} mirror />
        </group>
      </>

      {/* intersection and indicator plane */}
      {showIntersectionPlane && (
        <>
          <Plane ref={intersectionPlaneRef} rotation={[HALF_PI, 0, 0]} args={[10000, 10000]} visible={false}>
            <meshBasicMaterial side={DoubleSide} />
          </Plane>
          <Plane ref={indicationPlaneRef} args={[50, 50]} position={[0, 0, 5]}>
            <meshBasicMaterial color={'yellow'} transparent opacity={0.25} side={DoubleSide} />
          </Plane>
        </>
      )}

      {/* lock wireframe */}
      {selected && locked && (
        <group position={[hy, 0, 0]} rotation={[0, -HALF_PI, HALF_PI, 'ZXY']}>
          <Wireframe hx={topPointZ / 2} hy={hy} hz={lz / 2} lineColor={LOCKED_ELEMENT_SELECTION_COLOR} lineWidth={3} />
        </group>
      )}
    </group>
  );
};

export default VerticalRuler;
