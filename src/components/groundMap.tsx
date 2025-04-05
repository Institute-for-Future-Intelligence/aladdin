/*
 * @Copyright 2021-2025. Institute for Future Intelligence, Inc.
 */

import React, { useCallback, useState } from 'react';
import { GoogleMap } from '@react-google-maps/api';
import { useStore } from '../stores/common';
import * as Selector from '../stores/selector';
import { UndoableChange } from '../undo/UndoableChange';
import { UndoableChangeLocation } from '../undo/UndoableChangeLocation';
import { throttle } from 'lodash';
import { turnOffVisualization } from '../panels/panelUtils';

const GroundMap = React.memo(({ width = 400, height = 400 }: { width: number; height: number }) => {
  const setCommonStore = useStore(Selector.set);
  const addUndoable = useStore(Selector.addUndoable);
  const latitude = useStore(Selector.world.latitude);
  const longitude = useStore(Selector.world.longitude);
  const mapZoom = useStore(Selector.viewState.mapZoom);
  const mapTilt = useStore(Selector.viewState.mapTilt);
  const mapType = useStore(Selector.viewState.mapType);

  const [map, setMap] = useState<google.maps.Map | null>(null);

  const waitTime = 1000;

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  const onUnmount = useCallback(function callback() {
    setMap(null);
  }, []);

  const updateAddress = () => {
    const latlng = new google.maps.LatLng(latitude, longitude);
    new google.maps.Geocoder().geocode({ location: latlng }, function (results, status) {
      if (status === google.maps.GeocoderStatus.OK) {
        if (results && results[0].address_components) {
          setCommonStore((state) => {
            state.world.address = results[0].formatted_address;
          });
          for (const a of results[0].address_components) {
            if (a.types[0] === 'country') {
              setCommonStore((state) => {
                state.world.countryCode = a.short_name;
              });
              break;
            }
          }
        }
      }
    });
  };

  // FIXME: Undo doesn't work unless the focus is returned to the main window
  const onCenterChanged = throttle(
    () => {
      if (map) {
        const center = map.getCenter();
        if (center) {
          const lat = center.lat();
          const lng = center.lng();
          if (lat !== latitude || lng !== longitude) {
            updateAddress();
            const undoableChangeLocation = {
              name: 'Set Location',
              timestamp: Date.now(),
              oldLatitude: latitude,
              newLatitude: lat,
              oldLongitude: longitude,
              newLongitude: lng,
              undo: () => {
                turnOffVisualization();
                setCommonStore((state) => {
                  state.world.latitude = undoableChangeLocation.oldLatitude;
                  state.world.longitude = undoableChangeLocation.oldLongitude;
                });
              },
              redo: () => {
                turnOffVisualization();
                setCommonStore((state) => {
                  state.world.latitude = undoableChangeLocation.newLatitude;
                  state.world.longitude = undoableChangeLocation.newLongitude;
                });
              },
            } as UndoableChangeLocation;
            addUndoable(undoableChangeLocation);
            turnOffVisualization();
            setCommonStore((state) => {
              state.world.latitude = lat;
              state.world.longitude = lng;
            });
          }
        }
      }
    },
    waitTime,
    { leading: false, trailing: true },
  );

  const onZoomChanged = throttle(
    () => {
      if (map) {
        const z = map.getZoom();
        if (z !== undefined && z !== mapZoom) {
          updateAddress();
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
    waitTime,
    { leading: false, trailing: true },
  );

  const onTiltChanged = () => {
    if (map) {
      const t = map.getTilt();
      if (t !== undefined && t !== mapTilt) {
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
      if (typeId !== undefined && typeId !== mapType) {
        const undoableChange = {
          name: 'Change Map Type',
          timestamp: Date.now(),
          oldValue: mapType,
          newValue: typeId,
          undo: () => {
            setCommonStore((state) => {
              state.viewState.mapType = undoableChange.oldValue as string;
              state.viewState.groundImageType = state.viewState.mapType;
            });
          },
          redo: () => {
            setCommonStore((state) => {
              state.viewState.mapType = undoableChange.newValue as string;
              state.viewState.groundImageType = state.viewState.mapType;
            });
          },
        } as UndoableChange;
        addUndoable(undoableChange);
        setCommonStore((state) => {
          state.viewState.mapType = typeId;
          state.viewState.groundImageType = typeId;
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
});

export default GroundMap;
