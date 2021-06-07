/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, {useRef} from 'react';
import {useStore} from "./stores/common";
import styled from 'styled-components';
import {Space, Switch} from "antd";
import {CompactPicker} from 'react-color';
import Maps from "./maps";
import {LoadScript, StandaloneSearchBox} from "@react-google-maps/api";
import {Libraries} from "@react-google-maps/api/dist/utils/make-load-script-url";
import 'antd/dist/antd.css';

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

  svg.icon {
    height: 16px;
    width: 16px;
    padding: 8px;
    fill: #666;
  }
`;

export interface SceneSettingsPanelProps {
    axes: boolean;
    grid: boolean;
    groundColor: string;
    setAxes?: (on: boolean) => void;
    setGrid?: (on: boolean) => void;
    setGroundColor?: (color: string) => void;
    changeLatitude?: (latitude: number) => void;
    changeLongitude?: (longitude: number) => void;
    changeMapZoom?: (zoom: number) => void;
    changeMapTilt?: (tilt: number) => void;
    changeMapType?: (type: string) => void;
}

const SceneSettingsPanel = ({
                                grid,
                                axes,
                                groundColor,
                                setGrid,
                                setAxes,
                                setGroundColor,
                                changeLatitude,
                                changeLongitude,
                                changeMapZoom,
                                changeMapTilt,
                                changeMapType,
                            }: SceneSettingsPanelProps) => {

    const set = useStore(state => state.set);
    const latitude = useStore(state => state.latitude);
    const longitude = useStore(state => state.longitude);
    const mapZoom = useStore(state => state.mapZoom);
    const address = useStore(state => state.address);
    const searchBox = useRef<google.maps.places.SearchBox>();

    const libraries = ['places'] as Libraries;

    const onPlacesChanged = () => {
        const places = searchBox.current?.getPlaces();
        if (places && places.length > 0) {
            set((state) => {
                const geometry = places[0].geometry;
                if (geometry) {
                    state.latitude = geometry.location.lat();
                    state.longitude = geometry.location.lng();
                }
                state.address = places[0].formatted_address as string;
            });
        }
    };

    const onLoad = (s: google.maps.places.SearchBox) => {
        searchBox.current = s;
    };

    return (
        <LoadScript id="script-loader" googleMapsApiKey={process.env.REACT_APP_MAPS_API_KEY as string}
                    libraries={libraries}>
            <Container>
                <ColumnWrapper>
                    <Header>
                        <span>Scene Settings</span>
                        <span style={{cursor: 'pointer'}} onClick={() => {
                            set((state) => {
                                state.showSceneSettings = false;
                            });
                        }}>Close</span>
                    </Header>
                    <Space direction={'vertical'}>
                        <Space style={{padding: '20px'}} align={'baseline'} size={20}>
                            <Space direction={'vertical'}>
                                <div>
                                    Axes<br/>
                                    <Switch checked={axes} onChange={(checked) => {
                                        setAxes?.(checked);
                                    }}/>
                                </div>
                                <div>
                                    Grid<br/>
                                    <Switch checked={grid} onChange={(checked) => {
                                        setGrid?.(checked);
                                    }}/>
                                </div>
                            </Space>
                            <div>
                                Ground Color<br/>
                                <CompactPicker color={groundColor} onChangeComplete={(colorResult) => {
                                    setGroundColor?.(colorResult.hex);
                                }}/>
                            </div>
                        </Space>
                        <Space>
                            <div>
                                <StandaloneSearchBox onLoad={onLoad}
                                                     onPlacesChanged={onPlacesChanged}>
                                    <input
                                        type="text"
                                        placeholder={address}
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
                        <Space>
                            <div>
                                <Maps setLatitude={changeLatitude}
                                      setLongitude={changeLongitude}
                                      setZoom={changeMapZoom}
                                      setTilt={changeMapTilt}
                                      setType={changeMapType}
                                />
                                Coordinates: ({latitude.toFixed(2)}°, {longitude.toFixed(2)}°),
                                Zoom: {mapZoom}
                            </div>
                        </Space>
                    </Space>
                </ColumnWrapper>
            </Container>
        </LoadScript>
    );
};

export default SceneSettingsPanel;
