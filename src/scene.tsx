/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React from 'react';
import Foundation from "./views/foundation";
import {Box} from "@react-three/drei";
import {WorldModel} from "./models/worldModel";
import {FoundationModel} from "./models/foundationModel";

const Scene: React.FC<{ world: WorldModel }> = ({world}) => {
    return (
        <group>
            <Box castShadow receiveShadow
                 args={[1, 2, 1]}
                 position={[0, 1, 0]}>
                <meshStandardMaterial attach="material" color={'white'}/>
            </Box>
            {world.elements
                .filter(e => e.type === 'Foundation')
                .map(e => <Foundation key={e.id} {...e as FoundationModel}/>)}
        </group>
    );
};

export default Scene;
