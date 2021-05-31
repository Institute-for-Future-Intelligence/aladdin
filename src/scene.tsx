/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React from 'react';
import Foundation from "./views/foundation";
import {Box} from "@react-three/drei";
import {World} from "./models/world";

const Scene: React.FC<{ world: World }> = ({world}) => {
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
            {Object.values(world.foundations).map(foundation => <Foundation {...foundation}/>)}
        </group>
    );
};

export default Scene;
