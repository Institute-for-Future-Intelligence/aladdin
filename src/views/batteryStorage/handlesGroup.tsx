/*
 * @Copyright 2021-2025. Institute for Future Intelligence, Inc.
 */

import { ThreeEvent, useThree } from '@react-three/fiber';
import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import MoveHandle from 'src/components/moveHandle';
import ResizeHandle from 'src/components/resizeHandle';
import RotateHandle from 'src/components/rotateHandle';
import { RESIZE_HANDLE_SIZE } from 'src/constants';
import { useStore } from 'src/stores/common';
import { usePrimitiveStore } from 'src/stores/commonPrimitive';
import { MoveHandleType, ResizeHandleType, RotateHandleType } from 'src/types';
import { Group } from 'three';
import * as Selector from '../../stores/selector';
import { Util } from 'src/Util';
import { useHandleSize } from '../wall/hooks';
import VerticalRuler, { VerticalRulerRef } from './verticalRuler';
import HorizontalRuler, { HorizontalRulerRef, TEXT_SPRITE_NAME } from './horizontalRuler';

export type HandleType = MoveHandleType | ResizeHandleType | RotateHandleType;

export interface HandlesGroupRefProps {
  update: (hx: number, hy: number, hz: number) => void;
}
interface HandlesGroupProps {
  id: string;
  fId: string;
  hx: number;
  hy: number;
  hz: number;
  onMoveHandlePointerDown: (e: ThreeEvent<PointerEvent>) => void;
  onResizeHandlePointerDown: (e: ThreeEvent<PointerEvent>) => void;
  onRotateHandlePointerDown: (e: ThreeEvent<PointerEvent>) => void;
}

