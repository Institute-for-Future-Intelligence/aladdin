/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React from "react";
import {Plane} from "@react-three/drei";

export interface GroundProps {
    color?: string;

    [key: string]: any;
}

const Ground = ({
                    color = 'forestgreen',
                    ...props
                }: GroundProps) => {
    return (
        <Plane receiveShadow
               rotation={[-Math.PI / 2, 0, 0]}
               position={[0, 0, 1]}
               args={[10000, 10000]}>
            <meshStandardMaterial attach="material" color={color}/>
        </Plane>
    )
};

export default Ground;
