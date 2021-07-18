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
    orbitControlsRef?: React.MutableRefObject<OrbitControls | undefined>;
    canvasRef?: React.MutableRefObject<HTMLCanvasElement | undefined>;

    [key: string]: any;
}

// Get a reference to the Three.js Camera, and the canvas html element.
// We need these to setup the OrbitControls class.
// https://threejs.org/docs/#examples/en/controls/OrbitControls
const OrbitController = ({
                             orbitControlsRef,
                             canvasRef,
                             ...rest
                         }: OrbitControllerProps) => {

    const cameraPosition = useStore(state => state.world.cameraPosition);
    const panCenter = useStore(state => state.world.panCenter);
    const enableOrbitController = useStore(state => state.enableOrbitController);
    const autoRotate = useStore(state => state.viewState.autoRotate);
    const setCommonStore = useStore(state => state.set);
    const setCameraPosition = useStore(state => state.setCameraPosition);

    const {camera, gl: {domElement}, gl, scene} = useThree();
    const setThree = useThree(state => state.set);
    // Ref to the controls, so that we can update them on every frame using useFrame
    const controls = useRef<OrbitControls>(null);
    const minPan = useMemo(() => new Vector3(-WORKSPACE_SIZE / 2, 0, -WORKSPACE_SIZE / 2), []);
    const maxPan = useMemo(() => new Vector3(WORKSPACE_SIZE / 2, WORKSPACE_SIZE / 8, WORKSPACE_SIZE / 2), []);

    useEffect(() => {
        // we have to manually set the camera position when loading a state from a file (as world is reconstructed)
        if (controls.current) {
            controls.current.object.position.copy(cameraPosition);
            controls.current.update();
        }
    }, [cameraPosition]);

    useEffect(() => {
        // we have to manually set the target position when loading a state from a file (as world is reconstructed)
        if (controls.current) {
            controls.current.target.copy(panCenter);
            controls.current.update();
        }
    }, [panCenter]);

    useEffect(() => {
        setThree({frameloop: autoRotate ? 'always' : 'demand'});
    }, [autoRotate]);

    useEffect(() => {
        const c = controls.current;
        if (c) {
            c.addEventListener('change', render);
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
        setCameraPosition(camera.position);
    };

    const onInteractionEnd = () => {
        setCommonStore((state) => {
            // FIXME: why can't set function be used with a proxy?
            // Using set or copy will result in crash in run time.
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
            enabled={enableOrbitController}
            enableRotate={true}
            enablePan={true}
            enableZoom={true}
            enableDamping={false}
            target={new Vector3().copy(panCenter)}
            maxAzimuthAngle={Infinity}
            minAzimuthAngle={-Infinity}
            maxPolarAngle={Util.HALF_PI}
            minPolarAngle={0}
        />
    );

};

export default OrbitController;
