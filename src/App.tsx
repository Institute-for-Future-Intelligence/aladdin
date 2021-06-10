/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 *
 * @author Charles Xie
 */

import React, {Suspense, useEffect, useMemo, useState} from 'react';
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
import Sample from "./views/sample";
import aladdinLogo from './assets/aladdin-logo.png';
import ifiLogo from './assets/ifi-logo.png';
import MainMenu from "./mainMenu";
import GroundSettingsPanel from "./groundSettingsPanel";
import HeliodonSettingsPanel from "./heliodonSettingsPanel";
import {VERSION} from "./constants";
import {visitIFI} from "./helpers";
import AcceptCookie from "./acceptCookie";
import GroundImage from "./views/groundImage";
import {Dropdown} from "antd";
import ContextMenu from "./contextMenu";
import GraphPanel from "./graphPanel";
import {GraphType} from "./types";


const App = () => {

    const setCommonStore = useStore(state => state.set);
    const worlds = useStore(state => state.worlds);
    const getWorld = useStore(state => state.getWorld);
    const createNewWorld = useStore(state => state.createNewWorld);
    const loadWeatherData = useStore(state => state.loadWeatherData);
    const getClosestCity = useStore(state => state.getClosestCity);

    const showGroundSettings = useStore(state => state.showGroundSettings);
    const showHeliodonSettings = useStore(state => state.showHeliodonSettings);

    const axes = useStore(state => state.axes);
    const grid = useStore(state => state.grid);
    const groundImage = useStore(state => state.groundImage);
    const groundColor = useStore(state => state.groundColor);
    const theme = useStore(state => state.theme);
    const heliodon = useStore(state => state.heliodon);
    const latitude = useStore(state => state.latitude);
    const longitude = useStore(state => state.longitude);
    const now = new Date(useStore(state => state.date));

    const [hourAngle, setHourAngle] = useState<number>(0);
    const [declinationAngle, setDeclinationAngle] = useState<number>(0);
    const [sunlightDirection, setSunlightDirection] = useState<Vector3>(new Vector3(0, 2, 2));
    const [animateSun, setAnimateSun] = useState<boolean>(false);
    const [city, setCity] = useState<string | null>('Boston MA, USA');

    const world = worlds['default']; // currently we have only one world, which is default
    const radius = 10;

    useEffect(() => {
        const defaultWorld = getWorld('default');
        if (!defaultWorld) {
            createNewWorld();
        }
        loadWeatherData();
    }, []);

    useEffect(() => {
        setSunlightDirection(computeSunLocation(radius, hourAngle, declinationAngle, Util.toRadians(latitude))
            .applyEuler(new Euler(-Math.PI / 2, 0, 0)));
        setCity(getClosestCity(latitude, longitude));
    }, [latitude, hourAngle, declinationAngle]);

    const nowString = now.toString();
    useMemo(() => {
        setHourAngle(computeHourAngle(now));
        setDeclinationAngle(computeDeclinationAngle(now));
    }, [nowString]);

    const cameraPosition = new Vector3(0, 0, 5);
    if (world) {
        cameraPosition.set(world.cameraPosition.x, world.cameraPosition.y, world.cameraPosition.z);
    }

    console.log('x')

    const setGrid = (on: boolean) => {
        setCommonStore(state => {
            state.grid = on;
        });
    };

    const setGroundImage = (on: boolean) => {
        setCommonStore(state => {
            state.groundImage = on;
        });
    };

    const setGroundColor = (color: string) => {
        setCommonStore(state => {
            state.groundColor = color;
        });
    };

    const setHeliodon = (on: boolean) => {
        setCommonStore(state => {
            state.heliodon = on;
        });
    };

    // animation state should not be persisted
    const setSunAnimation = (on: boolean) => {
        setAnimateSun(on);
    };

    const changeDate = (date: Date) => {
        const d = new Date(now);
        d.setFullYear(date.getFullYear());
        d.setMonth(date.getMonth());
        d.setDate(date.getDate());
        setCommonStore(state => {
            state.date = d.toString();
        });
    };

    const changeTime = (date: Date) => {
        const d = new Date(now);
        d.setHours(date.getHours(), date.getMinutes());
        setCommonStore(state => {
            state.date = d.toString();
        });
    };

    const changeLatitude = (latitude: number) => {
        setCommonStore(state => {
            state.latitude = latitude;
        });
    };

    const changeLatitudeAndRemoveAddress = (latitude: number) => {
        setCommonStore(state => {
            state.latitude = latitude;
            state.address = '';
        });
    };

    const changeLongitude = (longitude: number) => {
        setCommonStore(state => {
            state.longitude = longitude;
        });
    };

    const changeMapZoom = (zoom: number) => {
        setCommonStore(state => {
            state.mapZoom = zoom;
        });
    };

    const changeMapTilt = (tilt: number) => {
        setCommonStore(state => {
            state.mapTilt = tilt;
        });
    };

    const changeMapType = (type: string) => {
        setCommonStore(state => {
            state.mapType = type;
        });
    };

    const sunAboveHorizon = sunlightDirection.y > 0;

    return (
        <div className="App">
            <div style={{
                backgroundColor: 'lightblue',
                height: '72px',
                paddingTop: '10px',
                fontSize: '30px'
            }}>
                <img alt='Aladdin Logo' src={aladdinLogo} height='50px' style={{verticalAlign: 'middle'}}/>
                <span style={{paddingLeft: '20px', verticalAlign: 'middle'}}>Aladdin</span>
            </div>
            <div style={{
                position: 'absolute',
                bottom: '10px',
                left: '10px',
                zIndex: 999,
                fontSize: '12px',
                color: 'white'
            }}>
                <img alt='IFI Logo'
                     src={ifiLogo}
                     height='40px'
                     style={{verticalAlign: 'bottom', cursor: 'pointer'}}
                     title={'Go to Institute for Future Intelligence'}
                     onClick={visitIFI}/>
                &nbsp;&nbsp; Institute for Future Intelligence, &copy;{new Date().getFullYear()}. Version {VERSION}
            </div>
            <MainMenu/>
            {showGroundSettings &&
            <GroundSettingsPanel grid={grid}
                                 groundImage={groundImage}
                                 groundColor={groundColor}
                                 setGrid={setGrid}
                                 setGroundImage={setGroundImage}
                                 setGroundColor={setGroundColor}
                                 changeLatitude={changeLatitude}
                                 changeLongitude={changeLongitude}
                                 changeMapZoom={changeMapZoom}
                                 changeMapTilt={changeMapTilt}
                                 changeMapType={changeMapType}
            />}
            {showHeliodonSettings &&
            <HeliodonSettingsPanel latitude={latitude}
                                   date={now}
                                   heliodon={heliodon}
                                   animateSun={animateSun}
                                   changeDate={changeDate}
                                   changeTime={changeTime}
                                   changeLatitude={changeLatitudeAndRemoveAddress}
                                   setHeliodon={setHeliodon}
                                   setSunAnimation={setSunAnimation}
            />}
            <GraphPanel city={city} graphs={[GraphType.monthlyTemperatures]}/>
            <Dropdown key={'canvas-context-menu'} overlay={<ContextMenu/>} trigger={['contextMenu']}>
                <div>
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
                                intensity={sunAboveHorizon ? 0.5 : 0}
                                castShadow
                                shadow-mapSize-height={512}
                                shadow-mapSize-width={512}
                            />
                            {grid && <gridHelper args={[500, 100, 'gray', 'gray']}/>}
                            <Compass/>
                            {/*<Sample/>*/}
                            {axes && <Axes/>}
                            <Ground/>
                            {groundImage && <GroundImage/>}
                            <Sky theme={theme} night={!sunAboveHorizon}/>
                            {heliodon &&
                            <Heliodon
                                hourAngle={hourAngle}
                                declinationAngle={declinationAngle}
                                radius={radius}
                                date={now}
                                latitude={Util.toRadians(latitude)}
                            />}
                            {world && <Scene world={world}/>}
                        </Suspense>
                    </Canvas>
                </div>
            </Dropdown>
            <AcceptCookie/>
        </div>
    );
};

export default App;
