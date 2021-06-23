/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, {useRef, useState} from "react";
import {Box, Line, Sphere} from "@react-three/drei";
import {Mesh, Vector3} from "three";
import {useStore} from "../stores/common";
import {CuboidModel} from "../models/cuboidModel";
import {ThreeEvent, useThree} from "@react-three/fiber";
import {ActionType, MoveHandleType, ResizeHandleType} from "../types";
import {
    RESIZE_HANDLE_SIZE,
    MOVE_HANDLE_OFFSET,
    MOVE_HANDLE_RADIUS,
    HIGHLIGHT_HANDLE_COLOR,
    RESIZE_HANDLE_COLOR,
    MOVE_HANDLE_COLOR
} from "../constants";
import {Util} from "../util";

const Cuboid = ({
                    id,
                    cx,
                    cy,
                    lx = 1,
                    ly = 1,
                    lz = 1,
                    rotation = [0, 0, 0],
                    color = 'silver',
                    lineColor = 'black',
                    lineWidth = 0.1,
                    selected = false,
                }: CuboidModel) => {

    cy = -cy; // we want positive y to point north

    const setCommonStore = useStore(state => state.set);
    const shadowEnabled = useStore(state => state.shadowEnabled);
    const moveHandleType = useStore(state => state.moveHandleType);
    const resizeHandleType = useStore(state => state.resizeHandleType);
    const {gl: {domElement}} = useThree();
    const [hovered, setHovered] = useState(false);
    const [hoveredHandle, setHoveredHandle] = useState<MoveHandleType | ResizeHandleType | null>(null);

    const baseRef = useRef<Mesh>();
    const resizeHandleLLTopRef = useRef<Mesh>();
    const resizeHandleULTopRef = useRef<Mesh>();
    const resizeHandleLRTopRef = useRef<Mesh>();
    const resizeHandleURTopRef = useRef<Mesh>();
    const resizeHandleLLBotRef = useRef<Mesh>();
    const resizeHandleULBotRef = useRef<Mesh>();
    const resizeHandleLRBotRef = useRef<Mesh>();
    const resizeHandleURBotRef = useRef<Mesh>();

    const hx = lx / 2;
    const hy = ly / 2;
    const hz = lz / 2;
    const positionLLTop = new Vector3(-hx, hz, -hy);
    const positionULTop = new Vector3(-hx, hz, hy);
    const positionLRTop = new Vector3(hx, hz, -hy);
    const positionURTop = new Vector3(hx, hz, hy);

    const handleLift = MOVE_HANDLE_RADIUS / 2;
    const positionLLBot = new Vector3(-hx, handleLift - hz, -hy);
    const positionULBot = new Vector3(-hx, handleLift - hz, hy);
    const positionLRBot = new Vector3(hx, handleLift - hz, -hy);
    const positionURBot = new Vector3(hx, handleLift - hz, hy);

    const moveHandleLowerFaceRef = useRef<Mesh>();
    const moveHandleUpperFaceRef = useRef<Mesh>();
    const moveHandleLeftFaceRef = useRef<Mesh>();
    const moveHandleRightFaceRef = useRef<Mesh>();
    const moveHandleTopFaceRef = useRef<Mesh>();

    const positionLowerFace = new Vector3(0, handleLift - hz, -hy - MOVE_HANDLE_OFFSET);
    const positionUpperFace = new Vector3(0, handleLift - hz, hy + MOVE_HANDLE_OFFSET);
    const positionLeftFace = new Vector3(-hx - MOVE_HANDLE_OFFSET, handleLift - hz, 0);
    const positionRightFace = new Vector3(hx + MOVE_HANDLE_OFFSET, handleLift - hz, 0);
    const positionTopFace = new Vector3(0, hz + MOVE_HANDLE_OFFSET, 0);

    const selectMe = (e: ThreeEvent<MouseEvent>, action: ActionType) => {
        if (e.intersections.length > 0) {
            const intersected = e.intersections[0].object === e.eventObject;
            if (intersected) {
                setCommonStore((state) => {
                    for (const e of state.elements) {
                        e.selected = e.id === id;
                    }
                    switch (action) {
                        case ActionType.Move:
                            state.moveHandleType = e.eventObject.name as MoveHandleType;
                            state.resizeHandleType = null;
                            break;
                        case ActionType.Resize:
                            state.resizeHandleType = e.eventObject.name as ResizeHandleType;
                            state.moveHandleType = null;
                            break;
                        default:
                            state.moveHandleType = null;
                            state.resizeHandleType = null;
                    }
                });
            }
        }
    };

    const hoverHandle = (e: ThreeEvent<MouseEvent>, handle: MoveHandleType | ResizeHandleType) => {
        if (e.intersections.length > 0) {
            const intersected = e.intersections[0].object === e.eventObject;
            if (intersected) {
                setHoveredHandle(handle);
                if ( // unfortunately, I cannot find a way to tell the type of an enum variable
                    handle === MoveHandleType.Top ||
                    handle === MoveHandleType.Upper ||
                    handle === MoveHandleType.Lower ||
                    handle === MoveHandleType.Left ||
                    handle === MoveHandleType.Right
                ) {
                    domElement.style.cursor = 'move';
                } else {
                    domElement.style.cursor = 'pointer';
                }
            }
        }
    };

    const noHoverHandle = () => {
        setHoveredHandle(null);
        domElement.style.cursor = 'default';
    };

    return (

        <group name={'Cuboid Group ' + id}
               position={[cx, hz, cy]}
               rotation={Util.getEuler(rotation)}>

            {/* draw rectangular cuboid */}
            <Box castShadow={shadowEnabled}
                 receiveShadow={shadowEnabled}
                 ref={baseRef}
                 args={[lx, lz, ly]}
                 name={'Cuboid'}
                 onPointerDown={(e) => {
                     selectMe(e, ActionType.Select);
                 }}
                 onContextMenu={(e) => {
                     selectMe(e, ActionType.Select);
                 }}
                 onPointerOver={(e) => {
                     if (e.intersections.length > 0) {
                         const intersected = e.intersections[0].object === baseRef.current;
                         if (intersected) {
                             setHovered(true);
                         }
                     }
                 }}
                 onPointerOut={(e) => {
                     setHovered(false);
                 }}
            >
                <meshStandardMaterial attach="material" color={color}/>
            </Box>

            {!selected &&
            <>
                {/* draw wireframe lines top */}
                <Line points={[positionLLTop, positionLRTop]}
                      name={'Line LL-LR Top'}
                      lineWidth={lineWidth}
                      color={lineColor}/>
                <Line points={[positionLRTop, positionURTop]}
                      name={'Line LR-UR Top'}
                      lineWidth={lineWidth}
                      color={lineColor}/>
                <Line points={[positionURTop, positionULTop]}
                      name={'Line UR-UL Top'}
                      lineWidth={lineWidth}
                      color={lineColor}/>
                <Line points={[positionULTop, positionLLTop]}
                      name={'Line UL-LL Top'}
                      lineWidth={lineWidth}
                      color={lineColor}/>

                {/* draw wireframe lines lower face */}
                <Line
                    points={[positionLLBot, positionLRBot]}
                    name={'Line LL-LR Bottom'}
                    lineWidth={lineWidth}
                    color={lineColor}/>
                <Line
                    points={[positionLRBot, positionURBot]}
                    name={'Line LR-UR Bottom'}
                    lineWidth={lineWidth}
                    color={lineColor}/>
                <Line
                    points={[positionURBot, positionULBot]}
                    name={'Line UR-UL Bottom'}
                    lineWidth={lineWidth}
                    color={lineColor}/>
                <Line
                    points={[positionULBot, positionLLBot]}
                    name={'Line UL-LL Bottom'}
                    lineWidth={lineWidth}
                    color={lineColor}/>

                {/* draw wireframe vertical lines */}
                <Line
                    points={[positionLLTop, positionLLBot]}
                    name={'Line LL-LL Vertical'}
                    lineWidth={lineWidth}
                    color={lineColor}/>
                <Line
                    points={[positionLRTop, positionLRBot]}
                    name={'Line LR-LR Vertical'}
                    lineWidth={lineWidth}
                    color={lineColor}/>
                <Line
                    points={[positionULTop, positionULBot]}
                    name={'Line UL-UL Vertical'}
                    lineWidth={lineWidth}
                    color={lineColor}/>
                <Line
                    points={[positionURTop, positionURBot]}
                    name={'Line UR-UR Vertical'}
                    lineWidth={lineWidth}
                    color={lineColor}/>
            </>
            }

            {/* draw handles */}
            {selected &&
            <>
                {/* resize handles */}
                <Box ref={resizeHandleLLTopRef}
                     name={ResizeHandleType.LowerLeftTop}
                     args={[RESIZE_HANDLE_SIZE, RESIZE_HANDLE_SIZE, RESIZE_HANDLE_SIZE]}
                     position={positionLLTop}
                     onPointerDown={(e) => {
                         selectMe(e, ActionType.Resize);
                     }}
                     onPointerOver={(e) => {
                         hoverHandle(e, ResizeHandleType.LowerLeftTop);
                     }}
                     onPointerOut={(e) => {
                         noHoverHandle();
                     }}
                >
                    <meshStandardMaterial
                        attach="material"
                        color={
                            hoveredHandle === ResizeHandleType.LowerLeftTop ||
                            resizeHandleType === ResizeHandleType.LowerLeftTop ? HIGHLIGHT_HANDLE_COLOR : RESIZE_HANDLE_COLOR
                        }
                    />
                </Box>
                <Box ref={resizeHandleULTopRef}
                     name={ResizeHandleType.UpperLeftTop}
                     args={[RESIZE_HANDLE_SIZE, RESIZE_HANDLE_SIZE, RESIZE_HANDLE_SIZE]}
                     position={positionULTop}
                     onPointerDown={(e) => {
                         selectMe(e, ActionType.Resize);
                     }}
                     onPointerOver={(e) => {
                         hoverHandle(e, ResizeHandleType.UpperLeftTop);
                     }}
                     onPointerOut={(e) => {
                         noHoverHandle();
                     }}
                >
                    <meshStandardMaterial
                        attach="material"
                        color={
                            hoveredHandle === ResizeHandleType.UpperLeftTop ||
                            resizeHandleType === ResizeHandleType.UpperLeftTop ? HIGHLIGHT_HANDLE_COLOR : RESIZE_HANDLE_COLOR
                        }
                    />
                </Box>
                <Box ref={resizeHandleLRTopRef}
                     name={ResizeHandleType.LowerRightTop}
                     args={[RESIZE_HANDLE_SIZE, RESIZE_HANDLE_SIZE, RESIZE_HANDLE_SIZE]}
                     position={positionLRTop}
                     onPointerDown={(e) => {
                         selectMe(e, ActionType.Resize);
                     }}
                     onPointerOver={(e) => {
                         hoverHandle(e, ResizeHandleType.LowerRightTop);
                     }}
                     onPointerOut={(e) => {
                         noHoverHandle();
                     }}
                >
                    <meshStandardMaterial
                        attach="material"
                        color={
                            hoveredHandle === ResizeHandleType.LowerRightTop ||
                            resizeHandleType === ResizeHandleType.LowerRightTop ? HIGHLIGHT_HANDLE_COLOR : RESIZE_HANDLE_COLOR
                        }
                    />
                </Box>
                <Box ref={resizeHandleURTopRef}
                     name={ResizeHandleType.UpperRightTop}
                     args={[RESIZE_HANDLE_SIZE, RESIZE_HANDLE_SIZE, RESIZE_HANDLE_SIZE]}
                     position={positionURTop}
                     onPointerDown={(e) => {
                         selectMe(e, ActionType.Resize);
                     }}
                     onPointerOver={(e) => {
                         hoverHandle(e, ResizeHandleType.UpperRightTop);
                     }}
                     onPointerOut={(e) => {
                         noHoverHandle();
                     }}
                >
                    <meshStandardMaterial
                        attach="material"
                        color={
                            hoveredHandle === ResizeHandleType.UpperRightTop ||
                            resizeHandleType === ResizeHandleType.UpperRightTop ? HIGHLIGHT_HANDLE_COLOR : RESIZE_HANDLE_COLOR
                        }
                    />
                </Box>
                <Box ref={resizeHandleLLBotRef}
                     name={ResizeHandleType.LowerLeft}
                     args={[RESIZE_HANDLE_SIZE, RESIZE_HANDLE_SIZE, RESIZE_HANDLE_SIZE]}
                     position={positionLLBot}
                     onPointerDown={(e) => {
                         selectMe(e, ActionType.Resize);
                         setCommonStore(state => {
                             Util.setVector2(state.resizeAnchor, cx + hx, cy + hy);
                         });
                     }}
                     onPointerOver={(e) => {
                         hoverHandle(e, ResizeHandleType.LowerLeft);
                     }}
                     onPointerOut={(e) => {
                         noHoverHandle();
                     }}
                >
                    <meshStandardMaterial
                        attach="material"
                        color={
                            hoveredHandle === ResizeHandleType.LowerLeft ||
                            resizeHandleType === ResizeHandleType.LowerLeft ? HIGHLIGHT_HANDLE_COLOR : RESIZE_HANDLE_COLOR
                        }
                    />
                </Box>
                <Box ref={resizeHandleULBotRef}
                     name={ResizeHandleType.UpperLeft}
                     args={[RESIZE_HANDLE_SIZE, RESIZE_HANDLE_SIZE, RESIZE_HANDLE_SIZE]}
                     position={positionULBot}
                     onPointerDown={(e) => {
                         selectMe(e, ActionType.Resize);
                         setCommonStore(state => {
                             Util.setVector2(state.resizeAnchor, cx + hx, cy - hy);
                         });
                     }}
                     onPointerOver={(e) => {
                         hoverHandle(e, ResizeHandleType.UpperLeft);
                     }}
                     onPointerOut={(e) => {
                         noHoverHandle();
                     }}
                >
                    <meshStandardMaterial
                        attach="material"
                        color={
                            hoveredHandle === ResizeHandleType.UpperLeft ||
                            resizeHandleType === ResizeHandleType.UpperLeft ? HIGHLIGHT_HANDLE_COLOR : RESIZE_HANDLE_COLOR
                        }
                    />
                </Box>
                <Box ref={resizeHandleLRBotRef}
                     name={ResizeHandleType.LowerRight}
                     args={[RESIZE_HANDLE_SIZE, RESIZE_HANDLE_SIZE, RESIZE_HANDLE_SIZE]}
                     position={positionLRBot}
                     onPointerDown={(e) => {
                         selectMe(e, ActionType.Resize);
                         setCommonStore(state => {
                             Util.setVector2(state.resizeAnchor, cx - hx, cy + hy);
                         });
                     }}
                     onPointerOver={(e) => {
                         hoverHandle(e, ResizeHandleType.LowerRight);
                     }}
                     onPointerOut={(e) => {
                         noHoverHandle();
                     }}
                >
                    <meshStandardMaterial
                        attach="material"
                        color={
                            hoveredHandle === ResizeHandleType.LowerRight ||
                            resizeHandleType === ResizeHandleType.LowerRight ? HIGHLIGHT_HANDLE_COLOR : RESIZE_HANDLE_COLOR
                        }
                    />
                </Box>
                <Box ref={resizeHandleURBotRef}
                     name={ResizeHandleType.UpperRight}
                     args={[RESIZE_HANDLE_SIZE, RESIZE_HANDLE_SIZE, RESIZE_HANDLE_SIZE]}
                     position={positionURBot}
                     onPointerDown={(e) => {
                         selectMe(e, ActionType.Resize);
                         setCommonStore(state => {
                             Util.setVector2(state.resizeAnchor, cx - hx, cy - hy);
                         });
                     }}
                     onPointerOver={(e) => {
                         hoverHandle(e, ResizeHandleType.UpperRight);
                     }}
                     onPointerOut={(e) => {
                         noHoverHandle();
                     }}
                >
                    <meshStandardMaterial
                        attach="material"
                        color={
                            hoveredHandle === ResizeHandleType.UpperRight ||
                            resizeHandleType === ResizeHandleType.UpperRight ? HIGHLIGHT_HANDLE_COLOR : RESIZE_HANDLE_COLOR
                        }
                    />
                </Box>

                {/* move handles */}
                <Sphere ref={moveHandleLowerFaceRef}
                        args={[MOVE_HANDLE_RADIUS, 6, 6]}
                        name={MoveHandleType.Lower}
                        position={positionLowerFace}
                        onPointerDown={(e) => {
                            selectMe(e, ActionType.Move);
                        }}
                        onPointerOver={(e) => {
                            hoverHandle(e, MoveHandleType.Lower);
                        }}
                        onPointerOut={(e) => {
                            noHoverHandle();
                        }}
                >
                    <meshStandardMaterial
                        attach="material"
                        color={
                            hoveredHandle === MoveHandleType.Lower ||
                            moveHandleType === MoveHandleType.Lower ? HIGHLIGHT_HANDLE_COLOR : MOVE_HANDLE_COLOR
                        }
                    />
                </Sphere>
                <Sphere ref={moveHandleUpperFaceRef}
                        args={[MOVE_HANDLE_RADIUS, 6, 6]}
                        name={MoveHandleType.Upper}
                        position={positionUpperFace}
                        onPointerDown={(e) => {
                            selectMe(e, ActionType.Move);
                        }}
                        onPointerOver={(e) => {
                            hoverHandle(e, MoveHandleType.Upper);
                        }}
                        onPointerOut={(e) => {
                            noHoverHandle();
                        }}
                >
                    <meshStandardMaterial
                        attach="material"
                        color={
                            hoveredHandle === MoveHandleType.Upper ||
                            moveHandleType === MoveHandleType.Upper ? HIGHLIGHT_HANDLE_COLOR : MOVE_HANDLE_COLOR
                        }
                    />
                </Sphere>
                <Sphere ref={moveHandleLeftFaceRef}
                        args={[MOVE_HANDLE_RADIUS, 6, 6]}
                        name={MoveHandleType.Left}
                        position={positionLeftFace}
                        onPointerDown={(e) => {
                            selectMe(e, ActionType.Move);
                        }}
                        onPointerOver={(e) => {
                            hoverHandle(e, MoveHandleType.Left);
                        }}
                        onPointerOut={(e) => {
                            noHoverHandle();
                        }}
                >
                    <meshStandardMaterial
                        attach="material"
                        color={
                            hoveredHandle === MoveHandleType.Left ||
                            moveHandleType === MoveHandleType.Left ? HIGHLIGHT_HANDLE_COLOR : MOVE_HANDLE_COLOR
                        }
                    />
                </Sphere>
                <Sphere ref={moveHandleRightFaceRef}
                        args={[MOVE_HANDLE_RADIUS, 6, 6]}
                        name={MoveHandleType.Right}
                        position={positionRightFace}
                        onPointerDown={(e) => {
                            selectMe(e, ActionType.Move);
                        }}
                        onPointerOver={(e) => {
                            hoverHandle(e, MoveHandleType.Right);
                        }}
                        onPointerOut={(e) => {
                            noHoverHandle();
                        }}
                >
                    <meshStandardMaterial
                        attach="material"
                        color={
                            hoveredHandle === MoveHandleType.Right ||
                            moveHandleType === MoveHandleType.Right ? HIGHLIGHT_HANDLE_COLOR : MOVE_HANDLE_COLOR
                        }
                    />
                </Sphere>
                <Sphere ref={moveHandleTopFaceRef}
                        args={[MOVE_HANDLE_RADIUS, 6, 6]}
                        name={MoveHandleType.Top}
                        position={positionTopFace}
                        onPointerDown={(e) => {
                            selectMe(e, ActionType.Move);
                        }}
                        onPointerOver={(e) => {
                            hoverHandle(e, MoveHandleType.Top);
                        }}
                        onPointerOut={(e) => {
                            noHoverHandle();
                        }}
                >
                    <meshStandardMaterial
                        attach="material"
                        color={
                            hoveredHandle === MoveHandleType.Top ||
                            moveHandleType === MoveHandleType.Top ? HIGHLIGHT_HANDLE_COLOR : MOVE_HANDLE_COLOR
                        }
                    />
                </Sphere>
            </>
            }

            {hovered && !selected &&
            <textSprite
                name={'Label'}
                text={'Box'}
                fontSize={90}
                fontFace={'Times Roman'}
                textHeight={1}
                scale={[0.4, 0.2, 0.2]}
                position={[0, lz + 0.2, 0]}
            />
            }

        </group>
    )
};

export default Cuboid;
