/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, {useMemo, useRef} from "react";
import DefaultDaySkyImage from "../resources/daysky.jpg";
import DefaultNightSkyImage from "../resources/nightsky.jpg";
import DesertDaySkyImage from "../resources/desert.jpg";
import DesertNightSkyImage from "../resources/desert-night.jpg";
import ForestDaySkyImage from "../resources/forest.jpg";
import ForestNightSkyImage from "../resources/forest-night.jpg";
import GrasslandDaySkyImage from "../resources/grassland.jpg";
import GrasslandNightSkyImage from "../resources/grassland-night.jpg";
import {BackSide, Mesh} from "three";
import {useStore} from "../stores/common";
import {ObjectType} from "../types";
import {ThreeEvent} from "@react-three/fiber";
import {useTexture} from "@react-three/drei";

export interface SkyProps {
    theme?: string,
    night?: boolean,

    [key: string]: any;
}

const Sky = ({
                 theme = 'Default',
                 night = false,
                 ...props
             }: SkyProps) => {

    const setCommonStore = useStore(state => state.set);
    const selectNone = useStore(state => state.selectNone);
    const meshRef = useRef<Mesh>(null!);

    let scale = 1;
    switch (theme) {
        case 'Desert':
            scale = 0.5;
            break;
        case 'Forest':
            scale = 0.3;
            break;
        case 'Grassland':
            scale = 0.2;
            break;
        default:
            scale = 0.2;
    }

    const textureImg = useMemo(() => {
        switch (theme) {
            case 'Desert':
                return night ? DesertNightSkyImage : DesertDaySkyImage;
            case 'Forest':
                return night ? ForestNightSkyImage : ForestDaySkyImage;
            case 'Grassland':
                return night ? GrasslandNightSkyImage : GrasslandDaySkyImage;
            default:
                return night ? DefaultNightSkyImage : DefaultDaySkyImage;
        }
    }, [theme, night]);

    const texture = useTexture(textureImg);

    const clickSky = (e: ThreeEvent<MouseEvent>) => {
        // We must check if there is really a first intersection, onClick does not guarantee it
        // onClick listener for an object can still fire an event even when the object is behind another one
        if (e.intersections.length > 0) {
            const skyClicked = e.intersections[0].object === meshRef.current;
            if (skyClicked) {
                selectNone();
                setCommonStore((state) => {
                    state.clickObjectType = ObjectType.Sky;
                });
            }
        }
    };

    return (
        <mesh
            {...props}
            ref={meshRef}
            name={'Sky'}
            scale={[1, scale, 1]}
            onContextMenu={(e) => {
                clickSky(e);
            }}
            onClick={(e) => {
                if (e.button === 2) return; // ignore right-click
                clickSky(e);
            }}
        >
            <sphereGeometry args={[900, 16, 16, 0, 2 * Math.PI, 0, Math.PI / 2]}/>
            <meshBasicMaterial map={texture}
                               side={BackSide}
                               opacity={1}
                               color={'skyblue'}/>
        </mesh>
    )
};

export default React.memo(Sky);
