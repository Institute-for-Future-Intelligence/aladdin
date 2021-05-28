/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, {useRef} from "react";
import * as THREE from "three";
import DaySkyImage from "../resources/daysky.jpg";
import NightSkyImage from "../resources/nightsky.jpg";

export interface SkyProps {
    type?: string,

    [key: string]: any;
}

const Sky = ({
                 type = 'day sky',
                 ...props
             }: SkyProps) => {
    const meshRef = useRef<THREE.Mesh>(null!);
    const loader = new THREE.TextureLoader();
    let texture;
    switch (type) {
        case 'night sky':
            texture = loader.load(NightSkyImage);
            break;
        default:
            texture = loader.load(DaySkyImage);
    }
    return (
        <mesh
            {...props}
            ref={meshRef}
            name={'Sky'}
            scale={1}
            onClick={(e) => {
                if (e.intersections.length > 0) {
                    const skyClicked = e.intersections[0].object === meshRef.current;
                    if (skyClicked) {
                        console.log('Sky clicked');
                    }
                }
            }}
        >
            <sphereGeometry args={[1000, 16, 16, 0, 2 * Math.PI, 0, Math.PI / 2 + 0.01]}/>
            <meshBasicMaterial map={texture}
                               side={THREE.DoubleSide}
                               opacity={1}
                               color={'skyblue'}/>
        </mesh>
    )
};

export default Sky;
