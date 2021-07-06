/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, {useEffect, useRef} from 'react';
import Foundation from "./views/foundation";
import Sensor from "./views/sensor";
import Cuboid from "./views/cuboid";
import {ObjectType} from "./types";
import {FoundationModel} from "./models/FoundationModel";
import {SensorModel} from "./models/SensorModel";
import {CuboidModel} from "./models/CuboidModel";
import {useStore} from "./stores/common";
import {HumanModel} from "./models/HumanModel";
import Human from "./views/human";
import {TreeModel} from "./models/TreeModel";
import Tree from "./views/tree";
import {Box3, Group} from "three";

export interface ElementsRendererProps {
}

const ElementsRenderer: React.FC<ElementsRendererProps> = ({}: ElementsRendererProps) => {

    const setCommonStore = useStore(state => state.set);
    const elements = useStore(state => state.elements);
    const groupRef = useRef<Group>();

    useEffect(() => {
        if (groupRef.current) {
            const aabb = new Box3().setFromObject(groupRef.current);
            setCommonStore(state => {
                state.aabb = aabb;
            });
        }
    }, [elements]);

    return (
        <group name={'Content'} ref={groupRef}>
            {elements
                .map(e => {
                        switch (e.type) {
                            case ObjectType.Foundation:
                                return <Foundation key={e.id} {...e as FoundationModel}/>
                            case ObjectType.Sensor:
                                return <Sensor key={e.id} {...e as SensorModel}/>
                            case ObjectType.Cuboid:
                                return <Cuboid key={e.id} {...e as CuboidModel}/>
                            case ObjectType.Human:
                                return <Human key={e.id} {...e as HumanModel}/>
                            case ObjectType.Tree:
                                return <Tree key={e.id} {...e as TreeModel}/>
                        }
                    }
                )
            }
        </group>
    );
};

export default ElementsRenderer;
