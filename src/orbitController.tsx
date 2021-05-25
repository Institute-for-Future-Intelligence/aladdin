/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, {useRef} from "react";
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls';
import {extend, Object3DNode, useFrame, useThree} from "@react-three/fiber";

// Extend will make OrbitControls available as a JSX element called orbitControls for us to use.
extend({OrbitControls});

declare global {
    namespace JSX {
        interface IntrinsicElements {
            'orbitControls': Object3DNode<OrbitControls, typeof OrbitControls>;
        }
    }
}

export interface OrbitControllerProps {
    [key: string]: any;
}

const OrbitController = () => {
    // Get a reference to the Three.js Camera, and the canvas html element.
    // We need these to setup the OrbitControls class.
    // https://threejs.org/docs/#examples/en/controls/OrbitControls

    const {
        camera,
        gl: {domElement},
    } = useThree();

    // Ref to the controls, so that we can update them on every frame using useFrame
    const controls = useRef<OrbitControls>(null);
    if (controls.current) {
        controls.current.target.set(0, 0, 0);
    }
    useFrame((state) => {
        if (controls.current) {
            controls.current.update();
        }
    });

    return (
        <orbitControls
            ref={controls}
            args={[camera, domElement]}
            enableZoom={true}
            maxAzimuthAngle={Math.PI}
            minAzimuthAngle={-Math.PI}
        />
    );

};

export default OrbitController;
