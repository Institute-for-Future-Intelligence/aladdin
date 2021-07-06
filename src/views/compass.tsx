/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, {useRef} from "react";
import {useFrame, useLoader, useThree} from '@react-three/fiber'
import {OBJLoader} from "three/examples/jsm/loaders/OBJLoader";
import {Euler, FontLoader, Mesh, MeshBasicMaterial, TextGeometryParameters, Vector3} from "three";
import compassObj from '../assets/compass.obj';
import helvetikerFont from '../fonts/helvetiker_regular.typeface.fnt';
import {Util} from "../Util";

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

    // FIXME: This is not the right way to fix the compass
    const {camera} = useThree();
    useFrame((state) => {
        if (mesh.current) {
            const v = new Vector3(0.88, -0.8, 0.1).unproject(camera);
            mesh.current.position.set(v.x, v.y, v.z);
        }
    });

    return (
        <mesh
            {...props}
            ref={mesh}
            name={'Compass'}
            rotation={new Euler(-Util.HALF_PI, 0, 0)}
        >
            <mesh position={[-0.001, 0.02, 0]} material={textMaterial}>
                <textGeometry args={['N', textGeometryParams]}/>
            </mesh>
            <mesh position={[-0.0015, -0.025, 0]} material={textMaterial}>
                <textGeometry args={['S', textGeometryParams]}/>
            </mesh>
            <mesh position={[-0.025, -0.002, 0]} material={textMaterial}>
                <textGeometry args={['W', textGeometryParams]}/>
            </mesh>
            <mesh position={[0.02, -0.002, 0]} material={textMaterial}>
                <textGeometry args={['E', textGeometryParams]}/>
            </mesh>
            <primitive object={model} scale={scale} material={compassMaterial}/>
        </mesh>
    );
};

export default React.memo(Compass);
