/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, {useEffect} from 'react';
import Foundation from "./views/foundation";
import Sensor from "./views/sensor";
import Cuboid from "./views/cuboid";
import {WorldModel} from "./models/worldModel";
import {ObjectType} from "./types";
import {FoundationModel} from "./models/foundationModel";
import {SensorModel} from "./models/sensorModel";
import {CuboidModel} from "./models/cuboidModel";
import {Scene} from "three";
import {useThree} from "@react-three/fiber";

export interface SceneContentProps {
    world: WorldModel;
    sceneRef?: React.MutableRefObject<Scene | undefined>;
}

const SceneContent: React.FC<SceneContentProps> = ({world, sceneRef}: SceneContentProps) => {

    const {scene} = useThree();

    useEffect(() => {
        if (sceneRef) {
            sceneRef.current = scene;
        }
    });

    return (
        <group name={'Content'}>
            {world.elements
                .filter(e => e.type === ObjectType.Foundation)
                .map(e => <Foundation key={e.id} {...e as FoundationModel}/>)}
            {world.elements
                .filter(e => e.type === ObjectType.Sensor)
                .map(e => <Sensor key={e.id} {...e as SensorModel}/>)}
            {world.elements
                .filter(e => e.type === ObjectType.Cuboid)
                .map(e => <Cuboid key={e.id} {...e as CuboidModel}/>)}
        </group>
    );
};

export default SceneContent;
