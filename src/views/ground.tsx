/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, {useRef} from "react";
import {Plane, useTexture} from "@react-three/drei";
import {useStore} from "../stores/common";
import {DoubleSide} from "three";
import {getMapImage} from "../helpers";

const Ground = () => {

    const set = useStore(state => state.set);
    const latitude = useStore(state => state.latitude);
    const longitude = useStore(state => state.longitude);
    const mapZoom = useStore(state => state.mapZoom);
    const groundColor = useStore(state => state.groundColor);
    const planeRef = useRef();

    const selectNone = () => {
        set((state) => {
            const w = state.worlds['default'];
            if (w) {
                for (const e of w.elements) {
                    e.selected = false;
                }
            }
        });
    };

    const texture = useTexture(getMapImage(640, latitude, longitude, mapZoom));

    return (
        <>
            <Plane receiveShadow
                   ref={planeRef}
                   name={'Ground'}
                   onClick={(e) => {
                       if (e.intersections.length > 0) {
                           const groundClicked = e.intersections[0].object === planeRef.current;
                           if (groundClicked) {
                               selectNone();
                           }
                       }
                   }}
                   rotation={[-Math.PI / 2, 0, 0]}
                   position={[0, -0.1, 0]}
                   args={[10000, 10000]}>
                <meshStandardMaterial side={DoubleSide} attach="material" color={groundColor}/>
            </Plane>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
                <planeBufferGeometry args={[100, 100]}/>
                <meshStandardMaterial attach="material" side={DoubleSide} map={texture} opacity={1}/>
            </mesh>
        </>
    )
};

export default Ground;
