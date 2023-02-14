/*
 * @Copyright 2023. Institute for Future Intelligence, Inc.
 */

import sites from '../sites/sites.json';
import BuildingIcon from '../assets/map-building.png';
import SolarPanelIcon from '../assets/map-solar-panel.png';

import React, { useCallback, useRef, useState } from 'react';
import { GoogleMap, Marker, GoogleMapProps } from '@react-google-maps/api';
import { useStore } from '../stores/common';
import * as Selector from '../stores/selector';
import { UndoableChange } from '../undo/UndoableChange';
import { UndoableChangeLocation } from '../undo/UndoableChangeLocation';
import { DEFAULT_MODEL_MAP_ZOOM, HOME_URL } from '../constants';

const ModelMap = ({ close }: { close: () => void }) => {
  const setCommonStore = useStore(Selector.set);
  const addUndoable = useStore(Selector.addUndoable);
  const modelMapLatitude = useStore(Selector.modelMapLatitude);
  const latitude = modelMapLatitude !== undefined ? modelMapLatitude : 42.2844063;
  const modelMapLongitude = useStore(Selector.modelMapLongitude);
  const longitude = modelMapLongitude !== undefined ? modelMapLongitude : -71.3488548;
  const mapZoom = useStore(Selector.modelMapZoom) ?? DEFAULT_MODEL_MAP_ZOOM;
  const mapTilt = useStore(Selector.modelMapTilt) ?? 0;
  const mapType = useStore(Selector.modelMapType) ?? 'roadmap';

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const bounds = useRef<google.maps.LatLngBounds | null | undefined>();

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  const onUnmount = useCallback(function callback() {
    setMap(null);
  }, []);

  const onBoundsChanged = () => {
    if (map) {
      const oldPos = bounds.current?.getCenter();
      bounds.current = map.getBounds();
      const newPos = bounds.current?.getCenter();
      let same = true;
      if (oldPos && newPos) {
        if (oldPos.lat() !== newPos.lat() || oldPos.lng() !== newPos.lng()) {
          same = false;
        }
      }
      if (!same) {
        // TODO
      }
    }
  };

  const onCenterChanged = () => {
    if (map) {
      const center = map.getCenter();
      const lat = center.lat();
      const lng = center.lng();
      if (lat !== latitude || lng !== longitude) {
        const undoableChangeLocation = {
          name: 'Set Model Map Location',
          timestamp: Date.now(),
          oldLatitude: latitude,
          newLatitude: lat,
          oldLongitude: longitude,
          newLongitude: lng,
          undo: () => {
            setCommonStore((state) => {
              state.modelMapLatitude = undoableChangeLocation.oldLatitude;
              state.modelMapLongitude = undoableChangeLocation.oldLongitude;
            });
          },
          redo: () => {
            setCommonStore((state) => {
              state.modelMapLatitude = undoableChangeLocation.newLatitude;
              state.modelMapLongitude = undoableChangeLocation.newLongitude;
            });
          },
        } as UndoableChangeLocation;
        addUndoable(undoableChangeLocation);
        setCommonStore((state) => {
          state.modelMapLatitude = lat;
          state.modelMapLongitude = lng;
        });
      }
    }
  };

  const onZoomChanged = () => {
    if (map) {
      const z = map.getZoom();
      if (z !== mapZoom) {
        const undoableChange = {
          name: 'Zoom Model Map',
          timestamp: Date.now(),
          oldValue: mapZoom,
          newValue: z,
          undo: () => {
            setCommonStore((state) => {
              state.modelMapZoom = undoableChange.oldValue as number;
            });
          },
          redo: () => {
            setCommonStore((state) => {
              state.modelMapZoom = undoableChange.newValue as number;
            });
          },
        } as UndoableChange;
        addUndoable(undoableChange);
        setCommonStore((state) => {
          state.modelMapZoom = z;
        });
      }
    }
  };

  const onTiltChanged = () => {
    if (map) {
      const t = map.getTilt();
      if (t !== mapTilt) {
        const undoableChange = {
          name: 'Tilt Model Map',
          timestamp: Date.now(),
          oldValue: mapTilt,
          newValue: t,
          undo: () => {
            setCommonStore((state) => {
              state.modelMapTilt = undoableChange.oldValue as number;
            });
          },
          redo: () => {
            setCommonStore((state) => {
              state.modelMapTilt = undoableChange.newValue as number;
            });
          },
        } as UndoableChange;
        addUndoable(undoableChange);
        setCommonStore((state) => {
          state.modelMapTilt = t;
        });
      }
    }
  };

  const onMapTypeIdChanged = () => {
    if (map) {
      const typeId = map.getMapTypeId();
      if (typeId !== mapType) {
        const undoableChange = {
          name: 'Change Model Map Type',
          timestamp: Date.now(),
          oldValue: mapType,
          newValue: typeId,
          undo: () => {
            setCommonStore((state) => {
              state.modelMapType = undoableChange.oldValue as string;
            });
          },
          redo: () => {
            setCommonStore((state) => {
              state.modelMapType = undoableChange.newValue as string;
            });
          },
        } as UndoableChange;
        addUndoable(undoableChange);
        setCommonStore((state) => {
          state.modelMapType = typeId;
        });
      }
    }
  };

  const latLng = { lat: latitude, lng: longitude };

  const options = {
    styles: [
      {
        featureType: 'poi',
        elementType: 'labels',
        stylers: [{ visibility: 'off' }],
      },
      {
        featureType: 'transit',
        elementType: 'labels',
        stylers: [{ visibility: 'off' }],
      },
    ],
  } as GoogleMapProps;

  return (
    <GoogleMap
      mapContainerStyle={{
        border: '1px solid',
        width: '100%',
        height: '100%',
      }}
      options={options}
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
        {sites.map((site, index) => {
          let icon = BuildingIcon;
          if (site.type === 'PV') {
            icon = SolarPanelIcon;
          }
          return (
            <Marker
              key={index}
              icon={icon}
              position={{ lat: site.latitude, lng: site.longitude }}
              onClick={() => {
                close();
                if (site.url) {
                  const url = HOME_URL + '?client=web&' + site.url;
                  window.history.pushState({}, document.title, url);
                }
              }}
            />
          );
        })}
      </>
    </GoogleMap>
  );
};

export default React.memo(ModelMap);
