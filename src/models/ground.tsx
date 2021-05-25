/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, {useRef} from "react";
import * as THREE from "three";
import {Euler} from "three";

const Ground = (props: JSX.IntrinsicElements['mesh']) => {
    const mesh = useRef<THREE.Mesh>(null!);
    return (
        <mesh
            {...props}
            ref={mesh}
            scale={1}
            rotation={new Euler(Math.PI/2, 0, 0)}
        >
            <planeGeometry args={[10000, 10000]}/>
            <meshBasicMaterial side={THREE.DoubleSide}
                               opacity={1}
                               color={'forestgreen'}/>
        </mesh>
    )
};

export default Ground;
