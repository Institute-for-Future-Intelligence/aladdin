/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, {useRef} from "react";
import {useLoader} from '@react-three/fiber'
import {OBJLoader} from "three/examples/jsm/loaders/OBJLoader";
import {Mesh} from "three";

import {MTLLoader} from "three/examples/jsm/loaders/MTLLoader";

export interface SampleProps {
    scale?: number;

    [key: string]: any;
}

const Sample = ({
                    scale = 0.5,
                    ...props
                }: SampleProps) => {

    const mesh = useRef<Mesh>(null!);

    const material = useLoader(MTLLoader, 'static/assets/house.mtl');
    const model = useLoader(OBJLoader, 'static/assets/house.obj', loader => {
        material.preload();
        // @ts-ignore
        loader.setMaterials(material);
    });

    if (model) {
        model.castShadow = true;
        model.receiveShadow = true;
        model.traverse((children) => {
            if (children instanceof Mesh) {
                children.castShadow = true;
                children.receiveShadow = true;
            }
        });
    }

    return (
        <mesh
            {...props}
            ref={mesh}
            position={[-3, 0, 3]}
        >
            <primitive object={model} scale={scale}/>
        </mesh>
    );
};

export default Sample;
