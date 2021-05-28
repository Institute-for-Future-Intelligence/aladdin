/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React from 'react';
import Foundation from "./models/foundation";
import {Box} from "@react-three/drei";

const Scene = () => {
    return (
        <group onPointerMissed={(e) => {
            if (e.intersections) {
                e.intersections.forEach(x => {
                    console.log(x.object);
                });
            }
        }}
        >
            <Box castShadow receiveShadow
                 args={[1, 2, 1]}
                 position={[0, 1, 0]}>
                <meshStandardMaterial attach="material" color={'white'}/>
            </Box>
            <Foundation lx={2} ly={4} height={0.1} cx={0} cy={0}/>
            <Foundation lx={2} ly={2} height={0.5} cx={1} cy={2}/>
        </group>
    );
};

export default Scene;
