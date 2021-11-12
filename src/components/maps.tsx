/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { GoogleMap, Marker } from '@react-google-maps/api';
import { useStore } from '../stores/common';
import * as Selector from '../stores/selector';

const containerStyle = {
  border: '1px solid',
  width: '480px',
  height: '480px',
};

const Maps = () => {
  const setCommonStore = useStore(Selector.set);
  const latitude = useStore(Selector.world.latitude);
  const longitude = useStore(Selector.world.longitude);
  const weatherData = useStore(Selector.weatherData);
  const viewState = useStore((state) => state.viewState);

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const bounds = useRef<google.maps.LatLngBounds | null | undefined>();
  const cities = useRef<google.maps.LatLng[]>([]);
  const [updateFlag, setUpdateFlag] = useState<boolean>(false);

  useEffect(() => {}, [updateFlag]);

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
      if (viewState.mapWeatherStations) {
        loadCities();
      }
    }
  };

  const onCenterChanged = () => {
    if (map) {
      const center = map.getCenter();
      const lat = center.lat();
      if (lat !== latitude) {
        setCommonStore((state) => {
          state.world.latitude = lat;
        });
      }
      const lng = center.lng();
      if (lng !== longitude) {
        setCommonStore((state) => {
          state.world.longitude = lng;
        });
      }
    }
  };

  const onZoomChanged = () => {
    if (map) {
      const z = map.getZoom();
      if (z !== viewState.mapZoom) {
        setCommonStore((state) => {
          state.viewState.mapZoom = z;
        });
      }
    }
  };

  const onTiltChanged = () => {
    if (map) {
      const t = map.getTilt();
      if (t !== viewState.mapTilt) {
        setCommonStore((state) => {
          state.viewState.mapTilt = t;
        });
      }
    }
  };

  const onMapTypeIdChanged = () => {
    if (map) {
      const typeId = map.getMapTypeId();
      if (typeId !== viewState.mapType) {
        setCommonStore((state) => {
          state.viewState.mapType = typeId;
        });
      }
    }
  };

  const latLng = { lat: latitude, lng: longitude };

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      mapTypeId={viewState.mapType}
      center={latLng}
      zoom={viewState.mapZoom}
      tilt={viewState.mapTilt}
      onLoad={onLoad}
      onBoundsChanged={onBoundsChanged}
      onUnmount={onUnmount}
      onCenterChanged={onCenterChanged}
      onZoomChanged={onZoomChanged}
      onTiltChanged={onTiltChanged}
      onMapTypeIdChanged={onMapTypeIdChanged}
    >
      {/* Child components, such as markers, info windows, etc. */}
      <>
        {viewState.mapWeatherStations &&
          cities.current.map((c, index) => {
            const scale = 0.2 * viewState.mapZoom;
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
            );
          })}
      </>
    </GoogleMap>
  );
};

export default React.memo(Maps);
