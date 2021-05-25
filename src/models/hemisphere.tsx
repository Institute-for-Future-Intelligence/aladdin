/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, {useRef} from "react";
import * as THREE from "three";
import DaySkyImage from "../resources/daysky.jpg";
import NightSkyImage from "../resources/nightsky.jpg";

export interface HemisphereProps {
    type?: string,

    [key: string]: any;
}

const Hemisphere = ({
                        type = 'day sky',
                        ...props
                    }: HemisphereProps) => {
    const mesh = useRef<THREE.Mesh>(null!);
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
            ref={mesh}
            scale={1}
        >
            <sphereGeometry args={[1000, 16, 16, 0, 2 * Math.PI, 0, Math.PI / 2 + 0.01]}/>
            <meshBasicMaterial map={texture}
                               side={THREE.DoubleSide}
                               opacity={1}
                               color={'skyblue'}/>
        </mesh>
    )
};

export default Hemisphere;
