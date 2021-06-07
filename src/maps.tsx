/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, {memo, useCallback, useState} from "react";
import {GoogleMap, useJsApiLoader} from '@react-google-maps/api';
import {useStore} from "./stores/common";

export interface MapsProp {

    setLatitude?: (value: number) => void;
    setLongitude?: (value: number) => void;
    setZoom?: (value: number) => void;
    setTilt?: (value: number) => void;
    setType?: (value: string) => void;

}

const containerStyle = {
    width: '400px',
    height: '400px'
};

const Maps = ({
                  setLatitude,
                  setLongitude,
                  setZoom,
                  setTilt,
                  setType,
              }: MapsProp) => {

    const latitude = useStore(state => state.latitude);
    const longitude = useStore(state => state.longitude);
    const zoom = useStore(state => state.mapZoom);
    const type = useStore(state => state.mapType);
    const tilt = useStore(state => state.mapTilt);
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

    const onZoomChanged = () => {
        if (map) {
            const z = map.getZoom();
            if (z !== zoom) {
                setZoom?.(z);
            }
        }
    };

    const onTiltChanged = () => {
        if (map) {
            const t = map.getTilt();
            if (t !== tilt) {
                setTilt?.(t);
            }
        }
    };

    const onMapTypeIdChanged = () => {
        if (map) {
            const typeId = map.getMapTypeId();
            if (typeId !== type) {
                setType?.(typeId);
            }
        }
    };

    const latLng = {lat: latitude, lng: longitude};

    return isLoaded ? (
        <GoogleMap
            mapContainerStyle={containerStyle}
            mapTypeId={type}
            center={latLng}
            zoom={zoom}
            tilt={tilt}
            onLoad={onLoad}
            onUnmount={onUnmount}
            onCenterChanged={onCenterChanged}
            onZoomChanged={onZoomChanged}
            onTiltChanged={onTiltChanged}
            onMapTypeIdChanged={onMapTypeIdChanged}
        >
            { /* Child components, such as markers, info windows, etc. */}
            <></>
        </GoogleMap>
    ) : <></>
};

export default memo(Maps);
