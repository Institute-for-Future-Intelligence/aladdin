/*
 * @Copyright 2021-2023. Institute for Future Intelligence, Inc.
 */

import React, { useCallback, useState } from 'react';
import { GoogleMap } from '@react-google-maps/api';
import { useStore } from '../stores/common';
import * as Selector from '../stores/selector';
import { UndoableChange } from '../undo/UndoableChange';
import { UndoableChangeLocation } from '../undo/UndoableChangeLocation';
import { throttle } from 'lodash';

const GroundMap = ({ width = 400, height = 400 }: { width: number; height: number }) => {
  const setCommonStore = useStore(Selector.set);
  const addUndoable = useStore(Selector.addUndoable);
  const latitude = useStore(Selector.world.latitude);
  const longitude = useStore(Selector.world.longitude);
  const mapZoom = useStore(Selector.viewState.mapZoom);
  const mapTilt = useStore(Selector.viewState.mapTilt);
  const mapType = useStore(Selector.viewState.mapType);

  const [map, setMap] = useState<google.maps.Map | null>(null);

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  const onUnmount = useCallback(function callback() {
    setMap(null);
  }, []);

  const onCenterChanged = throttle(
    () => {
      if (map) {
        const center = map.getCenter();
        const lat = center.lat();
        const lng = center.lng();
        if (lat !== latitude || lng !== longitude) {
          const undoableChangeLocation = {
            name: 'Set Location',
            timestamp: Date.now(),
            oldLatitude: latitude,
            newLatitude: lat,
            oldLongitude: longitude,
            newLongitude: lng,
            undo: () => {
              setCommonStore((state) => {
                state.world.latitude = undoableChangeLocation.oldLatitude;
                state.world.longitude = undoableChangeLocation.oldLongitude;
              });
            },
            redo: () => {
              setCommonStore((state) => {
                state.world.latitude = undoableChangeLocation.newLatitude;
                state.world.longitude = undoableChangeLocation.newLongitude;
              });
            },
          } as UndoableChangeLocation;
          addUndoable(undoableChangeLocation);
          setCommonStore((state) => {
            state.world.latitude = lat;
            state.world.longitude = lng;
          });
        }
      }
    },
    1000,
    { leading: false, trailing: true },
  );

  const onZoomChanged = throttle(
    () => {
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
    },
    1000,
    { leading: false, trailing: true },
  );

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

  return (
    <GoogleMap
      mapContainerStyle={{
        border: '1px solid',
        width: width + 'px',
        height: height + 'px',
      }}
      mapTypeId={mapType}
      center={{ lat: latitude, lng: longitude }}
      zoom={mapZoom}
      tilt={mapTilt}
      onLoad={onLoad}
      onUnmount={onUnmount}
      onCenterChanged={onCenterChanged}
      onZoomChanged={onZoomChanged}
      onTiltChanged={onTiltChanged}
      onMapTypeIdChanged={onMapTypeIdChanged}
    />
  );
};

export default React.memo(GroundMap);