const HandlesGroup = forwardRef<HandlesGroupRefProps, HandlesGroupProps>(
  ({ id, hx, hy, hz, fId, onMoveHandlePointerDown, onResizeHandlePointerDown, onRotateHandlePointerDown }, ref) => {
    const moveHandlesGroupRef = useRef<Group>(null!);
    const resizeHandlesGroupRef = useRef<Group>(null!);
    const rotateHandlesGroupRef = useRef<Group>(null!);
    const vertivalRulerRef = useRef<VerticalRulerRef>(null!);
    const horizontalRulerRef = useRef<HorizontalRulerRef>(null!);

    const orthographic = useStore(Selector.viewState.orthographic);
    const { gl } = useThree();
    const size = useHandleSize(0.2);
    const moveHandleOffset = size * 1.2;
    const lz = hz * 2;

    const lowerRotateHandlePosition: [x: number, y: number, z: number] = useMemo(() => {
      return [0, Math.min(-1.2 * hy, -hy - 0.75) - size * 2, RESIZE_HANDLE_SIZE / 2];
    }, [hy, hz, size]);

    const upperRotateHandlePosition: [x: number, y: number, z: number] = useMemo(() => {
      return [0, Math.max(1.2 * hy, hy + 0.75) + size * 2, RESIZE_HANDLE_SIZE / 2];
    }, [hy, hz, size]);

    const setCommonStore = useStore(Selector.set);

    const [hoveredHandle, setHoveredHandle] = useState<HandleType | null>(null);
    const [selectedHandle, setSelectedHandle] = useState<HandleType | null>(null);
    const highlightedHandle = selectedHandle ? selectedHandle : hoveredHandle;

    const hoverHandle = useCallback(
      (e: ThreeEvent<MouseEvent>, handle: MoveHandleType | ResizeHandleType | RotateHandleType) => {
        if (usePrimitiveStore.getState().duringCameraInteraction) return;
        if (e.intersections.length > 0) {
          // QUICK FIX: For some reason, the top one can sometimes be the ground, so we also go to the second one
          const intersected =
            e.intersections[0].object === e.eventObject ||
            (e.intersections.length > 1 && e.intersections[1].object === e.eventObject);
          if (intersected) {
            setCommonStore((state) => {
              state.hoveredHandle = handle;
            });
            setHoveredHandle(handle);
            if (Util.isMoveHandle(handle)) {
              gl.domElement.style.cursor = 'move';
            } else if (handle === RotateHandleType.Upper || handle === RotateHandleType.Lower) {
              gl.domElement.style.cursor = 'grab';
            } else {
              gl.domElement.style.cursor = useStore.getState().addedCuboidId ? 'crosshair' : 'pointer';
            }
          }
        }
      },
      [],
    );

    const noHoverHandle = useCallback(() => {
      setCommonStore((state) => {
        state.hoveredHandle = null;
      });
      setHoveredHandle(null);
      gl.domElement.style.cursor = useStore.getState().addedCuboidId ? 'crosshair' : 'default';
    }, []);

    const _onResizeHandlePointerDown = (event: ThreeEvent<PointerEvent>) => {
      if (
        event.intersections.length == 0 ||
        (event.intersections[0].object !== event.object && event.intersections[0].object.name !== TEXT_SPRITE_NAME)
      )
        return;
      onResizeHandlePointerDown(event);
      setSelectedHandle(event.object.name as HandleType);
    };

    // pointer up
    useEffect(() => {
      const onPointerUp = () => {
        setSelectedHandle(null);
      };
      window.addEventListener('pointerup', onPointerUp);
      return () => window.removeEventListener('pointerup', onPointerUp);
    }, []);

    useImperativeHandle(ref, () => ({
      update(hx: number, hy: number, hz: number) {
        if (moveHandlesGroupRef.current) {
          for (const obj of moveHandlesGroupRef.current.children) {
            switch (obj.name) {
              case MoveHandleType.Left: {
                obj.position.x = -hx - moveHandleOffset;
                break;
              }
              case MoveHandleType.Right: {
                obj.position.x = hx + moveHandleOffset;
                break;
              }
              case MoveHandleType.Lower: {
                obj.position.y = -hy - moveHandleOffset;
                break;
              }
              case MoveHandleType.Upper: {
                obj.position.y = hy + moveHandleOffset;
                break;
              }
              case MoveHandleType.Top: {
                obj.position.z = hz * 2;
                break;
              }
            }
          }
        }
        if (resizeHandlesGroupRef.current) {
          for (const obj of resizeHandlesGroupRef.current.children) {
            switch (obj.name) {
              case ResizeHandleType.Left: {
                obj.position.x = -hx;
                break;
              }
              case ResizeHandleType.Right: {
                obj.position.x = hx;
                break;
              }
              case ResizeHandleType.Upper: {
                obj.position.y = hy;
                break;
              }
              case ResizeHandleType.Lower: {
                obj.position.y = -hy;
                break;
              }
              case ResizeHandleType.UpperLeft: {
                obj.position.x = -hx;
                obj.position.y = hy;
                break;
              }
              case ResizeHandleType.UpperRight: {
                obj.position.x = hx;
                obj.position.y = hy;
                break;
              }
              case ResizeHandleType.LowerLeft: {
                obj.position.x = -hx;
                obj.position.y = -hy;
                break;
              }
              case ResizeHandleType.LowerRight: {
                obj.position.x = hx;
                obj.position.y = -hy;
                break;
              }
              case ResizeHandleType.UpperLeftTop: {
                obj.position.x = -hx;
                obj.position.y = hy;
                obj.position.z = hz * 2;
                break;
              }
              case ResizeHandleType.UpperRightTop: {
                obj.position.x = hx;
                obj.position.y = hy;
                obj.position.z = hz * 2;
                break;
              }
              case ResizeHandleType.LowerLeftTop: {
                obj.position.x = -hx;
                obj.position.y = -hy;
                obj.position.z = hz * 2;
                break;
              }
              case ResizeHandleType.LowerRightTop: {
                obj.position.x = hx;
                obj.position.y = -hy;
                obj.position.z = hz * 2;
                break;
              }
            }
          }
        }
        if (rotateHandlesGroupRef.current) {
          for (const obj of rotateHandlesGroupRef.current.children) {
            switch (obj.name) {
              case RotateHandleType.Upper: {
                obj.position.y = Math.max(1.2 * hy, hy + 0.75) + size * 2;
                break;
              }
              case RotateHandleType.Lower: {
                obj.position.y = Math.min(-1.2 * hy, -hy - 0.75) - size * 2;
                break;
              }
            }
          }
        }
        if (vertivalRulerRef.current) {
          vertivalRulerRef.current.updateLz(hz * 2);
        }
        if (horizontalRulerRef.current) {
          horizontalRulerRef.current.update(hx, hy);
        }
      },
    }));

    const showRuler = (handle: HandleType | null) => {
      if (!handle) return null;
      switch (handle) {
        case ResizeHandleType.LowerLeft:
        case ResizeHandleType.LowerRight:
        case ResizeHandleType.UpperLeft:
        case ResizeHandleType.UpperRight:
          return <HorizontalRuler ref={horizontalRulerRef} hx={hx} hy={hy} handle={handle} />;
        case ResizeHandleType.LowerLeftTop:
        case ResizeHandleType.UpperLeftTop:
        case ResizeHandleType.LowerRightTop:
        case ResizeHandleType.UpperRightTop:
          return <VerticalRuler ref={vertivalRulerRef} id={id} fId={fId} hx={hx} hy={hy} lz={lz} handle={handle} />;
      }
      return null;
    };

    return (
      <>
        <group name="Move Handles Group" ref={moveHandlesGroupRef} onPointerDown={onMoveHandlePointerDown}>
          <MoveHandle
            handleType={MoveHandleType.Lower}
            position={[0, -hy - moveHandleOffset, 0]}
            size={size}
            onPointerOver={hoverHandle}
            onPointerOut={noHoverHandle}
          />
          <MoveHandle
            handleType={MoveHandleType.Upper}
            position={[0, hy + moveHandleOffset, 0]}
            size={size}
            onPointerOver={hoverHandle}
            onPointerOut={noHoverHandle}
          />
          <MoveHandle
            handleType={MoveHandleType.Left}
            position={[-hx - moveHandleOffset, 0, 0]}
            size={size}
            onPointerOver={hoverHandle}
            onPointerOut={noHoverHandle}
          />
          <MoveHandle
            handleType={MoveHandleType.Right}
            position={[hx + moveHandleOffset, 0, 0]}
            size={size}
            onPointerOver={hoverHandle}
            onPointerOut={noHoverHandle}
          />
          <MoveHandle
            handleType={MoveHandleType.Top}
            position={[0, 0, lz]}
            size={size}
            onPointerOver={hoverHandle}
            onPointerOut={noHoverHandle}
          />
        </group>
        <group name="Resize Handles Group" ref={resizeHandlesGroupRef} onPointerDown={_onResizeHandlePointerDown}>
          <ResizeHandle
            handleType={ResizeHandleType.UpperLeft}
            position={[-hx, hy, size / 2]}
            size={size}
            onPointerOver={hoverHandle}
            onPointerOut={noHoverHandle}
          />
          <ResizeHandle
            handleType={ResizeHandleType.UpperRight}
            position={[hx, hy, size / 2]}
            size={size}
            onPointerOver={hoverHandle}
            onPointerOut={noHoverHandle}
          />
          <ResizeHandle
            handleType={ResizeHandleType.LowerLeft}
            position={[-hx, -hy, size / 2]}
            size={size}
            onPointerOver={hoverHandle}
            onPointerOut={noHoverHandle}
          />
          <ResizeHandle
            handleType={ResizeHandleType.LowerRight}
            position={[hx, -hy, size / 2]}
            size={size}
            onPointerOver={hoverHandle}
            onPointerOut={noHoverHandle}
          />
          <ResizeHandle
            handleType={ResizeHandleType.Left}
            position={[-hx, 0, size / 2]}
            size={size}
            onPointerOver={hoverHandle}
            onPointerOut={noHoverHandle}
          />
          <ResizeHandle
            handleType={ResizeHandleType.Right}
            position={[hx, 0, size / 2]}
            size={size}
            onPointerOver={hoverHandle}
            onPointerOut={noHoverHandle}
          />
          <ResizeHandle
            handleType={ResizeHandleType.Upper}
            position={[0, hy, size / 2]}
            size={size}
            onPointerOver={hoverHandle}
            onPointerOut={noHoverHandle}
          />
          <ResizeHandle
            handleType={ResizeHandleType.Lower}
            position={[0, -hy, size / 2]}
            size={size}
            onPointerOver={hoverHandle}
            onPointerOut={noHoverHandle}
          />

          {/* top handles */}
          {!orthographic && (
            <>
              <ResizeHandle
                handleType={ResizeHandleType.LowerLeftTop}
                position={[-hx, -hy, lz]}
                size={size}
                onPointerOver={hoverHandle}
                onPointerOut={noHoverHandle}
              />
              <ResizeHandle
                handleType={ResizeHandleType.UpperLeftTop}
                position={[-hx, hy, lz]}
                size={size}
                onPointerOver={hoverHandle}
                onPointerOut={noHoverHandle}
              />
              <ResizeHandle
                handleType={ResizeHandleType.LowerRightTop}
                position={[hx, -hy, lz]}
                size={size}
                onPointerOver={hoverHandle}
                onPointerOut={noHoverHandle}
              />
              <ResizeHandle
                handleType={ResizeHandleType.UpperRightTop}
                position={[hx, hy, lz]}
                size={size}
                onPointerOver={hoverHandle}
                onPointerOut={noHoverHandle}
              />
            </>
          )}
        </group>
        <group name="Rotate Handles Group" ref={rotateHandlesGroupRef} onPointerDown={onRotateHandlePointerDown}>
          <RotateHandle
            id={id}
            handleType={RotateHandleType.Lower}
            position={lowerRotateHandlePosition}
            ratio={size * 4}
            hoverHandle={hoverHandle}
            noHoverHandle={noHoverHandle}
          />
          <RotateHandle
            id={id}
            position={upperRotateHandlePosition}
            handleType={RotateHandleType.Upper}
            ratio={size * 4}
            hoverHandle={hoverHandle}
            noHoverHandle={noHoverHandle}
          />
        </group>
        {showRuler(highlightedHandle)}
      </>
    );
  },
);

export default HandlesGroup;
