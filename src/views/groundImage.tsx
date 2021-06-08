/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React from "react";
import {useTexture} from "@react-three/drei";
import {useStore} from "../stores/common";
import {DoubleSide} from "three";
import {getMapImage} from "../helpers";

const GroundImage = () => {

    const latitude = useStore(state => state.latitude);
    const longitude = useStore(state => state.longitude);
    const mapZoom = useStore(state => state.mapZoom);

    const texture = useTexture(getMapImage(640, latitude, longitude, mapZoom));

    return (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
            <planeBufferGeometry args={[100, 100]}/>
            <meshStandardMaterial attach="material" side={DoubleSide} map={texture} opacity={1}/>
        </mesh>
    )
};

export default GroundImage;
