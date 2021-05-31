/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, {Suspense, useEffect} from 'react';
import './App.css';
import {Canvas} from '@react-three/fiber';
import OrbitController from "./orbitController";
import Sky from "./views/sky";
import Axes from "./views/axes";
import Compass from "./views/compass";
import Scene from "./scene";
import Ground from "./views/ground";
import {useStore} from "./stores/common";
import {Foundation} from "./models/foundation";

const App = () => {

    const worlds = useStore(state => state.worlds);
    const createNewWorld = useStore(state => state.createNewWorld);
    const world = worlds['default'];

    console.log('***', worlds)

    const init = () => {
        const foundations: { [key: string]: Foundation } = {};
        const foundation1 = {cx: 0, cy: 0, lx: 2, ly: 4, height: 0.1, id: 'f1'};
        const foundation2 = {cx: 1, cy: 2, lx: 2, ly: 2, height: 0.5, id: 'f2'};
        foundations[foundation1.id] = foundation1;
        foundations[foundation2.id] = foundation2;
        const world = {name: 'default', foundations: foundations};
        createNewWorld(world);
    }

    useEffect(() => {
        if (Object.values(worlds).length === 0) {
            //init();
        }
    }, []);

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
                    {world && <Scene world={world}/>}
                </Suspense>
            </Canvas>
        </div>
    );
};

export default App;
