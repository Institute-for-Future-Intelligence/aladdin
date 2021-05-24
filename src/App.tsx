/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, {useRef, useState} from 'react';
import * as THREE from 'three';
import './App.css';
import {Canvas, useFrame, useThree} from '@react-three/fiber';
import SkyImage from './resources/daysky.jpg';
import MyOrbitControls from "./orbitControls";

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

const SkyBox = () => {
    const {scene} = useThree();
    const loader = new THREE.TextureLoader();
    const texture = loader.load(SkyImage, (texture) => {
        // const rt = new THREE.WebGLCubeRenderTarget(texture.image.height);
        // rt.fromEquirectangularTexture(new THREE.WebGLRenderer(), texture);
        scene.background = texture;
    });
    return null;
};

const App = () => {
    return (
        <div className="App">
            <div style={{
                backgroundColor: 'lightblue',
                height: '60px',
                paddingTop: '10px',
                fontSize: '30px'
            }}>Aladdin
            </div>
            <Canvas style={{height: "calc(100vh - 60px)"}}>
                <MyOrbitControls/>
                <SkyBox/>
                <ambientLight intensity={0.6}/>
                <pointLight color="white" position={[1, 1, -1]}/>
                <gridHelper args={[100, 100, 'black', 'lightGray']}/>
                <Box position={[0, 2.5, -20]}/>
            </Canvas>
        </div>
    );
}

export default App;
