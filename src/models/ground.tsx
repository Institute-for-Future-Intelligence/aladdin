/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, {useRef} from "react";
import {Plane} from "@react-three/drei";
import * as THREE from "three";

export interface GroundProps {
    color?: string;

    [key: string]: any;
}

const Ground = ({
                    color = 'forestgreen',
                    ...props
                }: GroundProps) => {
    const planeRef = useRef();
    return (
        <Plane receiveShadow
               ref={planeRef}
               name={'Ground'}
               onClick={(e) => {
                   if (e.intersections.length > 0) {
                       const groundClicked = e.intersections[0].object === planeRef.current;
                       if (groundClicked) {
                           console.log('Ground clicked');
                       }
                   }
               }}
               rotation={[-Math.PI / 2, 0, 0]}
               position={[0, 0, 1]}
               args={[10000, 10000]}>
            <meshStandardMaterial side={THREE.DoubleSide}
                                  attach="material"
                                  color={color}/>
        </Plane>
    )
};

export default Ground;
