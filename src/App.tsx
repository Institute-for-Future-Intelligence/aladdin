/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, {useRef, useState} from 'react';
import * as THREE from 'three';
import './App.css';
import {Canvas, extend, Object3DNode, useFrame, useLoader, useThree} from '@react-three/fiber';
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls";

// Extend will make OrbitControls available as a JSX element called orbitControls for us to use.
extend({OrbitControls});

declare global {
    namespace JSX {
        interface IntrinsicElements {
            'orbitControls': Object3DNode<OrbitControls, typeof OrbitControls>;
        }
    }
}

const CameraControls = () => {
    // Get a reference to the Three.js Camera, and the canvas html element.
    // We need these to setup the OrbitControls class.
    // https://threejs.org/docs/#examples/en/controls/OrbitControls

    const {
        camera,
        gl: {domElement},
    } = useThree();

    // Ref to the controls, so that we can update them on every frame using useFrame
    const controls = useRef<OrbitControls>(null);
    useFrame((state) => {
        if (controls.current) {
            controls.current.update();
        }
    });

    return (
        <orbitControls
            ref={controls}
            args={[camera, domElement]}
            enableZoom={false}
            maxAzimuthAngle={Math.PI / 4}
            maxPolarAngle={Math.PI}
            minAzimuthAngle={-Math.PI / 4}
            minPolarAngle={0}
        />
    );
};

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
                <CameraControls/>
                <ambientLight intensity={0.6}/>
                <pointLight color="white" position={[1, 1, -1]}/>
                <gridHelper args={[100, 100, 'black', 'lightGray']}/>
                <Box position={[0, 2.5, -20]}/>
            </Canvas>
        </div>
    );
}

export default App;
