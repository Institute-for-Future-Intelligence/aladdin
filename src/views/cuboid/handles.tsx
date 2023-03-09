import { ThreeEvent, useThree } from '@react-three/fiber';
import { useCallback, useMemo } from 'react';
import MoveHandle from 'src/components/moveHandle';
import ResizeHandle from 'src/components/resizeHandle';
import RotateHandle from 'src/components/rotateHandle';
import { RESIZE_HANDLE_SIZE } from 'src/constants';
import { useStore } from 'src/stores/common';
import { usePrimitiveStore } from 'src/stores/commonPrimitive';
import { MoveHandleType, ResizeHandleType, RotateHandleType } from 'src/types';
import { Util } from 'src/Util';
import * as Selector from '../../stores/selector';
import { useHandleSize } from '../wall/hooks';

interface HandlesProps {
  id: string;
  args: number[];
}

const Handles = ({ id, args }: HandlesProps) => {
  const [hx, hy, hz] = args;

  const setCommonStore = useStore(Selector.set);
  const getElementById = useStore(Selector.getElementById);
  const orthographic = useStore(Selector.viewState.orthographic);
  const addedCuboidId = useStore(Selector.addedCuboidId);

  const {
    gl: { domElement },
  } = useThree();

  const size = useHandleSize();

  // const rotateHandleSize = Math.max(1, Math.max(hx, hy) / 4) * size * 2;

  const lowerRotateHandlePosition: [x: number, y: number, z: number] = useMemo(() => {
    return [0, Math.min(-1.2 * hy, -hy - 0.75) - size * 2, RESIZE_HANDLE_SIZE / 2 - hz];
  }, [hy, hz, size]);

  const upperRotateHandlePosition: [x: number, y: number, z: number] = useMemo(() => {
    return [0, Math.max(1.2 * hy, hy + 0.75) + size * 2, RESIZE_HANDLE_SIZE / 2 - hz];
  }, [hy, hz, size]);

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
            const cm = getElementById(id);
            if (cm) {
              state.selectedElementHeight = cm.lz;
            }
          });
          if (Util.isMoveHandle(handle)) {
            domElement.style.cursor = 'move';
          } else if (handle === RotateHandleType.Upper || handle === RotateHandleType.Lower) {
            domElement.style.cursor = 'grab';
          } else {
            domElement.style.cursor = useStore.getState().addedCuboidId ? 'crosshair' : 'pointer';
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
    domElement.style.cursor = useStore.getState().addedCuboidId ? 'crosshair' : 'default';
  }, []);

  return (
    <>
      {/* bottom resize handles */}
      <>
        <ResizeHandle
          handleType={ResizeHandleType.UpperLeft}
          position={[-hx, hy, -hz]}
          size={size}
          onPointerOver={hoverHandle}
          onPointerOut={noHoverHandle}
        />
        <ResizeHandle
          handleType={ResizeHandleType.UpperRight}
          position={[hx, hy, -hz]}
          size={size}
          onPointerOver={hoverHandle}
          onPointerOut={noHoverHandle}
        />
        <ResizeHandle
          handleType={ResizeHandleType.LowerLeft}
          position={[-hx, -hy, -hz]}
          size={size}
          onPointerOver={hoverHandle}
          onPointerOut={noHoverHandle}
        />
        <ResizeHandle
          handleType={ResizeHandleType.LowerRight}
          position={[hx, -hy, -hz]}
          size={size}
          onPointerOver={hoverHandle}
          onPointerOut={noHoverHandle}
        />
      </>

      {/* top resize handles */}
      {!orthographic && (
        <>
          <ResizeHandle
            handleType={ResizeHandleType.LowerLeftTop}
            position={[-hx, -hy, hz]}
            size={size}
            onPointerOver={hoverHandle}
            onPointerOut={noHoverHandle}
          />
          <ResizeHandle
            handleType={ResizeHandleType.UpperLeftTop}
            position={[-hx, hy, hz]}
            size={size}
            onPointerOver={hoverHandle}
            onPointerOut={noHoverHandle}
          />
          <ResizeHandle
            handleType={ResizeHandleType.LowerRightTop}
            position={[hx, -hy, hz]}
            size={size}
            onPointerOver={hoverHandle}
            onPointerOut={noHoverHandle}
          />
          <ResizeHandle
            handleType={ResizeHandleType.UpperRightTop}
            position={[hx, hy, hz]}
            size={size}
            onPointerOver={hoverHandle}
            onPointerOut={noHoverHandle}
          />
        </>
      )}

      {!addedCuboidId && (
        <>
          {/* move handles */}
          <>
            <MoveHandle
              handleType={MoveHandleType.Lower}
              position={[0, -hy, -hz]}
              size={size}
              onPointerOver={hoverHandle}
              onPointerOut={noHoverHandle}
            />
            <MoveHandle
              handleType={MoveHandleType.Upper}
              position={[0, hy, -hz]}
              size={size}
              onPointerOver={hoverHandle}
              onPointerOut={noHoverHandle}
            />
            <MoveHandle
              handleType={MoveHandleType.Left}
              position={[-hx, 0, -hz]}
              size={size}
              onPointerOver={hoverHandle}
              onPointerOut={noHoverHandle}
            />
            <MoveHandle
              handleType={MoveHandleType.Right}
              position={[hx, 0, -hz]}
              size={size}
              onPointerOver={hoverHandle}
              onPointerOut={noHoverHandle}
            />
            <MoveHandle
              handleType={MoveHandleType.Top}
              position={[0, 0, hz]}
              size={size}
              onPointerOver={hoverHandle}
              onPointerOut={noHoverHandle}
            />
          </>

          {/* rotate handles */}
          <>
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
          </>
        </>
      )}
    </>
  );
};

export default Handles;
