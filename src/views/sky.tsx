/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, {useMemo, useRef} from "react";
import DefaultDaySkyImage from "../resources/daysky.jpg";
import DefaultNightSkyImage from "../resources/nightsky.jpg";
import DesertDaySkyImage from "../resources/desert.jpg";
import DesertNightSkyImage from "../resources/desert-night.jpg";
import GrasslandDaySkyImage from "../resources/grassland.jpg";
import GrasslandNightSkyImage from "../resources/grassland-night.jpg";
import {DoubleSide, Mesh, TextureLoader} from "three";
import {useStore} from "../stores/common";
import {ObjectType} from "../types";
import {ThreeEvent} from "@react-three/fiber";

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
    const texture = useMemo(() => {
        const loader = new TextureLoader();
        let texture;
        switch (theme) {
            case 'Desert':
                texture = loader.load(night ? DesertNightSkyImage : DesertDaySkyImage);
                break;
            case 'Grassland':
                texture = loader.load(night ? GrasslandNightSkyImage : GrasslandDaySkyImage);
                break;
            default:
                texture = loader.load(night ? DefaultNightSkyImage : DefaultDaySkyImage);
        }
        return texture;
    }, [theme, night]);

    const clickSky = (e: ThreeEvent<MouseEvent>) => {
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
            scale={1}
            onContextMenu={(e) => {
                clickSky(e);
            }}
            onClick={(e) => {
                clickSky(e);
            }}
        >
            <sphereGeometry args={[1000, 16, 16, 0, 2 * Math.PI, 0, Math.PI / 2 + 0.01]}/>
            <meshBasicMaterial map={texture}
                               side={DoubleSide}
                               opacity={1}
                               color={'skyblue'}/>
        </mesh>
    )
};

export default Sky;
