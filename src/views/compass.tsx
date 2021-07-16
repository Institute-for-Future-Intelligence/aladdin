/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, {useMemo, useRef} from "react";
import {useFrame, useLoader, useThree} from '@react-three/fiber'
import {OBJLoader} from "three/examples/jsm/loaders/OBJLoader";
import {Euler, FontLoader, Mesh, MeshBasicMaterial, TextGeometryParameters, Vector3} from "three";
import compassObj from '../assets/compass.obj';
import helvetikerFont from '../fonts/helvetiker_regular.typeface.fnt';
import {Util} from "../Util";
import { useStore } from "../stores/common";

export interface CompassProps {
    scale?: number;

    [key: string]: any;
}

const Compass = ({
                     scale = 0.01,
                     ...props
                 }: CompassProps) => {
    const model = useLoader(OBJLoader, compassObj);
    const font = useLoader(FontLoader, helvetikerFont);
    const mesh = useRef<Mesh>(null!);
    const textGeometryParams = {font: font, height: 0.00, size: 0.005} as TextGeometryParameters;
    const textMaterial = new MeshBasicMaterial({color: 'white'});
    const compassMaterial = new MeshBasicMaterial({color: 'red'});

    useStore(state => state.cameraPosition);
    const {camera} = useThree();

    const cameraX = camera.position.x;
    const cameraY = camera.position.y;
    const cameraZ = camera.position.z;
    const PI = Math.PI;
    
    // FIXME: This is not the right way to fix the compass
    useFrame(() => {
        if(mesh.current) {
            const v = new Vector3(0.88, -0.8, 0.1).unproject(camera);
            mesh.current.position.set(v.x, v.y, v.z);
        }
    });

    const rotation = useMemo(() => {
        const tanX_Z = Math.atan2(cameraX, cameraZ);
        return new Euler(
            -PI / 3 - Math.atan2(cameraY, Math.sqrt(Math.pow(cameraZ, 2) + Math.pow(cameraX, 2))), 
             tanX_Z - PI / 9, 
            -tanX_Z, 
            'YXZ')
    }, [cameraX, cameraY, cameraZ]);

    return (
        <mesh
            {...props}
            ref={mesh}
            name={'Compass'}
            rotation={rotation}
        >
            <mesh position={[-0.0015, 0.02, 0]} material={textMaterial}>
                <textGeometry args={['N', textGeometryParams]}/>
            </mesh>
            <mesh rotation={[0, 0, PI]} position={[0.002, -0.02, 0]} material={textMaterial}>
                <textGeometry args={['S', textGeometryParams]}/>
            </mesh>
            <mesh rotation={[0, 0, Util.HALF_PI]} position={[-0.02, -0.0025, 0]} material={textMaterial}>
                <textGeometry args={['W', textGeometryParams]}/>
            </mesh>
            <mesh rotation={[0, 0, -Util.HALF_PI]} position={[0.02, 0.0015, 0]} material={textMaterial}>
                <textGeometry args={['E', textGeometryParams]}/>
            </mesh>
            <primitive object={model} scale={scale} material={compassMaterial}/>
        </mesh>
    );
};

export default React.memo(Compass);
