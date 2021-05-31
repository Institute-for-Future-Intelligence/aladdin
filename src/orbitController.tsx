/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, {useRef} from "react";
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls';
import {extend, Object3DNode, useThree} from "@react-three/fiber";
import {useStore} from "./stores/common";

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

    const set = useStore(state => state.set);
    const {camera, gl: {domElement}} = useThree();

    const onCameraPositionChange = () => {
        set((state) => {
            const w = state.worlds['default'];
            if (w) {
                // FIXME: why can't set function be used?
                w.cameraPosition.x = camera.position.x;
                w.cameraPosition.y = camera.position.y;
                w.cameraPosition.z = camera.position.z;
            }
        });
    };

    // Ref to the controls, so that we can update them on every frame using useFrame
    const controls = useRef<OrbitControls>(null);
    if (controls.current) {
        controls.current.target.set(0, 0, 0);
        controls.current.addEventListener('change', onCameraPositionChange);
    }

    // animation
    // useFrame((state) => {
    //     if (controls.current) {
    //         controls.current.update();
    //     }
    // });

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
