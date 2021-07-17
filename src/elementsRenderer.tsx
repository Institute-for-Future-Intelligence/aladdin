/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, {useEffect, useRef} from 'react';
import {useStore} from "./stores/common";
import {Box3, Group, Vector3} from "three";
import {ObjectType} from "./types";
import {FoundationModel} from "./models/FoundationModel";
import Foundation from "./views/foundation";
import {SensorModel} from "./models/SensorModel";
import Sensor from "./views/sensor";
import {CuboidModel} from "./models/CuboidModel";
import Cuboid from "./views/cuboid";
import {HumanModel} from "./models/HumanModel";
import Human from "./views/human";
import {TreeModel} from "./models/TreeModel";
import Tree from "./views/tree";
import {SolarPanelModel} from "./models/SolarPanelModel";
import SolarPanel from "./views/solarPanel";

export interface ElementsRendererProps {
}

const ElementsRenderer: React.FC<ElementsRendererProps> = ({}: ElementsRendererProps) => {

    const setCommonStore = useStore(state => state.set);
    const viewState = useStore(state => state.viewState);
    const elements = useStore(state => state.elements);
    const groupRef = useRef<Group>();

    useEffect(() => {
        if (groupRef.current) {
            const boxes = [];
            for (const group of groupRef.current.children) {
                const children = group.children.filter(x => x.userData['aabb']);
                for (const c of children) {
                    boxes.push(new Box3().setFromObject(c));
                }
            }
            if (boxes.length > 0) {
                const min = new Vector3();
                const max = new Vector3();
                for (const box of boxes) {
                    min.min(box.min);
                    max.max(box.max);
                }
                setCommonStore(state => {
                    state.aabb = new Box3(min, max);
                });
            }
        }
    }, [elements, viewState.heliodon]);

    return (
        <group name={'Content'} ref={groupRef}>
            {elements
                .map(e => {
                        switch (e.type) {
                            case ObjectType.Foundation:
                                return <Foundation key={e.id} {...e as FoundationModel}/>;
                            case ObjectType.Sensor:
                                return <Sensor key={e.id} {...e as SensorModel}/>;
                            case ObjectType.Cuboid:
                                return <Cuboid key={e.id} {...e as CuboidModel}/>;
                            case ObjectType.Human:
                                return <Human key={e.id} {...e as HumanModel}/>;
                            case ObjectType.Tree:
                                return <Tree key={e.id} {...e as TreeModel}/>;
                            case ObjectType.SolarPanel:
                                return <SolarPanel key={e.id} {...e as SolarPanelModel}/>;
                        }
                    }
                )
            }
        </group>
    );
};

export default ElementsRenderer;
