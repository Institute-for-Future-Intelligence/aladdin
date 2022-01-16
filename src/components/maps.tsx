/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import React, { useCallback, useRef, useState } from 'react';
import { GoogleMap, Marker } from '@react-google-maps/api';
import { useStore } from '../stores/common';
import * as Selector from '../stores/selector';
import { UndoableChangeLocation } from '../undo/UndoableChangeLocation';
import { UndoableChange } from '../undo/UndoableChange';

const containerStyle = {
  border: '1px solid',
  width: '400px',
  height: '400px',
};

const Maps = () => {
  const setCommonStore = useStore(Selector.set);
  const addUndoable = useStore(Selector.addUndoable);
  const latitude = useStore(Selector.world.latitude);
  const longitude = useStore(Selector.world.longitude);
  const weatherData = useStore(Selector.weatherData);
  const mapWeatherStations = useStore(Selector.viewState.mapWeatherStations);
  const mapZoom = useStore(Selector.viewState.mapZoom);
  const mapTilt = useStore(Selector.viewState.mapTilt);
  const mapType = useStore(Selector.viewState.mapType);

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const bounds = useRef<google.maps.LatLngBounds | null | undefined>();
  const cities = useRef<google.maps.LatLng[]>([]);
  const [updateFlag, setUpdateFlag] = useState<boolean>(false);

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  const onUnmount = useCallback(function callback() {
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
      if (mapWeatherStations) {
        loadCities();
      }
    }
  };

  const onCenterChanged = () => {
    if (map) {
      const center = map.getCenter();
      const lat = center.lat();
      const lng = center.lng();
      if (lat !== latitude || lng !== longitude) {
        // We do not want to make this undoable as it will result in
        // too many undoable events as the user drags the map
        // const undoableChangeLocation = {
        //   name: 'Set Location',
        //   timestamp: Date.now(),
        //   oldLatitude: latitude,
        //   newLatitude: lat,
        //   oldLongitude: longitude,
        //   newLongitude: lng,
        //   undo: () => {
        //     setCommonStore((state) => {
        //       state.world.latitude = undoableChangeLocation.oldLatitude;
        //       state.world.longitude = undoableChangeLocation.oldLongitude;
        //     });
        //   },
        //   redo: () => {
        //     setCommonStore((state) => {
        //       state.world.latitude = undoableChangeLocation.newLatitude;
        //       state.world.longitude = undoableChangeLocation.newLongitude;
        //     });
        //   },
        // } as UndoableChangeLocation;
        // addUndoable(undoableChangeLocation);
        setCommonStore((state) => {
          state.world.latitude = lat;
          state.world.longitude = lng;
        });
      }
    }
  };

  const onZoomChanged = () => {
    if (map) {
      const z = map.getZoom();
      if (z !== mapZoom) {
        const undoableChange = {
          name: 'Zoom Map',
          timestamp: Date.now(),
          oldValue: mapZoom,
          newValue: z,
          undo: () => {
            setCommonStore((state) => {
              state.viewState.mapZoom = undoableChange.oldValue as number;
            });
          },
          redo: () => {
            setCommonStore((state) => {
              state.viewState.mapZoom = undoableChange.newValue as number;
            });
          },
        } as UndoableChange;
        addUndoable(undoableChange);
        setCommonStore((state) => {
          state.viewState.mapZoom = z;
        });
      }
    }
  };

  const onTiltChanged = () => {
    if (map) {
      const t = map.getTilt();
      if (t !== mapTilt) {
        const undoableChange = {
          name: 'Tilt Map',
          timestamp: Date.now(),
          oldValue: mapTilt,
          newValue: t,
          undo: () => {
            setCommonStore((state) => {
              state.viewState.mapTilt = undoableChange.oldValue as number;
            });
          },
          redo: () => {
            setCommonStore((state) => {
              state.viewState.mapTilt = undoableChange.newValue as number;
            });
          },
        } as UndoableChange;
        addUndoable(undoableChange);
        setCommonStore((state) => {
          state.viewState.mapTilt = t;
        });
      }
    }
  };

  const onMapTypeIdChanged = () => {
    if (map) {
      const typeId = map.getMapTypeId();
      if (typeId !== mapType) {
        const undoableChange = {
          name: 'Change Map Type',
          timestamp: Date.now(),
          oldValue: mapType,
          newValue: typeId,
          undo: () => {
            setCommonStore((state) => {
              state.viewState.mapType = undoableChange.oldValue as string;
            });
          },
          redo: () => {
            setCommonStore((state) => {
              state.viewState.mapType = undoableChange.newValue as string;
            });
          },
        } as UndoableChange;
        addUndoable(undoableChange);
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
      mapTypeId={mapType}
      center={latLng}
      zoom={mapZoom}
      tilt={mapTilt}
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
        {mapWeatherStations &&
          cities.current.map((c, index) => {
            const scale = 0.2 * mapZoom;
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
