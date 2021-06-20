/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, {useRef, useState} from "react";
import {Box, Line, Sphere} from "@react-three/drei";
import {Mesh, Vector3} from "three";
import {useStore} from "../stores/common";
import {CuboidModel} from "../models/cuboidModel";
import {ThreeEvent} from "@react-three/fiber";
import {MoveHandleType} from "../types";
import {HANDLE_SIZE, MOVE_HANDLE_OFFSET} from "../constants";

const Cuboid = ({
                    id,
                    cx,
                    cy,
                    lx = 1,
                    ly = 1,
                    lz = 1,
                    color = 'silver',
                    lineColor = 'black',
                    lineWidth = 0.1,
                    selected = false,
                }: CuboidModel) => {

    cy = -cy; // we want positive y to point north

    const setCommonStore = useStore(state => state.set);
    const [hovered, setHovered] = useState(false);

    const baseRef = useRef<Mesh>();
    const resizeHandleLLTopRef = useRef<Mesh>();
    const resizeHandleULTopRef = useRef<Mesh>();
    const resizeHandleLRTopRef = useRef<Mesh>();
    const resizeHandleURTopRef = useRef<Mesh>();
    const resizeHandleLLBotRef = useRef<Mesh>();
    const resizeHandleULBotRef = useRef<Mesh>();
    const resizeHandleLRBotRef = useRef<Mesh>();
    const resizeHandleURBotRef = useRef<Mesh>();

    const positionLLTop = new Vector3(cx - lx / 2, lz, cy - ly / 2);
    const positionULTop = new Vector3(cx - lx / 2, lz, cy + ly / 2);
    const positionLRTop = new Vector3(cx + lx / 2, lz, cy - ly / 2);
    const positionURTop = new Vector3(cx + lx / 2, lz, cy + ly / 2);

    const positionLLBot = new Vector3(cx - lx / 2, 0, cy - ly / 2);
    const positionULBot = new Vector3(cx - lx / 2, 0, cy + ly / 2);
    const positionLRBot = new Vector3(cx + lx / 2, 0, cy - ly / 2);
    const positionURBot = new Vector3(cx + lx / 2, 0, cy + ly / 2);

    const moveHandleLowerFaceRef = useRef<Mesh>();
    const moveHandleUpperFaceRef = useRef<Mesh>();
    const moveHandleLeftFaceRef = useRef<Mesh>();
    const moveHandleRightFaceRef = useRef<Mesh>();
    const moveHandleTopFaceRef = useRef<Mesh>();

    const h = 0;
    const positionLowerFace = new Vector3(cx, h, cy - ly / 2 - MOVE_HANDLE_OFFSET);
    const positionUpperFace = new Vector3(cx, h, cy + ly / 2 + MOVE_HANDLE_OFFSET);
    const positionLeftFace = new Vector3(cx - lx / 2 - MOVE_HANDLE_OFFSET, h, cy);
    const positionRightFace = new Vector3(cx + lx / 2 + MOVE_HANDLE_OFFSET, h, cy);
    const positionTopFace = new Vector3(cx, lz + MOVE_HANDLE_OFFSET, cy);

    const selectMe = (e: ThreeEvent<MouseEvent>) => {
        if (e.intersections.length > 0) {
            const intersected = e.intersections[0].object === e.eventObject;
            if (intersected) {
                setCommonStore((state) => {
                    for (const e of state.elements) {
                        e.selected = e.id === id;
                    }
                    state.moveHandleType = e.eventObject.name as MoveHandleType;
                });
            }
        }
    };

    return (

        <group name={'Cuboid Group'}>

            {/* draw rectangular cuboid */}
            <Box castShadow receiveShadow
                 ref={baseRef}
                 args={[lx, lz, ly]}
                 position={[cx, lz / 2, cy]}
                 name={'Cuboid'}
                 onPointerDown={(e) => {
                     selectMe(e);
                 }}
                 onContextMenu={(e) => {
                     selectMe(e);
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
                     name={'Resize Handle LL Top'}
                     args={[HANDLE_SIZE, HANDLE_SIZE, HANDLE_SIZE]}
                     position={positionLLTop}
                     onPointerDown={(e) => {
                         selectMe(e);
                     }}
                >
                    <meshStandardMaterial attach="material" color={'white'}/>
                </Box>
                <Box ref={resizeHandleULTopRef}
                     name={'Resize Handle UL Top'}
                     args={[HANDLE_SIZE, HANDLE_SIZE, HANDLE_SIZE]}
                     position={positionULTop}
                     onPointerDown={(e) => {
                         selectMe(e);
                     }}
                >
                    <meshStandardMaterial attach="material" color={'white'}/>
                </Box>
                <Box ref={resizeHandleLRTopRef}
                     name={'Resize Handle LR Top'}
                     args={[HANDLE_SIZE, HANDLE_SIZE, HANDLE_SIZE]}
                     position={positionLRTop}
                     onPointerDown={(e) => {
                         selectMe(e);
                     }}
                >
                    <meshStandardMaterial attach="material" color={'white'}/>
                </Box>
                <Box ref={resizeHandleURTopRef}
                     name={'Resize Handle UR Top'}
                     args={[HANDLE_SIZE, HANDLE_SIZE, HANDLE_SIZE]}
                     position={positionURTop}
                     onPointerDown={(e) => {
                         selectMe(e);
                     }}
                >
                    <meshStandardMaterial attach="material" color={'white'}/>
                </Box>
                <Box ref={resizeHandleLLBotRef}
                     name={'Resize Handle LL Bottom'}
                     args={[HANDLE_SIZE, HANDLE_SIZE, HANDLE_SIZE]}
                     position={positionLLBot}
                     onPointerDown={(e) => {
                         selectMe(e);
                     }}
                >
                    <meshStandardMaterial attach="material" color={'white'}/>
                </Box>
                <Box ref={resizeHandleULBotRef}
                     name={'Resize Handle UL Bottom'}
                     args={[HANDLE_SIZE, HANDLE_SIZE, HANDLE_SIZE]}
                     position={positionULBot}
                     onPointerDown={(e) => {
                         selectMe(e);
                     }}
                >
                    <meshStandardMaterial attach="material" color={'white'}/>
                </Box>
                <Box ref={resizeHandleLRBotRef}
                     name={'Resize Handle LR Bottom'}
                     args={[HANDLE_SIZE, HANDLE_SIZE, HANDLE_SIZE]}
                     position={positionLRBot}
                     onPointerDown={(e) => {
                         selectMe(e);
                     }}
                >
                    <meshStandardMaterial attach="material" color={'white'}/>
                </Box>
                <Box ref={resizeHandleURBotRef}
                     name={'Resize Handle UR Bottom'}
                     args={[HANDLE_SIZE, HANDLE_SIZE, HANDLE_SIZE]}
                     position={positionURBot}
                     onPointerDown={(e) => {
                         selectMe(e);
                     }}
                >
                    <meshStandardMaterial attach="material" color={'white'}/>
                </Box>

                {/* move handles */}
                <Sphere ref={moveHandleLowerFaceRef}
                        args={[0.1, 6, 6]}
                        name={MoveHandleType.Lower}
                        position={positionLowerFace}
                        onPointerDown={(e) => {
                            selectMe(e);
                        }}
                >
                    <meshStandardMaterial attach="material" color={'orange'}/>
                </Sphere>
                <Sphere ref={moveHandleUpperFaceRef}
                        args={[0.1, 6, 6]}
                        name={MoveHandleType.Upper}
                        position={positionUpperFace}
                        onPointerDown={(e) => {
                            selectMe(e);
                        }}
                >
                    <meshStandardMaterial attach="material" color={'orange'}/>
                </Sphere>
                <Sphere ref={moveHandleLeftFaceRef}
                        args={[0.1, 6, 6]}
                        name={MoveHandleType.Left}
                        position={positionLeftFace}
                        onPointerDown={(e) => {
                            selectMe(e);
                        }}
                >
                    <meshStandardMaterial attach="material" color={'orange'}/>
                </Sphere>
                <Sphere ref={moveHandleRightFaceRef}
                        args={[0.1, 6, 6]}
                        name={MoveHandleType.Right}
                        position={positionRightFace}
                        onPointerDown={(e) => {
                            selectMe(e);
                        }}
                >
                    <meshStandardMaterial attach="material" color={'orange'}/>
                </Sphere>
                <Sphere ref={moveHandleTopFaceRef}
                        args={[0.1, 6, 6]}
                        name={MoveHandleType.Top}
                        position={positionTopFace}
                        onPointerDown={(e) => {
                            selectMe(e);
                        }}
                >
                    <meshStandardMaterial attach="material" color={'orange'}/>
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
                position={[cx, lz + 0.2, cy]}
            />
            }

        </group>
    )
};

export default Cuboid;
