/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, {useRef, useState} from "react";
import {Box, Line, Sphere} from "@react-three/drei";
import {Mesh, Vector3} from "three";
import {useStore} from "../stores/common";
import {CuboidModel} from "../models/cuboidModel";
import {Util} from "../util";

const Cuboid = ({
                    id,
                    cx,
                    cy,
                    lx = 1,
                    ly = 1,
                    height = 1,
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

    const positionLLTop = new Vector3(cx - lx / 2, height, cy - ly / 2);
    const positionULTop = new Vector3(cx - lx / 2, height, cy + ly / 2);
    const positionLRTop = new Vector3(cx + lx / 2, height, cy - ly / 2);
    const positionURTop = new Vector3(cx + lx / 2, height, cy + ly / 2);

    const positionLLBot = new Vector3(cx - lx / 2, 0, cy - ly / 2);
    const positionULBot = new Vector3(cx - lx / 2, 0, cy + ly / 2);
    const positionLRBot = new Vector3(cx + lx / 2, 0, cy - ly / 2);
    const positionURBot = new Vector3(cx + lx / 2, 0, cy + ly / 2);

    const moveHandleLowerFaceRef = useRef<Mesh>();
    const moveHandleUpperFaceRef = useRef<Mesh>();
    const moveHandleLeftFaceRef = useRef<Mesh>();
    const moveHandleRightFaceRef = useRef<Mesh>();
    const moveHandleTopFaceRef = useRef<Mesh>();

    const offset = 0.1;
    const positionLowerFace = new Vector3(cx, height / 2, cy - ly / 2 - offset);
    const positionUpperFace = new Vector3(cx, height / 2, cy + ly / 2 + offset);
    const positionLeftFace = new Vector3(cx - lx / 2 - offset, height / 2, cy);
    const positionRightFace = new Vector3(cx + lx / 2 + offset, height / 2, cy);
    const positionTopFace = new Vector3(cx, height + offset, cy);

    const handleSize = 0.16;

    if (baseRef && baseRef.current) {
        Util.setVector(baseRef.current.position, cx, height / 2, cy);
    }

    const selectMe = () => {
        setCommonStore((state) => {
            for (const e of state.elements) {
                e.selected = e.id === id;
            }
        });
    };

    return (

        <group name={'Cuboid Group'}>

            {/* draw rectangular cuboid */}
            <Box castShadow receiveShadow
                 ref={baseRef}
                 args={[lx, height, ly]}
                 name={'Cuboid'}
                 onPointerDown={(e) => {
                     if (e.intersections.length > 0) {
                         const intersected = e.intersections[0].object === baseRef.current;
                         if (intersected) {
                             selectMe();
                         }
                     }
                 }}
                 onContextMenu={(e) => {
                     if (e.intersections.length > 0) {
                         const intersected = e.intersections[0].object === baseRef.current;
                         if (intersected) {
                             selectMe();
                         }
                     }
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
                     args={[handleSize, handleSize, handleSize]}
                     position={positionLLTop}>
                    <meshStandardMaterial attach="material" color={'white'}/>
                </Box>
                <Box ref={resizeHandleULTopRef}
                     name={'Resize Handle UL Top'}
                     args={[handleSize, handleSize, handleSize]}
                     position={positionULTop}>
                    <meshStandardMaterial attach="material" color={'white'}/>
                </Box>
                <Box ref={resizeHandleLRTopRef}
                     name={'Resize Handle LR Top'}
                     args={[handleSize, handleSize, handleSize]}
                     position={positionLRTop}>
                    <meshStandardMaterial attach="material" color={'white'}/>
                </Box>
                <Box ref={resizeHandleURTopRef}
                     name={'Resize Handle UR Top'}
                     args={[handleSize, handleSize, handleSize]}
                     position={positionURTop}>
                    <meshStandardMaterial attach="material" color={'white'}/>
                </Box>
                <Box ref={resizeHandleLLBotRef}
                     name={'Resize Handle LL Bottom'}
                     args={[handleSize, handleSize, handleSize]}
                     position={positionLLBot}>
                    <meshStandardMaterial attach="material" color={'white'}/>
                </Box>
                <Box ref={resizeHandleULBotRef}
                     name={'Resize Handle UL Bottom'}
                     args={[handleSize, handleSize, handleSize]}
                     position={positionULBot}>
                    <meshStandardMaterial attach="material" color={'white'}/>
                </Box>
                <Box ref={resizeHandleLRBotRef}
                     name={'Resize Handle LR Bottom'}
                     args={[handleSize, handleSize, handleSize]}
                     position={positionLRBot}>
                    <meshStandardMaterial attach="material" color={'white'}/>
                </Box>
                <Box ref={resizeHandleURBotRef}
                     name={'Resize Handle UR Bottom'}
                     args={[handleSize, handleSize, handleSize]}
                     position={positionURBot}>
                    <meshStandardMaterial attach="material" color={'white'}/>
                </Box>

                {/* move handles */}
                <Sphere ref={moveHandleLowerFaceRef}
                        args={[0.1, 6, 6]}
                        name={'Move Handle Lower Face'}
                        position={positionLowerFace}>
                    <meshStandardMaterial attach="material" color={'orange'}/>
                </Sphere>
                <Sphere ref={moveHandleUpperFaceRef}
                        args={[0.1, 6, 6]}
                        name={'Move Handle Upper Face'}
                        position={positionUpperFace}>
                    <meshStandardMaterial attach="material" color={'orange'}/>
                </Sphere>
                <Sphere ref={moveHandleLeftFaceRef}
                        args={[0.1, 6, 6]}
                        name={'Move Handle Left Face'}
                        position={positionLeftFace}>
                    <meshStandardMaterial attach="material" color={'orange'}/>
                </Sphere>
                <Sphere ref={moveHandleRightFaceRef}
                        args={[0.1, 6, 6]}
                        name={'Move Handle Right Face'}
                        position={positionRightFace}>
                    <meshStandardMaterial attach="material" color={'orange'}/>
                </Sphere>
                <Sphere ref={moveHandleTopFaceRef}
                        args={[0.1, 6, 6]}
                        name={'Move Handle Top Face'}
                        position={positionTopFace}>
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
                position={[cx, height + 0.2, cy]}
            />
            }

        </group>
    )
};

export default Cuboid;
