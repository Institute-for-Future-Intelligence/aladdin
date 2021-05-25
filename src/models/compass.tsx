/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, {useRef} from "react";
import {useLoader} from '@react-three/fiber'
import {OBJLoader} from "three/examples/jsm/loaders/OBJLoader";
import * as THREE from "three";
import {Euler} from "three";

export interface CompassProps {
    scale?: number;

    [key: string]: any;
}

const Compass = ({
                     scale = 0.1,
                     ...props
                 }: CompassProps) => {
    const model = useLoader(OBJLoader, 'static/assets/compass.obj')
    const mesh = useRef<THREE.Mesh>(null!);
    return (
        <mesh
            {...props}
            ref={mesh}
            rotation={new Euler(-Math.PI / 2, 0, 0)}
        >
            <primitive object={model} scale={scale}/>
        </mesh>
    )
};

export default Compass;
