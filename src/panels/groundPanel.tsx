/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, {useRef, useState} from 'react';
import {useStore} from "../stores/common";
import styled from 'styled-components';
import {Space, Switch} from "antd";
import {CompactPicker} from 'react-color';
import Maps from "../components/maps";
import {StandaloneSearchBox, useJsApiLoader} from "@react-google-maps/api";
import {Libraries} from "@react-google-maps/api/dist/utils/make-load-script-url";
import Spinner from '../components/spinner';
import ReactDraggable, {DraggableEventHandler} from "react-draggable";
import 'antd/dist/antd.css';

const libraries = ['places'] as Libraries;

const Container = styled.div`
  position: fixed;
  top: 10px;
  left: 10px;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 16px;
  z-index: 9;
`;

const ColumnWrapper = styled.div`
  background-color: #f8f8f8;
  position: absolute;
  left: 0;
  top: 0;
  width: 420px;
  padding-bottom: 10px;
  border: 2px solid gainsboro;
  border-radius: 10px 10px 10px 10px;
  display: flex;
  flex-direction: column;
`;

const Header = styled.div`
  border-radius: 10px 10px 0 0;
  width: 100%;
  height: 24px;
  padding: 10px;
  background-color: #e8e8e8;
  color: #888;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: move;

  svg.icon {
    height: 16px;
    width: 16px;
    padding: 8px;
    fill: #666;
  }
`;

export interface GroundPanelProps {
    grid: boolean;
    groundImage: boolean;
    groundColor: string;
    setGrid?: (on: boolean) => void;
    setGroundImage?: (on: boolean) => void;
    setGroundColor?: (color: string) => void;
    changeLatitude?: (latitude: number) => void;
    changeLongitude?: (longitude: number) => void;
    changeMapZoom?: (zoom: number) => void;
    changeMapTilt?: (tilt: number) => void;
    changeMapType?: (type: string) => void;
    requestUpdate: () => void;
}

const GroundPanel = ({
                         grid,
                         groundImage,
                         groundColor,
                         setGrid,
                         setGroundImage,
                         setGroundColor,
                         changeLatitude,
                         changeLongitude,
                         changeMapZoom,
                         changeMapTilt,
                         changeMapType,
                         requestUpdate
                     }: GroundPanelProps) => {

    const setCommonStore = useStore(state => state.set);
    const world = useStore(state => state.world);
    const viewState = useStore(state => state.viewState);
    const searchBox = useRef<google.maps.places.SearchBox>();
    const [curPosition, setCurPosition] = useState({
        x: isNaN(viewState.groundPanelX) ? 0 : viewState.groundPanelX,
        y: isNaN(viewState.groundPanelY) ? 0 : viewState.groundPanelY
    });

    const {isLoaded, loadError} = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: process.env.REACT_APP_MAPS_API_KEY as string,
        libraries: libraries
    });

    const onPlacesChanged = () => {
        const places = searchBox.current?.getPlaces();
        if (places && places.length > 0) {
            setCommonStore((state) => {
                const geometry = places[0].geometry;
                if (geometry) {
                    state.world.latitude = geometry.location.lat();
                    state.world.longitude = geometry.location.lng();
                }
                state.world.address = places[0].formatted_address as string;
            });
            requestUpdate();
        }
    };

    const onLoad = (s: google.maps.places.SearchBox) => {
        searchBox.current = s;
    };

    const setMapWeatherStations = (on: boolean) => {
        setCommonStore(state => {
            state.viewState.mapWeatherStations = on;
        });
        requestUpdate();
    };

    const onDrag: DraggableEventHandler = (e, ui) => {
        setCurPosition({x: ui.x, y: ui.y});
    };

    const onDragEnd: DraggableEventHandler = (e, ui) => {
        setCommonStore(state => {
            state.viewState.groundPanelX = ui.x;
            state.viewState.groundPanelY = ui.y;
        });
    };

    const closePanel = () => {
        setCommonStore((state) => {
            state.viewState.showGroundPanel = false;
        });
        requestUpdate();
    };

    return (
        <ReactDraggable
            handle={'.handle'}
            bounds={'parent'}
            axis='both'
            position={curPosition}
            onDrag={onDrag}
            onStop={onDragEnd}
        >
            <Container>
                <ColumnWrapper>
                    <Header className='handle'>
                        <span>Ground Settings</span>
                        <span style={{cursor: 'pointer'}}
                              onTouchStart={() => {
                                  closePanel();
                              }}
                              onMouseDown={() => {
                                  closePanel();
                              }}>
                            Close
                        </span>
                    </Header>
                    <Space direction={'vertical'}>
                        <Space style={{padding: '20px'}} align={'center'} size={20}>
                            <Space direction={'vertical'}>
                                <Space>
                                    <Space style={{width: '60px'}}>Grid:</Space>
                                    <Switch title={'Show ground grid'}
                                            checked={grid}
                                            onChange={(checked) => {
                                                setGrid?.(checked);
                                                requestUpdate();
                                            }}
                                    />
                                </Space>
                                <Space>
                                    <Space style={{width: '60px'}}>Image:</Space>
                                    <Switch title={'Show ground image'}
                                            checked={groundImage}
                                            onChange={(checked) => {
                                                setGroundImage?.(checked);
                                            }}
                                    />
                                </Space>
                                <Space>
                                    <Space style={{width: '60px'}}>Stations:</Space>
                                    <Switch title={'Show weather stations'}
                                            checked={viewState.mapWeatherStations}
                                            onChange={(checked) => {
                                                setMapWeatherStations(checked);
                                            }}
                                    />
                                </Space>
                            </Space>
                            <div>Ground Color<br/>
                                <CompactPicker color={groundColor} onChangeComplete={(colorResult) => {
                                    setGroundColor?.(colorResult.hex);
                                }}/>
                            </div>
                        </Space>
                        {isLoaded &&
                        <Space>
                            <div>
                                <StandaloneSearchBox onLoad={onLoad}
                                                     onPlacesChanged={onPlacesChanged}>
                                    <input
                                        type="text"
                                        placeholder={world.address}
                                        style={{
                                            boxSizing: `border-box`,
                                            border: `1px solid transparent`,
                                            width: `400px`,
                                            height: `32px`,
                                            padding: `0 12px`,
                                            borderRadius: `3px`,
                                            boxShadow: `0 2px 6px rgba(0, 0, 0, 0.3)`,
                                            fontSize: `14px`,
                                            outline: `none`,
                                            textOverflow: `ellipses`,
                                            position: "relative"
                                        }}
                                    />
                                </StandaloneSearchBox>
                            </div>
                        </Space>
                        }
                        {isLoaded ?
                            <Space>
                                <div>
                                    <Maps setLatitude={changeLatitude}
                                          setLongitude={changeLongitude}
                                          setZoom={changeMapZoom}
                                          setTilt={changeMapTilt}
                                          setType={changeMapType}
                                    />
                                    Coordinates: ({world.latitude.toFixed(4)}°, {world.longitude.toFixed(4)}°),
                                    Zoom: {viewState.mapZoom}
                                </div>
                            </Space>
                            :
                            <Spinner/>
                        }
                        {loadError &&
                        <Space>
                            <div>Map cannot be loaded right now, sorry.</div>
                        </Space>
                        }
                    </Space>
                </ColumnWrapper>
            </Container>
        </ReactDraggable>
    );
};

export default GroundPanel;
