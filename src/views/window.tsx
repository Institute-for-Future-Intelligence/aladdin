/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { DoubleSide, Mesh, Vector3 } from 'three';
import { Box, Line, Plane, Sphere } from '@react-three/drei';
import { WindowModel } from 'src/models/WindowModel';
import { CommonStoreState, useStore } from 'src/stores/common';
import { ActionType, MoveHandleType, ObjectType, ResizeHandleType } from 'src/types';
import * as Selector from '../stores/selector';
import { HALF_PI } from '../constants';

interface WindowWireFrameProps {
  x: number;
  z: number;
  lineWidth?: number;
}

interface WindowHandleWarpperProps {
  lx: number;
  lz: number;
}

interface WindowResizeHandleProps {
  x: number;
  z: number;
  handleType: ResizeHandleType;
}

interface WindowMoveHandleProps {
  handleType: MoveHandleType;
}

const Window = ({ id, parentId, lx, lz, cx, cz, selected, locked, color }: WindowModel) => {
  const setCommonStore = useStore(Selector.set);
  const selectMe = useStore(Selector.selectMe);

  const buildingWallIDRef = useRef(useStore.getState().buildingWallID);

  const [wlx, setWlx] = useState(lx);
  const [wlz, setWlz] = useState(lz);
  const [wcx, setWcx] = useState(cx);
  const [wcz, setWcz] = useState(cz);

  const parentSelector = useCallback((state: CommonStoreState) => {
    for (const e of state.elements) {
      if (e.id === parentId) {
        return e;
      }
    }
    return null;
  }, []);

  const parent = useStore(parentSelector);

  // subscribe common store
  useEffect(() => {
    useStore.subscribe((state) => (buildingWallIDRef.current = state.buildingWallID));
  }, []);

  useEffect(() => {
    if (parent) {
      setWlx(lx * parent.lx);
      setWlz(lz * parent.lz);
      setWcx(cx * parent.lx);
      setWcz(cz * parent.lz);
    }
  }, [lx, lz, cx, cz, parent?.lx, parent?.lx]);

  return (
    <group key={id} name={`Window group ${id}`} position={[wcx, 0, wcz]} castShadow receiveShadow>
      <Plane
        name={'window ' + id}
        args={[wlx, wlz]}
        rotation={[HALF_PI, 0, 0]}
        onContextMenu={(e) => {
          if (!selected) {
            selectMe(id, e, ActionType.Select);
          }
          if (e.intersections[0].object.name === 'window ' + id) {
            setCommonStore((state) => {
              state.contextMenuObjectType = ObjectType.Window;
            });
          }
        }}
        onPointerDown={(e) => {
          if (e.button === 2 || buildingWallIDRef.current) return; // ignore right-click
          if (e.intersections[0].object.name === 'window ' + id) {
            if (!selected) {
              selectMe(id, e, ActionType.Select);
            }
          }
        }}
      >
        <meshBasicMaterial side={DoubleSide} color={color} opacity={0.5} transparent={true} />
      </Plane>

      {/* wireframes */}
      <WindowWireFrame x={wlx / 2} z={wlz / 2} />

      {/* handles */}
      {selected && !locked && <WindowHandleWarpper lx={wlx} lz={wlz} />}
    </group>
  );
};

const WindowWireFrame = React.memo(({ x, z, lineWidth = 1 }: WindowWireFrameProps) => {
  return (
    <React.Fragment>
      <Line
        points={[
          [-x, 0, -z],
          [x, 0, -z],
        ]}
        linewidth={lineWidth}
      />
      <Line
        points={[
          [-x, 0, -z],
          [-x, 0, z],
        ]}
        linewidth={lineWidth}
      />
      <Line
        points={[
          [x, 0, z],
          [-x, 0, z],
        ]}
        linewidth={lineWidth}
      />
      <Line
        points={[
          [x, 0, z],
          [x, 0, -z],
        ]}
        linewidth={lineWidth}
      />
      <Line
        points={[
          [-x, 0, 0],
          [x, 0, 0],
        ]}
        linewidth={lineWidth}
        color={'white'}
      />
      <Line
        points={[
          [0, 0, -z],
          [0, 0, z],
        ]}
        linewidth={lineWidth}
        color={'white'}
      />
    </React.Fragment>
  );
});

const WindowHandleWarpper = React.memo(({ lx, lz }: WindowHandleWarpperProps) => {
  return (
    <group>
      <WindowResizeHandle x={-lx / 2} z={lz / 2} handleType={ResizeHandleType.UpperLeft} />
      <WindowResizeHandle x={lx / 2} z={lz / 2} handleType={ResizeHandleType.UpperRight} />
      <WindowResizeHandle x={-lx / 2} z={-lz / 2} handleType={ResizeHandleType.LowerLeft} />
      <WindowResizeHandle x={lx / 2} z={-lz / 2} handleType={ResizeHandleType.LowerRight} />
      <WindowMoveHandle handleType={MoveHandleType.Mid} />
    </group>
  );
});

const WindowResizeHandle = React.memo(({ x, z, handleType }: WindowResizeHandleProps) => {
  const setCommonStore = useStore(Selector.set);
  const resizeHandleType = useStore(Selector.resizeHandleType);

  const handleRef = useRef<Mesh>();

  const [color, setColor] = useState('white');

  useEffect(() => {
    if (resizeHandleType === handleType) {
      setColor('red');
    } else {
      setColor('white');
    }
  }, [resizeHandleType]);

  return (
    <Box
      ref={handleRef}
      name={handleType}
      args={[0.1, 0.1, 0.1]}
      position={[x, 0, z]}
      onPointerDown={(e) => {
        setCommonStore((state) => {
          state.enableOrbitController = false;
          state.resizeHandleType = handleType;
          if (handleRef.current) {
            const anchor = handleRef.current.localToWorld(new Vector3(-x * 2, 0, -z * 2));
            state.resizeAnchor.copy(anchor);
          }
        });
      }}
      onPointerEnter={() => {
        setColor('red');
      }}
      onPointerLeave={() => {
        if (resizeHandleType === null) {
          setColor('white');
        }
      }}
    >
      <meshBasicMaterial color={color} />
    </Box>
  );
});

const WindowMoveHandle = React.memo(({ handleType }: WindowMoveHandleProps) => {
  const setCommonStore = useStore(Selector.set);
  const moveHandleType = useStore(Selector.moveHandleType);

  const handleRef = useRef<Mesh>();

  const [color, setColor] = useState('white');

  useEffect(() => {
    if (moveHandleType === MoveHandleType.Mid) {
      setColor('red');
    } else {
      setColor('white');
    }
  }, [moveHandleType]);

  return (
    <Sphere
      ref={handleRef}
      name={handleType}
      onPointerDown={(e) => {
        setCommonStore((state) => {
          state.enableOrbitController = false;
          state.moveHandleType = handleType;
        });
      }}
      args={[0.1, 6, 6]}
      onPointerEnter={() => {
        setColor('red');
      }}
      onPointerLeave={() => {
        if (moveHandleType === null) {
          setColor('white');
        }
      }}
    >
      <meshBasicMaterial color={color} />
    </Sphere>
  );
});

export default React.memo(Window);
