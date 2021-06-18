/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, {useRef, useState} from "react";
import {Box, Line, Sphere} from "@react-three/drei";
import {Vector3} from "three";
import {useStore} from "../stores/common";
import {FoundationModel} from "../models/foundationModel";

const Foundation = ({
                        id,
                        cx,
                        cy,
                        lx = 1,
                        ly = 1,
                        height = 0.1,
                        color = 'gray',
                        lineColor = 'black',
                        lineWidth = 0.1,
                        selected = false,
                    }: FoundationModel) => {

    cy = -cy; // we want positive y to point north

    const setCommonStore = useStore(state => state.set);
    const [hovered, setHovered] = useState(false);
    const baseRef = useRef();
    const resizeHandleLLRef = useRef();
    const resizeHandleULRef = useRef();
    const resizeHandleLRRef = useRef();
    const resizeHandleURRef = useRef();
    const handleSize = 0.16;

    const positionLL = new Vector3(cx - lx / 2, height / 2, cy - ly / 2);
    const positionUL = new Vector3(cx - lx / 2, height / 2, cy + ly / 2);
    const positionLR = new Vector3(cx + lx / 2, height / 2, cy - ly / 2);
    const positionUR = new Vector3(cx + lx / 2, height / 2, cy + ly / 2);

    const moveHandleLowerRef = useRef();
    const moveHandleUpperRef = useRef();
    const moveHandleLeftRef = useRef();
    const moveHandleRightRef = useRef();

    const offset = 0.2;
    const positionLower = new Vector3(cx, height / 2, cy - ly / 2 - offset);
    const positionUpper = new Vector3(cx, height / 2, cy + ly / 2 + offset);
    const positionLeft = new Vector3(cx - lx / 2 - offset, height / 2, cy);
    const positionRight = new Vector3(cx + lx / 2 + offset, height / 2, cy);

    const selectMe = () => {
        setCommonStore((state) => {
            const w = state.worlds['default'];
            if (w) {
                for (const e of w.elements) {
                    e.selected = e.id === id;
                }
            }
        });
    };

    return (

        <group name={'Foundation Group'}>

            {/* draw rectangle */}
            <Box castShadow receiveShadow
                 ref={baseRef}
                 name={'Foundation'}
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
                 onPointerDown={(e) => {
                     if (e.intersections.length > 0) {
                         const intersected = e.intersections[0].object === baseRef.current;
                         if (intersected) {
                             selectMe();
                         }
                     }
                 }}
                 onPointerUp={(e) => {
                 }}
                 onPointerMove={(e) => {
                 }}
                 args={[lx, height, ly]}
                 position={[cx, height / 2, cy]}>
                <meshStandardMaterial attach="material" color={color}/>
            </Box>

            <>
                {/* draw wireframe lines upper face */}
                <Line points={[[positionLL.x, height, positionLL.z], [positionLR.x, height, positionLR.z]]}
                      name={'Line LL-LR Upper Face'}
                      lineWidth={lineWidth}
                      color={lineColor}/>
                <Line points={[[positionLR.x, height, positionLR.z], [positionUR.x, height, positionUR.z]]}
                      name={'Line LR-UR Upper Face'}
                      lineWidth={lineWidth}
                      color={lineColor}/>
                <Line points={[[positionUR.x, height, positionUR.z], [positionUL.x, height, positionUL.z]]}
                      name={'Line UR-UL Upper Face'}
                      lineWidth={lineWidth}
                      color={lineColor}/>
                <Line points={[[positionUL.x, height, positionUL.z], [positionLL.x, height, positionLL.z]]}
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
                <Line points={[[positionLL.x, 0, positionLL.z], [positionLL.x, height, positionLL.z]]}
                      name={'Line LL-LL Vertical'}
                      lineWidth={lineWidth}
                      color={lineColor}/>
                <Line points={[[positionLR.x, 0, positionLR.z], [positionLR.x, height, positionLR.z]]}
                      name={'Line LR-LR Vertical'}
                      lineWidth={lineWidth}
                      color={lineColor}/>
                <Line points={[[positionUL.x, 0, positionUL.z], [positionUL.x, height, positionUL.z]]}
                      name={'Line UL-UL Vertical'}
                      lineWidth={lineWidth}
                      color={lineColor}/>
                <Line points={[[positionUR.x, 0, positionUR.z], [positionUR.x, height, positionUR.z]]}
                      name={'Line UR-UR Vertical'}
                      lineWidth={lineWidth}
                      color={lineColor}/>
            </>

            {/* draw handles */}
            {selected &&
            <>
                {/* resize handles */}
                <Box ref={resizeHandleLLRef}
                     args={[handleSize, height * 1.2, handleSize]}
                     name={'Resize Handle LL'}
                     position={positionLL}>
                    <meshStandardMaterial attach="material" color={'white'}/>
                </Box>
                <Box ref={resizeHandleULRef}
                     args={[handleSize, height * 1.2, handleSize]}
                     name={'Resize Handle UL'}
                     position={positionUL}>
                    <meshStandardMaterial attach="material" color={'white'}/>
                </Box>
                <Box ref={resizeHandleLRRef}
                     args={[handleSize, height * 1.2, handleSize]}
                     name={'Resize Handle LR'}
                     position={positionLR}>
                    <meshStandardMaterial attach="material" color={'white'}/>
                </Box>
                <Box ref={resizeHandleURRef}
                     args={[handleSize, height * 1.2, handleSize]}
                     name={'Resize Handle UR'}
                     position={positionUR}>
                    <meshStandardMaterial attach="material" color={'white'}/>
                </Box>

                {/* move handles */}
                <Sphere ref={moveHandleLowerRef}
                        args={[0.1, 6, 6]}
                        name={'Move Handle Lower'}
                        position={positionLower}>
                    <meshStandardMaterial attach="material" color={'orange'}/>
                </Sphere>
                <Sphere ref={moveHandleUpperRef}
                        args={[0.1, 6, 6]}
                        name={'Move Handle Upper'}
                        position={positionUpper}>
                    <meshStandardMaterial attach="material" color={'orange'}/>
                </Sphere>
                <Sphere ref={moveHandleLeftRef}
                        args={[0.1, 6, 6]}
                        name={'Move Handle Left'}
                        position={positionLeft}>
                    <meshStandardMaterial attach="material" color={'orange'}/>
                </Sphere>
                <Sphere ref={moveHandleRightRef}
                        args={[0.1, 6, 6]}
                        name={'Move Handle Right'}
                        position={positionRight}>
                    <meshStandardMaterial attach="material" color={'orange'}/>
                </Sphere>
            </>
            }

            {hovered &&
            <textSprite
                name={'Label'}
                text={'Foundation'}
                fontSize={90}
                fontFace={'Times Roman'}
                textHeight={1}
                scale={[1, 0.2, 0.2]}
                position={[cx, height + 0.2, cy]}
            />
            }

        </group>
    )
};

export default Foundation;
