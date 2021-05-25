/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, {useRef} from "react";
import * as THREE from "three";
import SkyImage from "../resources/daysky.jpg";

const Hemisphere = (props: JSX.IntrinsicElements['mesh']) => {
    const mesh = useRef<THREE.Mesh>(null!);
    const loader = new THREE.TextureLoader();
    const texture = loader.load(SkyImage);
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
