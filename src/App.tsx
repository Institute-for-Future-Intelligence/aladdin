/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, {Suspense} from 'react';
import './App.css';
import {Canvas} from '@react-three/fiber';
import OrbitController from "./orbitController";
import Sky from "./models/sky";
import Axes from "./models/axes";
import Compass from "./models/compass";
import Scene from "./Scene";
import Ground from "./models/ground";

const App = () => {
    return (
        <div className="App">
            <div style={{
                backgroundColor: 'lightblue',
                height: '60px',
                paddingTop: '10px',
                fontSize: '30px'
            }}>
                <img alt='Logo' src={'static/assets/aladdin-logo.png'} height='50px' style={{verticalAlign: 'middle'}}/>
                <span style={{paddingLeft: '20px', verticalAlign: 'middle'}}>Aladdin</span>
            </div>
            <Canvas shadows={true}
                    camera={{position: [0, 2, 5], fov: 90}}
                    style={{height: 'calc(100vh - 70px)', backgroundColor: 'black'}}>
                <Suspense fallback={null}>
                    <OrbitController/>
                    <ambientLight intensity={0.25}/>
                    <directionalLight
                        color='white'
                        position={[2, 2, 0]}
                        intensity={0.5}
                        castShadow
                        shadow-mapSize-height={512}
                        shadow-mapSize-width={512}
                    />
                    <gridHelper args={[500, 100, 'gray', 'gray']}/>
                    <Compass/>
                    <Axes/>
                    <Ground/>
                    <Sky/>
                    <Scene/>
                </Suspense>
            </Canvas>
        </div>
    );
};

export default App;
