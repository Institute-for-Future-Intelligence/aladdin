/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, {useRef, useState} from 'react';
import * as THREE from 'three';
import './App.css';
import {Canvas, useFrame} from '@react-three/fiber';

const Box = (props: JSX.IntrinsicElements['mesh']) => {
    // This reference will give us direct access to the mesh
    const mesh = useRef<THREE.Mesh>(null!);
    // Set up state for the hovered and active state
    const [hovered, setHover] = useState(false);
    const [active, setActive] = useState(false);
    // Subscribe this component to the render-loop, rotate the mesh every frame
    useFrame((state, delta) => {
        if (mesh.current) {
            mesh.current.rotation.x += 0.01
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
            <meshStandardMaterial color={hovered ? 'red' : 'orange'}/>
        </mesh>
    )
};

const App = () => {
    return (
        <div className="App">
            <p>Aladdin</p>
            <Canvas>
                <ambientLight/>
                <pointLight position={[10, 10, 10]}/>
                <Box position={[-30, 0, -20]}/>
                <Box position={[-10, 0, -15]}/>
                <Box position={[10, 0, -15]}/>
                <Box position={[30, 0, -20]}/>
            </Canvas>
        </div>
    );
}

export default App;
