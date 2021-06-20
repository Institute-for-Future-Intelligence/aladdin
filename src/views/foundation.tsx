/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, {useRef, useState} from "react";
import {Box, Line, Sphere} from "@react-three/drei";
import {Mesh, Vector3} from "three";
import {useStore} from "../stores/common";
import {FoundationModel} from "../models/foundationModel";
import {ThreeEvent} from "@react-three/fiber";
import {ActionType, MoveHandleType, ResizeHandleType} from "../types";
import {HANDLE_SIZE, MOVE_HANDLE_OFFSET} from "../constants";

const Foundation = ({
                        id,
                        cx,
                        cy,
                        lx = 1,
                        ly = 1,
                        lz = 0.1,
                        color = 'gray',
                        lineColor = 'black',
                        lineWidth = 0.2,
                        selected = false,
                    }: FoundationModel) => {

    cy = -cy; // we want positive y to point north

    const setCommonStore = useStore(state => state.set);
    const [hovered, setHovered] = useState(false);
    const baseRef = useRef<Mesh>();
    const resizeHandleLLRef = useRef<Mesh>();
    const resizeHandleULRef = useRef<Mesh>();
    const resizeHandleLRRef = useRef<Mesh>();
    const resizeHandleURRef = useRef<Mesh>();
    const moveHandleLowerRef = useRef<Mesh>();
    const moveHandleUpperRef = useRef<Mesh>();
    const moveHandleLeftRef = useRef<Mesh>();
    const moveHandleRightRef = useRef<Mesh>();

    const wireframe = true;

    const positionLL = new Vector3(cx - lx / 2, lz / 2, cy - ly / 2);
    const positionUL = new Vector3(cx - lx / 2, lz / 2, cy + ly / 2);
    const positionLR = new Vector3(cx + lx / 2, lz / 2, cy - ly / 2);
    const positionUR = new Vector3(cx + lx / 2, lz / 2, cy + ly / 2);

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

    return (

        <group name={'Foundation Group'}>

            {/* draw rectangle */}
            <Box castShadow receiveShadow
                 ref={baseRef}
                 name={'Foundation'}
                 position={[cx, lz / 2, cy]}
                 args={[lx, lz, ly]}
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
                 onPointerDown={(e) => {
                     selectMe(e, ActionType.Select);
                 }}
                 onPointerUp={(e) => {
                 }}
                 onPointerMove={(e) => {
                 }}
            >
                <meshStandardMaterial attach="material" color={color}/>
            </Box>

            {(wireframe && !selected) &&
            <>
                {/* draw wireframe lines upper face */}
                <Line points={[[positionLL.x, lz, positionLL.z], [positionLR.x, lz, positionLR.z]]}
                      name={'Line LL-LR Upper Face'}
                      lineWidth={lineWidth}
                      color={lineColor}/>
                <Line points={[[positionLR.x, lz, positionLR.z], [positionUR.x, lz, positionUR.z]]}
                      name={'Line LR-UR Upper Face'}
                      lineWidth={lineWidth}
                      color={lineColor}/>
                <Line points={[[positionUR.x, lz, positionUR.z], [positionUL.x, lz, positionUL.z]]}
                      name={'Line UR-UL Upper Face'}
                      lineWidth={lineWidth}
                      color={lineColor}/>
                <Line points={[[positionUL.x, lz, positionUL.z], [positionLL.x, lz, positionLL.z]]}
                      name={'Line UL-LL Upper Face'}
                      lineWidth={lineWidth}
                      color={lineColor}/>

                {/* draw wireframe lines lower face */}
                <Line points={[[positionLL.x, 0, positionLL.z], [positionLR.x, 0, positionLR.z]]}
                      name={'Line LL-LR Lower Face'}
                      lineWidth={lineWidth}
                      color={lineColor}/>
                <Line points={[[positionLR.x, 0, positionLR.z], [positionUR.x, 0, positionUR.z]]}
                      name={'Line LR-UR Lower Face'}
                      lineWidth={lineWidth}
                      color={lineColor}/>
                <Line points={[[positionUR.x, 0, positionUR.z], [positionUL.x, 0, positionUL.z]]}
                      name={'Line UR-UL Lower Face'}
                      lineWidth={lineWidth}
                      color={lineColor}/>
                <Line points={[[positionUL.x, 0, positionUL.z], [positionLL.x, 0, positionLL.z]]}
                      name={'Line UL-LL Lower Face'}
                      lineWidth={lineWidth}
                      color={lineColor}/>

                {/* draw wireframe vertical lines */}
                <Line points={[[positionLL.x, 0, positionLL.z], [positionLL.x, lz, positionLL.z]]}
                      name={'Line LL-LL Vertical'}
                      lineWidth={lineWidth}
                      color={lineColor}/>
                <Line points={[[positionLR.x, 0, positionLR.z], [positionLR.x, lz, positionLR.z]]}
                      name={'Line LR-LR Vertical'}
                      lineWidth={lineWidth}
                      color={lineColor}/>
                <Line points={[[positionUL.x, 0, positionUL.z], [positionUL.x, lz, positionUL.z]]}
                      name={'Line UL-UL Vertical'}
                      lineWidth={lineWidth}
                      color={lineColor}/>
                <Line points={[[positionUR.x, 0, positionUR.z], [positionUR.x, lz, positionUR.z]]}
                      name={'Line UR-UR Vertical'}
                      lineWidth={lineWidth}
                      color={lineColor}/>
            </>
            }

            {/* draw handles */}
            {selected &&
            <>
                {/* resize handles */}
                <Box ref={resizeHandleLLRef}
                     position={positionLL}
                     args={[HANDLE_SIZE, lz * 1.2, HANDLE_SIZE]}
                     name={ResizeHandleType.LowerLeft}
                     onPointerDown={(e) => {
                         selectMe(e, ActionType.Resize);
                     }}
                >
                    <meshStandardMaterial attach="material" color={'white'}/>
                </Box>
                <Box ref={resizeHandleULRef}
                     position={positionUL}
                     args={[HANDLE_SIZE, lz * 1.2, HANDLE_SIZE]}
                     name={ResizeHandleType.UpperLeft}
                     onPointerDown={(e) => {
                         selectMe(e, ActionType.Resize);
                     }}
                >
                    <meshStandardMaterial attach="material" color={'white'}/>
                </Box>
                <Box ref={resizeHandleLRRef}
                     position={positionLR}
                     args={[HANDLE_SIZE, lz * 1.2, HANDLE_SIZE]}
                     name={ResizeHandleType.LowerRight}
                     onPointerDown={(e) => {
                         selectMe(e, ActionType.Resize);
                     }}
                >
                    <meshStandardMaterial attach="material" color={'white'}/>
                </Box>
                <Box ref={resizeHandleURRef}
                     position={positionUR}
                     args={[HANDLE_SIZE, lz * 1.2, HANDLE_SIZE]}
                     name={ResizeHandleType.UpperRight}
                     onPointerDown={(e) => {
                         selectMe(e, ActionType.Resize);
                     }}
                >
                    <meshStandardMaterial attach="material" color={'white'}/>
                </Box>

                {/* move handles */}
                <Sphere ref={moveHandleLowerRef}
                        args={[0.1, 6, 6]}
                        position={[cx, lz / 2, cy - ly / 2 - MOVE_HANDLE_OFFSET]}
                        name={MoveHandleType.Lower}
                        onPointerDown={(e) => {
                            selectMe(e, ActionType.Move);
                        }}
                >
                    <meshStandardMaterial attach="material" color={'orange'}/>
                </Sphere>
                <Sphere ref={moveHandleUpperRef}
                        args={[0.1, 6, 6]}
                        position={[cx, lz / 2, cy + ly / 2 + MOVE_HANDLE_OFFSET]}
                        name={MoveHandleType.Upper}
                        onPointerDown={(e) => {
                            selectMe(e, ActionType.Move);
                        }}
                >
                    <meshStandardMaterial attach="material" color={'orange'}/>
                </Sphere>
                <Sphere ref={moveHandleLeftRef}
                        args={[0.1, 6, 6]}
                        position={[cx - lx / 2 - MOVE_HANDLE_OFFSET, lz / 2, cy]}
                        name={MoveHandleType.Left}
                        onPointerDown={(e) => {
                            selectMe(e, ActionType.Move);
                        }}
                >
                    <meshStandardMaterial attach="material" color={'orange'}/>
                </Sphere>
                <Sphere ref={moveHandleRightRef}
                        args={[0.1, 6, 6]}
                        position={[cx + lx / 2 + MOVE_HANDLE_OFFSET, lz / 2, cy]}
                        name={MoveHandleType.Right}
                        onPointerDown={(e) => {
                            selectMe(e, ActionType.Move);
                        }}
                >
                    <meshStandardMaterial attach="material" color={'orange'}/>
                </Sphere>
            </>
            }

            {(hovered && !selected) &&
            <textSprite
                name={'Label'}
                text={'Foundation'}
                fontSize={90}
                fontFace={'Times Roman'}
                textHeight={1}
                position={[cx, lz + 0.2, cy]}
                scale={[1, 0.2, 0.2]}/>
            }

        </group>
    )
};

export default Foundation;
