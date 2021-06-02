/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, {Suspense, useEffect, useState} from 'react';
import './App.css';
import {Canvas} from '@react-three/fiber';
import OrbitController from "./orbitController";
import Sky from "./views/sky";
import Axes from "./views/axes";
import Compass from "./views/compass";
import Scene from "./scene";
import Ground from "./views/ground";
import {useStore} from "./stores/common";
import {Euler, Vector3} from "three";
import Heliodon from "./views/heliodon";
import {Util} from "./util";
import {computeDeclinationAngle, computeHourAngle, computeSunLocation} from "./views/sunTools";
import MainPanel from "./mainPanel";

const App = () => {

    const setCommonStore = useStore(state => state.set);
    const worlds = useStore(state => state.worlds);
    const getWorld = useStore(state => state.getWorld);
    const createNewWorld = useStore(state => state.createNewWorld);
    const world = worlds['default']; // currently we have only one world, which is default

    const heliodon = useStore(state => state.heliodon);
    const latitude = useStore(state => state.latitude);

    const today = new Date(2021, 5, 22, 12);
    const radius = 5;
    const [hourAngle, setHourAngle] = useState<number>(computeHourAngle(today));
    const [declinationAngle, setDeclinationAngle] = useState<number>(computeDeclinationAngle(today));
    const [sunlightDirection, setSunlightDirection] = useState<Vector3>(new Vector3(0, 2, 2));

    useEffect(() => {
        const defaultWorld = getWorld('default');
        if (!defaultWorld) {
            createNewWorld();
        }
    });

    useEffect(() => {
        setHourAngle(computeHourAngle(today));
        setDeclinationAngle(computeDeclinationAngle(today));
        setSunlightDirection(computeSunLocation(radius, hourAngle, declinationAngle, Util.toRadians(latitude))
            .applyEuler(new Euler(-Math.PI / 2, 0, 0)));
    }, [latitude]);

    const cameraPosition = new Vector3(0, 0, 5);
    if (world) {
        cameraPosition.set(world.cameraPosition.x, world.cameraPosition.y, world.cameraPosition.z);
    }

    console.log('x')

    const toggleHeliodon = (on: boolean) => {
        setCommonStore(state => {
            state.heliodon = on;
        });
    };

    const changeLatitude = (latitude: number) => {
        setCommonStore(state => {
            state.latitude = latitude;
        });
    };

    return (
        <div className="App">
            <div style={{
                backgroundColor: 'lightblue',
                height: '72px',
                paddingTop: '10px',
                fontSize: '30px'
            }}>
                <img alt='Logo' src={'static/assets/aladdin-logo.png'} height='50px' style={{verticalAlign: 'middle'}}/>
                <span style={{paddingLeft: '20px', verticalAlign: 'middle'}}>Aladdin</span>
            </div>
            <MainPanel latitude={latitude}
                       date={new Date()}
                       heliodon={heliodon}
                       changeLatitude={changeLatitude}
                       toggleHeliodon={toggleHeliodon}/>
            <Canvas shadows={true}
                    camera={{
                        position: cameraPosition,
                        fov: 90
                    }}
                    style={{height: 'calc(100vh - 70px)', backgroundColor: 'black'}}>
                <Suspense fallback={null}>
                    <OrbitController/>
                    <ambientLight intensity={0.25}/>
                    <directionalLight
                        color='white'
                        position={[sunlightDirection.x, sunlightDirection.y, sunlightDirection.z]}
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
                    {heliodon &&
                    <Heliodon
                        hourAngle={hourAngle}
                        declinationAngle={declinationAngle}
                        radius={radius}
                        date={today}
                        latitude={Util.toRadians(latitude)}
                    />}
                    {world && <Scene world={world}/>}
                </Suspense>
            </Canvas>
        </div>
    );
};

export default App;
