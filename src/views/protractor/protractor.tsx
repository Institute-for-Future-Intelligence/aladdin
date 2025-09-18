import { Box, Cylinder, Extrude, Line, Plane } from '@react-three/drei';
import { ThreeEvent, useFrame, useLoader, useThree } from '@react-three/fiber';
import { useSelected } from 'src/hooks';
import { ProtractorModel } from 'src/models/ProtractorModel';
import { useStore } from 'src/stores/common';
import { MoveHandleType, ObjectType, ResizeHandleType, RotateHandleType } from 'src/types';
import { useRulerGroundEndPointPosition } from '../ruler/hooks';
import { forwardRef, ReactNode, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { usePrimitiveStore } from 'src/stores/commonPrimitive';
import MoveHandle from 'src/components/moveHandle';
import { useRefStore } from 'src/stores/commonRef';
import { Group, Mesh, Shape, Vector3 } from 'three';
import { RulerUtil } from '../ruler/RulerUtil';
import { RulerGroundSnapPoint, RulerSnappedHandle } from 'src/models/RulerModel';
import {
  DEFAULT_PROTRACTOR_COLOR,
  DEFAULT_PROTRACTOR_LY,
  DEFAULT_PROTRACTOR_LZ,
  DEFAULT_PROTRACTOR_RADIUS,
  DEFAULT_PROTRACTOR_TICK_MARK_COLOR as DEFAULT_PROTRACTOR_TICK_MARK_COLOR,
  HALF_PI,
} from 'src/constants';
import SpriteText from 'three-spritetext';
import { FontLoader, TextGeometryParameters } from 'three/examples/jsm/Addons';
//@ts-expect-error ignore
import helvetikerFont from '../../assets/helvetiker_regular.typeface.fnt';
import { Util } from 'src/Util';
import { UndoableChangeProtractor } from 'src/undo/UndoableChange';
import { useHandleSize } from '../wall/hooks';
import ResizeHandle from 'src/components/resizeHandle';

const Protractor = (protractor: ProtractorModel) => {
  const {
    id,
    cx,
    cy,
    ly,
    lz,
    startArmEndPoint,
    endArmEndPoint,
    centerSnappedHandle,
    locked,
    color = DEFAULT_PROTRACTOR_COLOR,
    tickMarkColor = DEFAULT_PROTRACTOR_TICK_MARK_COLOR,
    radius,
  } = protractor;

  const handlesGroupRef = useRef<Group>(null!);
  const armsGroupRef = useRef<Group>(null!);
  const startArmRef = useRef<StartArmRef>(null!);
  const endArmRef = useRef<EndArmRef>(null!);
  const readingRef = useRef<ReadingRef>(null!);

  const radiusRef = useRef<number | null>(null);
  const operationRef = useRef<string | null>(null);
  const snapPointsRef = useRef<RulerGroundSnapPoint[]>([]);
  const snappedPointsRef = useRef<{
    start: RulerGroundSnapPoint | null;
    end: RulerGroundSnapPoint | null;
    center: RulerGroundSnapPoint | null;
  }>({
    start: null,
    end: null,
    center: null,
  });

  const startArmEndPointPosition = useRulerGroundEndPointPosition(startArmEndPoint);
  const endArmEndPointPosition = useRulerGroundEndPointPosition(endArmEndPoint);
  const centerPointPosition = useRulerGroundEndPointPosition({
    position: [cx, cy, 0],
    snappedHandle: centerSnappedHandle,
  });
  const [_cx, _cy] = centerPointPosition.current;

  const [startArmEndPointX, startArmEndPointY] = startArmEndPointPosition.current;
  const [endArmEndPointX, endArmEndPointY] = endArmEndPointPosition.current;

  const selected = useSelected(id);
  const { gl, set } = useThree();
  const handleSize = useHandleSize(0.5);

  const copySnappedHandle = (snappedHandle?: RulerSnappedHandle) => {
    if (!snappedHandle) return undefined;
    return {
      elementId: snappedHandle.elementId,
      direction: [...snappedHandle.direction],
    };
  };

  const updateUndo = (
    id: string,
    startPoint: number[],
    endPoint: number[],
    center: number[],
    startSnappedHandle?: RulerSnappedHandle,
    endSnappedHandle?: RulerSnappedHandle,
    centerSnappedHandle?: RulerSnappedHandle,
  ) => {
    useStore.getState().set((state) => {
      const protractor = state.elements.find((e) => e.id === id && e.type === ObjectType.Protractor) as ProtractorModel;
      if (!protractor) return;

      protractor.cx = center[0];
      protractor.cy = center[1];
      protractor.cz = center[2];

      protractor.startArmEndPoint.position = [...startPoint];
      protractor.endArmEndPoint.position = [...endPoint];

      if (startSnappedHandle) {
        protractor.startArmEndPoint.snappedHandle = copySnappedHandle(startSnappedHandle);
      } else {
        delete protractor.startArmEndPoint.snappedHandle;
      }
      if (endSnappedHandle) {
        protractor.endArmEndPoint.snappedHandle = copySnappedHandle(endSnappedHandle);
      } else {
        delete protractor.endArmEndPoint.snappedHandle;
      }
      if (centerSnappedHandle) {
        protractor.centerSnappedHandle = copySnappedHandle(centerSnappedHandle);
      } else {
        delete protractor.centerSnappedHandle;
      }
    });
  };

  const addUndoChanged = (oldProtractor: ProtractorModel, newProtractor: ProtractorModel) => {
    if (
      Util.isIdentical(oldProtractor.startArmEndPoint.position, newProtractor.startArmEndPoint.position) &&
      Util.isIdentical(oldProtractor.endArmEndPoint.position, newProtractor.endArmEndPoint.position) &&
      oldProtractor.cx === newProtractor.cx &&
      oldProtractor.cy === newProtractor.cy
    ) {
      return;
    }

    const undoable = {
      name: `Move Protractor`,
      timestamp: Date.now(),
      id: newProtractor.id,
      oldStartPointPosition: [...oldProtractor.startArmEndPoint.position],
      newStartPointPosition: [...newProtractor.startArmEndPoint.position],
      oldEndPointPosition: [...oldProtractor.endArmEndPoint.position],
      newEndPointPosition: [...newProtractor.endArmEndPoint.position],
      oldCenterPosition: [oldProtractor.cx, oldProtractor.cy, oldProtractor.cz],
      newCenterPosition: [newProtractor.cx, newProtractor.cy, newProtractor.cz],
      oldStartSnappedHandle: copySnappedHandle(oldProtractor.startArmEndPoint.snappedHandle),
      newStartSnappedHandle: copySnappedHandle(newProtractor.startArmEndPoint.snappedHandle),
      oldEndSnappedHandle: copySnappedHandle(oldProtractor.endArmEndPoint.snappedHandle),
      newEndSnappedHandle: copySnappedHandle(newProtractor.endArmEndPoint.snappedHandle),
      oldCenterSnappedHandle: copySnappedHandle(oldProtractor.centerSnappedHandle),
      newCenterSnappedHandle: copySnappedHandle(newProtractor.centerSnappedHandle),
      undo() {
        updateUndo(
          undoable.id,
          undoable.oldStartPointPosition,
          undoable.oldEndPointPosition,
          undoable.oldCenterPosition,
          undoable.oldStartSnappedHandle,
          undoable.oldEndSnappedHandle,
          undoable.oldCenterSnappedHandle,
        );
      },
      redo() {
        updateUndo(
          undoable.id,
          undoable.newStartPointPosition,
          undoable.newEndPointPosition,
          undoable.newCenterPosition,
          undoable.newStartSnappedHandle,
          undoable.newEndSnappedHandle,
          undoable.newCenterSnappedHandle,
        );
      },
    } as UndoableChangeProtractor;

    useStore.getState().addUndoable(undoable);
  };

  const updateHandleMesh = (handleName: string, p: Vector3) => {
    if (handlesGroupRef.current) {
      for (const obj of handlesGroupRef.current.children) {
        if (obj.name === handleName) {
          obj.position.x = p.x;
          obj.position.y = p.y;
        }
      }
    }
  };

  const onGroupPointerDown = (event: ThreeEvent<PointerEvent>) => {
    if (event.intersections.length == 0 || event.intersections[0].object !== event.object) return;

    useStore.getState().selectElement(id);
    // right click
    if (event.button === 2) {
      useStore.getState().set((state) => {
        state.contextMenuObjectType = ObjectType.Protractor;
      });
    }
  };

  const onMoveHandlesPointDown = (event: ThreeEvent<PointerEvent>) => {
    if (event.intersections.length == 0 || event.intersections[0].object !== event.object) return;
    set({ frameloop: 'always' });
    useRefStore.getState().setEnableOrbitController(false);
    operationRef.current = event.object.name;
  };

  const onResizeHandlePointerDown = (event: ThreeEvent<PointerEvent>) => {
    if (event.intersections.length == 0 || event.intersections[0].object !== event.object) return;
    set({ frameloop: 'always' });
    useRefStore.getState().setEnableOrbitController(false);
    operationRef.current = event.object.name;

    // prepare for snap
    snapPointsRef.current = RulerUtil.getGroundSnapPointsArray();
  };

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

  const onPointerUp = () => {
    if (operationRef.current) {
      const oldProtractor = useStore
        .getState()
        .elements.find((e) => e.id === id && e.type === ObjectType.Protractor) as ProtractorModel;

      useStore.getState().set((state) => {
        const protractor = state.elements.find(
          (e) => e.id === id && e.type === ObjectType.Protractor,
        ) as ProtractorModel;
        if (!protractor) return;

        if (handlesGroupRef.current) {
          /** handle sequence matters here */
          const startArmEndPosition = handlesGroupRef.current.children[0].position;
          const endArmEndPosition = handlesGroupRef.current.children[1].position;
          const center = handlesGroupRef.current.children[2].position;

          protractor.cx = center.x;
          protractor.cy = center.y;
          protractor.startArmEndPoint.position = startArmEndPosition.toArray();
          protractor.endArmEndPoint.position = endArmEndPosition.toArray();
          if (radiusRef.current !== null) {
            protractor.radius = radiusRef.current;
          }

          if (snappedPointsRef.current) {
            const { start, end, center } = snappedPointsRef.current;
            if (operationRef.current === MoveHandleType.Start) {
              if (start) {
                protractor.startArmEndPoint.snappedHandle = {
                  elementId: start.elementId,
                  direction: start.direction.toArray(),
                };
              } else {
                delete protractor.startArmEndPoint.snappedHandle;
              }
            } else if (operationRef.current === MoveHandleType.End) {
              if (end) {
                protractor.endArmEndPoint.snappedHandle = {
                  elementId: end.elementId,
                  direction: end.direction.toArray(),
                };
              } else {
                delete protractor.endArmEndPoint.snappedHandle;
              }
            } else if (operationRef.current === MoveHandleType.Mid) {
              if (center) {
                protractor.centerSnappedHandle = {
                  elementId: center.elementId,
                  direction: center.direction.toArray(),
                };
              } else {
                delete protractor.centerSnappedHandle;
              }
              if (start) {
                protractor.startArmEndPoint.snappedHandle = {
                  elementId: start.elementId,
                  direction: start.direction.toArray(),
                };
              } else {
                delete protractor.startArmEndPoint.snappedHandle;
              }
              if (end) {
                protractor.endArmEndPoint.snappedHandle = {
                  elementId: end.elementId,
                  direction: end.direction.toArray(),
                };
              } else {
                delete protractor.endArmEndPoint.snappedHandle;
              }
            }
          }
        }
      });

      const newProtractor = useStore
        .getState()
        .elements.find((e) => e.id === id && e.type === ObjectType.Protractor) as ProtractorModel;

      addUndoChanged(oldProtractor, newProtractor);
    }
    set({ frameloop: 'demand' });
    useRefStore.getState().setEnableOrbitController(true);
    operationRef.current = null;
    snappedPointsRef.current = { start: null, end: null, center: null };
    snapPointsRef.current = [];
    radiusRef.current = null;
  };

  // pointer up
  useEffect(() => {
    window.addEventListener('pointerup', onPointerUp);
    return () => window.removeEventListener('pointerup', onPointerUp);
  }, []);

  useFrame(({ camera, scene, raycaster }) => {
    if (operationRef.current === null) return;

    const point = RulerUtil.getGroundPointer(raycaster, scene, camera);
    if (!point) return;

    if (operationRef.current === MoveHandleType.Start) {
      const { pointer, snappedPoint } = RulerUtil.getGroundSnappedPoint(point, snapPointsRef.current);
      snappedPointsRef.current.start = snappedPoint;
      updateHandleMesh(operationRef.current, pointer);
      startArmRef.current.updateEndPoint(pointer.x, pointer.y);
      readingRef.current.updateStart(Math.atan2(pointer.y - _cy, pointer.x - _cx));
    } else if (operationRef.current === MoveHandleType.End) {
      const { pointer, snappedPoint } = RulerUtil.getGroundSnappedPoint(point, snapPointsRef.current);
      snappedPointsRef.current.end = snappedPoint;
      updateHandleMesh(operationRef.current, pointer);
      endArmRef.current.updateEndPoint(pointer.x, pointer.y);
      readingRef.current.updateEnd(Math.atan2(pointer.y - _cy, pointer.x - _cx));
    } else if (operationRef.current === MoveHandleType.Mid) {
      const { pointer, snappedPoint } = RulerUtil.getGroundSnappedPoint(point, snapPointsRef.current);
      const dx = pointer.x - _cx;
      const dy = pointer.y - _cy;
      updateHandleMesh(operationRef.current, pointer);
      updateHandleMesh(MoveHandleType.Start, new Vector3(startArmEndPointX + dx, startArmEndPointY + dy));
      updateHandleMesh(MoveHandleType.End, new Vector3(endArmEndPointX + dx, endArmEndPointY + dy));
      snappedPointsRef.current.center = snappedPoint;
      startArmRef.current.updatePosition(pointer.x, pointer.y);
      endArmRef.current.updatePosition(pointer.x, pointer.y);
      readingRef.current.updatePosition(pointer.x, pointer.y);
    } else if (operationRef.current === ResizeHandleType.Default) {
      const r = Math.max(0.5, point.distanceTo(new Vector3(cx, cy)));
      startArmRef.current.updateRadius(r);
      radiusRef.current = r;
    }
  });

  return (
    <group onPointerDown={onGroupPointerDown}>
      {/* arms */}
      <group ref={armsGroupRef}>
        {/* start arm  */}
        <StartArm
          ref={startArmRef}
          startX={_cx}
          startY={_cy}
          endX={startArmEndPointX}
          endY={startArmEndPointY}
          color={color}
          ly={ly}
          lz={lz}
          radius={radius}
          tickMarkColor={tickMarkColor}
        >
          {selected && !locked && (
            <group onPointerDown={onResizeHandlePointerDown}>
              <ResizeHandle
                handleType={ResizeHandleType.Default}
                position={[0, 0, 0]}
                size={handleSize * 0.35}
                onPointerOver={hoverHandle}
                onPointerOut={noHoverHandle}
              />
            </group>
          )}
        </StartArm>

        {/* end arm  */}
        <EndArm
          ref={endArmRef}
          startX={_cx}
          startY={_cy}
          endX={endArmEndPointX}
          endY={endArmEndPointY}
          ly={ly}
          lz={lz}
          color={color}
        />
      </group>

      {/* handles */}
      {selected && !locked && (
        <group ref={handlesGroupRef} onPointerDown={onMoveHandlesPointDown}>
          {/* Don't change the sequence of the handles! search: "handle sequence" in this file */}
          <MoveHandle
            handleType={MoveHandleType.Start}
            position={[startArmEndPointX, startArmEndPointY, 0]}
            size={handleSize}
            onPointerOver={hoverHandle}
            onPointerOut={noHoverHandle}
          />
          <MoveHandle
            handleType={MoveHandleType.End}
            position={[endArmEndPointX, endArmEndPointY, 0]}
            size={handleSize}
            onPointerOver={hoverHandle}
            onPointerOut={noHoverHandle}
          />
          <MoveHandle
            handleType={MoveHandleType.Mid}
            position={[_cx, _cy, 0]}
            size={handleSize}
            onPointerOver={hoverHandle}
            onPointerOut={noHoverHandle}
          />
        </group>
      )}

      <group position={[0, 0, lz]}>
        <Reading
          ref={readingRef}
          startAngle={Math.atan2(startArmEndPointY - _cy, startArmEndPointX - _cx)}
          endAngle={Math.atan2(endArmEndPointY - _cy, endArmEndPointX - _cx)}
          cx={_cx}
          cy={_cy}
          ly={ly}
        />
      </group>
    </group>
  );
};

export default Protractor;

interface StartArmProps {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  color: string;
  ly: number;
  lz: number;
  radius: number;
  tickMarkColor: string;
  children?: ReactNode;
}

interface StartArmRef {
  updatePosition: (px: number, py: number) => void;
  updateEndPoint: (px: number, py: number) => void;
  updateRadius: (r: number) => void;
}

interface EndArmProps {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  color: string;
  ly: number;
  lz: number;
  children?: ReactNode;
}

interface EndArmRef {
  updatePosition: (px: number, py: number) => void;
  updateEndPoint: (px: number, py: number) => void;
}

interface ReadingProps {
  cx: number;
  cy: number;
  ly: number;
  startAngle: number;
  endAngle: number;
}

interface ReadingRef {
  updatePosition: (px: number, py: number) => void;
  updateStart: (r: number) => void;
  updateEnd: (r: number) => void;
}

const TickMark = ({ color, lz, radius }: { radius: number; color: string; lz: number }) => {
  const tickMarks = useMemo(() => {
    const arr = [];
    for (let i = 0; i <= 180; i += 5) {
      arr.push(i);
    }
    return arr;
  }, []);

  const font = useLoader(FontLoader, helvetikerFont);
  const textGeometryParamsTickLabel = {
    font: font,
    height: 0,
    size: 0.05 * radius,
  } as TextGeometryParameters;

  return (
    <group rotation={[-HALF_PI, 0, 0]} position={[0, lz / 2 + 0.001, 0]}>
      {tickMarks.map((value, i) => {
        const length = value % 15 === 0 ? 0.85 : 0.95;
        let fontPosition = 0.04 * radius;
        if (value === 0) fontPosition = 0.02 * radius;
        else if (value >= 100) fontPosition = 0.06 * radius;
        return (
          <group key={i} rotation={[0, 0, (value / 180) * Math.PI]}>
            <Line
              userData={{ unintersectable: true }}
              points={[
                [length * radius, 0],
                [radius, 0],
              ]}
              color={color}
            />
            {value % 15 === 0 && (
              <mesh
                position={[0.8 * radius, fontPosition, 0]}
                rotation={[0, 0, -HALF_PI]}
                userData={{ unintersectable: true }}
              >
                <textGeometry args={[`${value}`, textGeometryParamsTickLabel]} />
                <meshBasicMaterial color={color} />
              </mesh>
            )}
          </group>
        );
      })}
    </group>
  );
};

const StartArm = forwardRef<StartArmRef, StartArmProps>(
  (
    {
      startX,
      startY,
      endX,
      endY,
      color,
      lz = DEFAULT_PROTRACTOR_LZ,
      ly = DEFAULT_PROTRACTOR_LY,
      radius = DEFAULT_PROTRACTOR_RADIUS,
      tickMarkColor = DEFAULT_PROTRACTOR_TICK_MARK_COLOR,
      children,
    },
    ref,
  ) => {
    const length = Math.hypot(endX - startX, endY - startY);
    const angle = Math.atan2(endY - startY, endX - startX);

    const groupRef = useRef<Group>(null!);
    const cylinderGroupRef = useRef<Group>(null!);
    const boxRef = useRef<Mesh>(null!);

    const [_radius, setRadius] = useState(radius);

    useEffect(() => {
      setRadius(radius);
    }, [radius]);

    useImperativeHandle(ref, () => ({
      updateEndPoint(px, py) {
        const length = Math.hypot(px - startX, py - startY);
        groupRef.current.rotation.z = Math.atan2(py - startY, px - startX);
        boxRef.current.position.x = length / 2;
        boxRef.current.scale.x = length;
      },
      updatePosition(px, py) {
        groupRef.current.position.x = px;
        groupRef.current.position.y = py;
      },
      updateRadius(r) {
        setRadius(r);
      },
    }));

    return (
      <group ref={groupRef} position={[startX, startY, lz / 2]} rotation={[0, 0, angle]}>
        <Box ref={boxRef} position={[length / 2, ly / 2, 0]} scale={[length, ly, lz]}>
          <meshStandardMaterial color={color} />
        </Box>

        <group ref={cylinderGroupRef} rotation={[HALF_PI, 0, 0]}>
          <Cylinder args={[_radius, _radius, lz, 32, 1, false, HALF_PI, Math.PI]}>
            <meshStandardMaterial color={color} />
          </Cylinder>
          <Plane args={[_radius * 2, lz]}>
            <meshStandardMaterial color={color} />
          </Plane>

          <group position={[_radius, 0.05, 0]}>{children}</group>

          <TickMark color={tickMarkColor} lz={lz} radius={_radius} />
        </group>
      </group>
    );
  },
);

const EndArm = forwardRef<EndArmRef, EndArmProps>(({ startX, startY, endX, endY, ly, lz }, ref) => {
  const length = Math.hypot(endX - startX, endY - startY);
  const angle = Math.atan2(endY - startY, endX - startX);

  const shape = useMemo(() => {
    const s = new Shape();
    s.lineTo(-ly * 5, 0);
    s.lineTo(0, -ly / 2);
    s.closePath();
    return s;
  }, [ly]);

  const groupRef = useRef<Group>(null!);
  const boxRef = useRef<Mesh>(null!);
  const extrudeRef = useRef<Mesh>(null!);

  useImperativeHandle(ref, () => ({
    updateEndPoint(px, py) {
      const length = Math.hypot(px - startX, py - startY);
      groupRef.current.rotation.z = Math.atan2(py - startY, px - startX);
      boxRef.current.scale.x = length;
      boxRef.current.position.x = length / 2;
    },
    updatePosition(px, py) {
      groupRef.current.position.x = px;
      groupRef.current.position.y = py;
    },
  }));

  const thickness = 0.1;
  return (
    <group ref={groupRef} position={[startX, startY, lz]} rotation={[0, 0, angle]}>
      <Box ref={boxRef} scale={[length, ly, thickness]} position={[length / 2, -ly / 2, 0]}>
        <meshStandardMaterial color={'lightgrey'} />
      </Box>
      {/* pointer */}
      <Extrude ref={extrudeRef} position={[0, 0, -0.05]} args={[shape, { steps: 1, depth: 0.1, bevelEnabled: false }]}>
        <meshStandardMaterial color={'lightgrey'} />
      </Extrude>
    </group>
  );
});

const Reading = forwardRef<ReadingRef, ReadingProps>(({ startAngle, endAngle, cx, cy, ly }, ref) => {
  const groupRef = useRef<Group>(null!);
  const textRef = useRef<SpriteText>(null!);

  const getReading = (end: number, start: number) => {
    const delta = end - start;
    const angle = Math.atan2(Math.sin(delta), Math.cos(delta));
    return Math.abs((angle / Math.PI) * 180);
  };

  const reading = getReading(endAngle, startAngle);

  useImperativeHandle(ref, () => ({
    updatePosition(px, py) {
      if (groupRef.current) {
        groupRef.current.position.x = px;
        groupRef.current.position.y = py;
      }
    },
    updateStart(r) {
      if (groupRef.current) {
        groupRef.current.rotation.z = r;
      }
      if (textRef.current) {
        textRef.current.text = getReading(endAngle, r).toFixed(1) + '°';
      }
    },
    updateEnd(r) {
      if (textRef.current) {
        textRef.current.text = getReading(r, startAngle).toFixed(1) + '°';
      }
    },
  }));

  return (
    <group ref={groupRef} position={[cx, cy, 0.25]} rotation={[0, 0, startAngle]}>
      <textSprite
        ref={textRef}
        userData={{ unintersectable: true }}
        backgroundColor={'darkorchid'}
        fontSize={30}
        fontFace={'Times Roman'}
        textHeight={ly * 1.5}
        text={reading.toFixed(1) + '°'}
        position={[0, 0.5, 0.1]}
      />
    </group>
  );
});
