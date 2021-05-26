/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, {Suspense, useRef, useState} from 'react';
import * as THREE from 'three';
import './App.css';
import {Canvas, useFrame} from '@react-three/fiber';
import OrbitController from "./orbitController";
import Hemisphere from "./models/hemisphere";
import Ground from "./models/ground";
import Axes from "./models/axes";
import Compass from "./models/compass";

const Box = (props: JSX.IntrinsicElements['mesh']) => {
    // This reference will give us direct access to the mesh
    const mesh = useRef<THREE.Mesh>(null!);
    // Set up state for the hovered and active state
    const [hovered, setHover] = useState(false);
    const [active, setActive] = useState(false);
    // Subscribe this component to the render-loop, rotate the mesh every frame
    useFrame((state, delta) => {
        if (mesh.current) {
            mesh.current.rotation.y += 0.01;
        }
    });
    // Return view, these are regular three.js elements expressed in JSX
    return (
        <mesh
            {...props}
            ref={mesh}
            scale={active ? 1.5 : 1}
            onClick={(event) => setActive(!active)}
            onPointerOver={(event) => setHover(true)}
            onPointerOut={(event) => setHover(false)}
        >
            <boxGeometry args={[5, 5, 5]}/>
            <meshPhongMaterial color={hovered ? 'red' : 'orange'}/>
        </mesh>
    )
};

const init = () => {
    //THREE.Object3D.DefaultUp.set(0, 0, 1);
};

const App = () => {
    init();
    return (
        <div className="App">
            <div style={{
                backgroundColor: 'lightblue',
                height: '60px',
                paddingTop: '10px',
                fontSize: '30px'
            }}>Aladdin
            </div>
            <Canvas style={{height: 'calc(100vh - 60px)', backgroundColor: 'black'}}>
                <Suspense fallback={null}>
                    <OrbitController/>
                    <ambientLight intensity={0.5}/>
                    <pointLight color="white" position={[1, 1, -1]}/>
                    <gridHelper args={[500, 100, 'gray', 'gray']}/>
                    <Box position={[10, 2.5, -20]}/>
                    <Ground/>
                    <Compass/>
                    <Axes/>
                    <Hemisphere/>
                </Suspense>
            </Canvas>
        </div>
    );
}

export default App;
