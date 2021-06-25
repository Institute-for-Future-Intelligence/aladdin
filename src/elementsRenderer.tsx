/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React from 'react';
import Foundation from "./views/foundation";
import Sensor from "./views/sensor";
import Cuboid from "./views/cuboid";
import {ObjectType} from "./types";
import {FoundationModel} from "./models/foundationModel";
import {SensorModel} from "./models/sensorModel";
import {CuboidModel} from "./models/cuboidModel";
import {useStore} from "./stores/common";
import {HumanModel} from "./models/humanModel";
import Human from "./views/human";
import {TreeModel} from "./models/treeModel";
import Tree from "./views/tree";

const ElementsRenderer: React.FC = () => {

    const elements = useStore(state => state.elements);

    return (
        <group name={'Content'}>
            {elements
                .filter(e => e.type === ObjectType.Foundation)
                .map(e => <Foundation key={e.id} {...e as FoundationModel}/>)}
            {elements
                .filter(e => e.type === ObjectType.Sensor)
                .map(e => <Sensor key={e.id} {...e as SensorModel}/>)}
            {elements
                .filter(e => e.type === ObjectType.Cuboid)
                .map(e => <Cuboid key={e.id} {...e as CuboidModel}/>)}
            {elements
                .filter(e => e.type === ObjectType.Human)
                .map(e => <Human key={e.id} {...e as HumanModel}/>)}
            {elements
                .filter(e => e.type === ObjectType.Tree)
                .map(e => <Tree key={e.id} {...e as TreeModel}/>)}
        </group>
    );
};

export default ElementsRenderer;
