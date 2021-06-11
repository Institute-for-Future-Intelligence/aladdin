/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, {memo, useCallback, useEffect, useRef, useState} from "react";
import {GoogleMap, Marker} from '@react-google-maps/api';
import {useStore} from "../stores/common";

export interface MapsProp {

    setLatitude?: (value: number) => void;
    setLongitude?: (value: number) => void;
    setZoom?: (value: number) => void;
    setTilt?: (value: number) => void;
    setType?: (value: string) => void;

}

const containerStyle = {
    border: '1px solid',
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
    const bounds = useRef<google.maps.LatLngBounds | null | undefined>();
    const cities = useRef<google.maps.LatLng[]>([]);
    const weatherData = useStore(state => state.weatherData);
    const [updateFlag, setUpdateFlag] = useState<boolean>(false);

    useEffect(() => {
    }, [updateFlag]);

    const onLoad = useCallback((map: google.maps.Map) => {
        setMap(map);
    }, []);

    const onUnmount = useCallback(function callback(map) {
        setMap(null);
    }, []);

    const loadCities = () => {
        if (bounds.current) {
            cities.current.length = 0;
            for (const x in weatherData) {
                if (weatherData.hasOwnProperty(x)) {
                    const w = weatherData[x];
                    const pos = new google.maps.LatLng(w.latitude, w.longitude);
                    if (bounds.current.contains(pos)) {
                        cities.current.push(pos);
                    }
                }
            }
            setUpdateFlag(!updateFlag);
        }
    };

    const onBoundsChanged = () => {
        if (map) {
            bounds.current = map.getBounds();
            loadCities();
        }
    };

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

    return (
        <GoogleMap
            mapContainerStyle={containerStyle}
            mapTypeId={type}
            center={latLng}
            zoom={zoom}
            tilt={tilt}
            onLoad={onLoad}
            onBoundsChanged={onBoundsChanged}
            onUnmount={onUnmount}
            onCenterChanged={onCenterChanged}
            onZoomChanged={onZoomChanged}
            onTiltChanged={onTiltChanged}
            onMapTypeIdChanged={onMapTypeIdChanged}
        >
            { /* Child components, such as markers, info windows, etc. */}
            <>
                {cities.current.map((c, index) => {
                    const scale = 0.2 * zoom;
                    return (
                        <Marker
                            key={index}
                            icon={{
                                path: google.maps.SymbolPath.CIRCLE,
                                strokeColor: 'red',
                                strokeWeight: scale + 2,
                                scale: scale,
                            }}
                            position={c}
                        />
                    )
                })}
            </>
        </GoogleMap>
    );
};

export default memo(Maps);
