/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, {useRef, useState} from "react";
import {Box, Line, Sphere} from "@react-three/drei";
import {Vector3} from "three";
import {ModelProps} from "./modelProps";
import {useStore} from "../stores/common";

export interface FoundationProps extends ModelProps {
    lx: number; // length in x direction
    ly: number; // length in y direction
    height: number;
}

const Foundation = ({
                        id,
                        cx,
                        cy,
                        lx = 1,
                        ly = 1,
                        height = 0.1,
                        color = 'gray',
                        lineColor = 'black',
                        hoverColor = 'lightGray',
                        selected = false,
                    }: FoundationProps) => {

    const set = useStore(state => state.set);
    const [hovered, setHovered] = useState(false);
    const [active, setActive] = useState(selected);

    const baseRef = useRef();
    const handleLLRef = useRef();
    const handleULRef = useRef();
    const handleLRRef = useRef();
    const handleURRef = useRef();

    const positionLL = new Vector3(cx - lx / 2, height / 2, cy - ly / 2);
    const positionUL = new Vector3(cx - lx / 2, height / 2, cy + ly / 2);
    const positionLR = new Vector3(cx + lx / 2, height / 2, cy - ly / 2);
    const positionUR = new Vector3(cx + lx / 2, height / 2, cy + ly / 2);

    const yOffset = 0.002;

    return (

        <group>

            {/* draw rectangle */}
            <Box castShadow receiveShadow
                 ref={baseRef}
                 name={'Foundation'}
                 onClick={(e) => {
                     if (e.intersections.length > 0) {
                         setActive(e.intersections[0].object === baseRef.current);
                         set((state) => {
                             const w = state.worlds['default'];
                             if (w) {
                                 const f = w.foundations[id];
                                 if (f) {
                                     f.color = 'green';
                                 }
                             }
                         });
                     }
                 }}
                 onPointerOver={(e) => {
                     if (e.intersections.length > 0) {
                         setHovered(e.intersections[0].object === baseRef.current);
                     }
                 }}
                 onPointerOut={() => {
                     setHovered(false);
                 }}
                 args={[lx, height, ly]}
                 position={[cx, height / 2, cy]}>
                <meshStandardMaterial attach="material" color={hovered ? hoverColor : color}/>
            </Box>

            <>
                {/* draw wireframe lines upper face */}
                <Line points={[[positionLL.x, height, positionLL.z], [positionLR.x, height, positionLR.z]]}>
                    <lineBasicMaterial color={lineColor}/>
                </Line>
                <Line points={[[positionLR.x, height, positionLR.z], [positionUR.x, height, positionUR.z]]}>
                    <lineBasicMaterial color={lineColor}/>
                </Line>
                <Line points={[[positionUR.x, height, positionUR.z], [positionUL.x, height, positionUL.z]]}>
                    <lineBasicMaterial color={lineColor}/>
                </Line>
                <Line points={[[positionUL.x, height, positionUL.z], [positionLL.x, height, positionLL.z]]}>
                    <lineBasicMaterial color={lineColor}/>
                </Line>

                {/* draw wireframe lines lower face */}
                <Line points={[[positionLL.x, yOffset, positionLL.z], [positionLR.x, yOffset, positionLR.z]]}>
                    <lineBasicMaterial color={lineColor}/>
                </Line>
                <Line points={[[positionLR.x, yOffset, positionLR.z], [positionUR.x, yOffset, positionUR.z]]}>
                    <lineBasicMaterial color={lineColor}/>
                </Line>
                <Line points={[[positionUR.x, yOffset, positionUR.z], [positionUL.x, yOffset, positionUL.z]]}>
                    <lineBasicMaterial color={lineColor}/>
                </Line>
                <Line points={[[positionUL.x, yOffset, positionUL.z], [positionLL.x, yOffset, positionLL.z]]}>
                    <lineBasicMaterial color={lineColor}/>
                </Line>

                {/* draw wireframe vertical lines */}
                <Line points={[[positionLL.x, yOffset, positionLL.z], [positionLL.x, height, positionLL.z]]}>
                    <lineBasicMaterial color={lineColor}/>
                </Line>
                <Line points={[[positionLR.x, yOffset, positionLR.z], [positionLR.x, height, positionLR.z]]}>
                    <lineBasicMaterial color={lineColor}/>
                </Line>
                <Line points={[[positionUL.x, yOffset, positionUL.z], [positionUL.x, height, positionUL.z]]}>
                    <lineBasicMaterial color={lineColor}/>
                </Line>
                <Line points={[[positionUR.x, yOffset, positionUR.z], [positionUR.x, height, positionUR.z]]}>
                    <lineBasicMaterial color={lineColor}/>
                </Line>
            </>

            {/* draw handles */}
            {active &&
            <>
                <Sphere ref={handleLLRef}
                        args={[0.1, 6, 6]}
                        position={positionLL}>
                    <meshStandardMaterial attach="material" color={'white'}/>
                </Sphere>
                <Sphere ref={handleULRef}
                        args={[0.1, 6, 6]}
                        position={positionUL}>
                    <meshStandardMaterial attach="material" color={'white'}/>
                </Sphere>
                <Sphere ref={handleLRRef}
                        args={[0.1, 6, 6]}
                        position={positionLR}>
                    <meshStandardMaterial attach="material" color={'white'}/>
                </Sphere>
                <Sphere ref={handleURRef}
                        args={[0.1, 6, 6]}
                        position={positionUR}>
                    <meshStandardMaterial attach="material" color={'white'}/>
                </Sphere>
            </>
            }

        </group>
    )
};

export default Foundation;
