/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, {useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import {Box} from "@react-three/drei";

const Scene = () => {
    // @ts-ignore
    const boxRef = useRef<Box>(null!);
    useFrame(() => {
        if (boxRef.current) {
            boxRef.current.rotation.y += 0.004;
            boxRef.current.rotation.x += 0.004;
            boxRef.current.rotation.z += 0.004;
        }
    });
    // Set receiveShadow on any mesh that should be in shadow,
    // and castShadow on any mesh that should create a shadow.
    return (
        <group>
            <Box castShadow receiveShadow ref={boxRef} position={[-2, 1.5, 2]}>
                <meshStandardMaterial attach="material" color="white"/>
            </Box>
        </group>
    );
};

export default Scene;
