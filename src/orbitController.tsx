/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, {useEffect, useMemo, useRef} from "react";
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls';
import {useFrame, useThree} from "@react-three/fiber";
import {useStore} from "./stores/common";
import {Util} from "./Util";
import {Vector3} from "three";
import {WORKSPACE_SIZE} from "./constants";

export interface OrbitControllerProps {
    enabled?: boolean;
    autoRotate?: boolean;
    panCenter?: Vector3;
    orbitControlsRef?: React.MutableRefObject<OrbitControls | undefined>;
    canvasRef?: React.MutableRefObject<HTMLCanvasElement | undefined>;

    [key: string]: any;
}

// Get a reference to the Three.js Camera, and the canvas html element.
// We need these to setup the OrbitControls class.
// https://threejs.org/docs/#examples/en/controls/OrbitControls
const OrbitController = ({
                             enabled = true,
                             autoRotate = false,
                             panCenter = new Vector3(),
                             orbitControlsRef,
                             canvasRef,
                             ...rest
                         }: OrbitControllerProps) => {

    const setCommonStore = useStore(state => state.set);
    const setCameraPosition = useStore(state => state.setCameraPosition);
    const {camera, gl: {domElement}, gl, scene} = useThree();
    const setThree = useThree(state => state.set);
    // Ref to the controls, so that we can update them on every frame using useFrame
    const controls = useRef<OrbitControls>(null);
    const minPan = useMemo(() => new Vector3(-WORKSPACE_SIZE / 2, 0, -WORKSPACE_SIZE / 2), []);
    const maxPan = useMemo(() => new Vector3(WORKSPACE_SIZE / 2, WORKSPACE_SIZE / 8, WORKSPACE_SIZE / 2), []);

    useEffect(() => {
        setThree({frameloop: autoRotate ? 'always' : 'demand'});
    }, [autoRotate]);

    useEffect(() => {
        const c = controls.current;
        if (c) {
            c.addEventListener('change', render);
            if (panCenter) {
                c.target.set(panCenter.x, panCenter.y, panCenter.z);
            }
            c.addEventListener('end', onInteractionEnd);
            c.update();
            if (orbitControlsRef) {
                orbitControlsRef.current = c;
            }
            if (canvasRef) {
                canvasRef.current = domElement;
            }
        }
        return () => {
            if (c) {
                c.removeEventListener('end', onInteractionEnd);
                c.removeEventListener('change', render);
            }
        }
    }, []);

    const render = () => {
        if (controls.current) {
            controls.current.target.clamp(minPan, maxPan);
        }
        gl.render(scene, camera);
        setCameraPosition(new Vector3(camera.position.x, camera.position.y, camera.position.z));
    };

    const onInteractionEnd = () => {
        setCommonStore((state) => {
            // FIXME: why can't set function be used with a proxy?
            if (controls.current) {
                const w = state.world;
                w.cameraPosition.x = camera.position.x;
                w.cameraPosition.y = camera.position.y;
                w.cameraPosition.z = camera.position.z;
                w.panCenter.x = controls.current.target.x;
                w.panCenter.y = controls.current.target.y;
                w.panCenter.z = controls.current.target.z;
            }
        });
    };

    // animation
    useFrame((state) => {
        if (autoRotate) {
            if (controls.current) {
                controls.current.update();
            }
        }
    });

    // do not enable damping, it messes up with rotation state persistence
    return (
        <orbitControls
            ref={controls}
            args={[camera, domElement]}
            autoRotate={autoRotate}
            enabled={enabled}
            enableRotate={true}
            enablePan={true}
            enableZoom={true}
            enableDamping={false}
            target={panCenter}
            maxAzimuthAngle={Infinity}
            minAzimuthAngle={-Infinity}
            maxPolarAngle={Util.HALF_PI}
            minPolarAngle={0}
        />
    );

};

export default OrbitController;
