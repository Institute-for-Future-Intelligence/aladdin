/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, {useRef} from "react";
import {Box, Sphere} from "@react-three/drei";

export interface FoundationProps {
    color?: string;
    lx: number; // length in x direction
    ly: number; // length in y direction
    height: number;
    cx: number; // x coordinate of the center
    cy: number; // y coordinate of the center

    [key: string]: any;
}

const Foundation = ({
                        color = 'gray',
                        lx = 1,
                        ly = 1,
                        height = 0.1,
                        cx,
                        cy
                    }: FoundationProps) => {

    const baseRef = useRef();
    const handleLLRef = useRef();
    const handleULRef = useRef();
    const handleLRRef = useRef();
    const handleURRef = useRef();

    return (
        <group>
            <Box castShadow receiveShadow
                 ref={baseRef}
                 args={[lx, height, ly]}
                 position={[cx, height / 2, cy]}>
                <meshStandardMaterial attach="material" color={color}/>
            </Box>
            <Sphere ref={handleLLRef}
                    args={[0.1, 6, 6]}
                    position={[cx - lx / 2, height / 2, cy - ly / 2]}>
                <meshStandardMaterial attach="material" color={'white'}/>
            </Sphere>
            <Sphere ref={handleULRef}
                    args={[0.1, 6, 6]}
                    position={[cx - lx / 2, height / 2, cy + ly / 2]}>
                <meshStandardMaterial attach="material" color={'white'}/>
            </Sphere>
            <Sphere ref={handleLRRef}
                    args={[0.1, 6, 6]}
                    position={[cx + lx / 2, height / 2, cy - ly / 2]}>
                <meshStandardMaterial attach="material" color={'white'}/>
            </Sphere>
            <Sphere ref={handleURRef}
                    args={[0.1, 6, 6]}
                    position={[cx + lx / 2, height / 2, cy + ly / 2]}>
                <meshStandardMaterial attach="material" color={'white'}/>
            </Sphere>
        </group>
    )
};

export default Foundation;
