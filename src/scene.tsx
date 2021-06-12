/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React from 'react';
import Foundation from "./views/foundation";
import Sensor from "./views/sensor";
import Cuboid from "./views/cuboid";
import {WorldModel} from "./models/worldModel";
import {FoundationModel} from "./models/foundationModel";
import {SensorModel} from "./models/sensorModel";
import {CuboidModel} from "./models/cuboidModel";

const Scene: React.FC<{ world: WorldModel }> = ({world}) => {
    return (
        <group>
            {world.elements
                .filter(e => e.type === 'Foundation')
                .map(e => <Foundation key={e.id} {...e as FoundationModel}/>)}
            {world.elements
                .filter(e => e.type === 'Sensor')
                .map(e => <Sensor key={e.id} {...e as SensorModel}/>)}
            {world.elements
                .filter(e => e.type === 'Cuboid')
                .map(e => <Cuboid key={e.id} {...e as CuboidModel}/>)}
        </group>
    );
};

export default Scene;
