/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, {memo, useCallback, useState} from "react";
import {GoogleMap, useJsApiLoader} from '@react-google-maps/api';
import {useStore} from "./stores/common";

export interface MapsProp {

    zoom?: number;

    setLatitude?: (value: number) => void;
    setLongitude?: (value: number) => void;
    setZoom?: (value: number) => void;

}

const containerStyle = {
    width: '400px',
    height: '400px'
};

const Maps = ({
                  zoom = 16,
                  setLatitude,
                  setLongitude,
                  setZoom,
              }: MapsProp) => {

    const latitude = useStore(state => state.latitude);
    const longitude = useStore(state => state.longitude);
    const [map, setMap] = useState<google.maps.Map | null>(null);

    const {isLoaded} = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: process.env.REACT_APP_MAPS_API_KEY as string
    });

    const onLoad = useCallback((map: google.maps.Map) => {
        setMap(map);
    }, []);

    const onUnmount = useCallback(function callback(map) {
        setMap(null);
    }, []);

    const onCenterChanged = () => {
        if (map) {
            const center = map.getCenter();
            const lat = center.lat();
            if (lat !== latitude) {
                setLatitude?.(lat);
            }
            const lng = center.lng();
            if (lng !== longitude) {
                setLongitude?.(lng);
            }
        }
    };

    const latLng = {lat: latitude, lng: longitude};

    return isLoaded ? (
        <GoogleMap
            mapContainerStyle={containerStyle}
            center={latLng}
            zoom={zoom}
            onLoad={onLoad}
            onUnmount={onUnmount}
            onCenterChanged={onCenterChanged}
        >
            { /* Child components, such as markers, info windows, etc. */}
            <></>
        </GoogleMap>
    ) : <></>
};

export default memo(Maps);
