/*
 * @Copyright 2023. Institute for Future Intelligence, Inc.
 */

import internalSites from '../sites/sites.json';
import BuildingIcon from '../assets/map-building.png';
import SolarPanelIcon from '../assets/map-solar-panel.png';
import ParabolicDishIcon from '../assets/map-parabolic-dish.png';
import ParabolicTroughIcon from '../assets/map-parabolic-trough.png';
import FresnelReflectorIcon from '../assets/map-fresnel-reflector.png';
import PowerTowerIcon from '../assets/map-power-tower.png';

import React, { useCallback, useRef, useState } from 'react';
import { GoogleMap, Marker, GoogleMapProps, InfoWindow, MarkerClusterer } from '@react-google-maps/api';
import { useStore } from '../stores/common';
import * as Selector from '../stores/selector';
import { UndoableChange } from '../undo/UndoableChange';
import { UndoableChangeLocation } from '../undo/UndoableChangeLocation';
import { DEFAULT_MODEL_MAP_ZOOM } from '../constants';
import { showError } from '../helpers';
import i18n from '../i18n/i18n';
import { ModelSite, ModelType } from '../types';
import { usePrimitiveStore } from '../stores/commonPrimitive';
import { Modal } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';

export interface ModelsMapProps {
  closeMap: () => void;
  openModel: (userid: string, title: string) => void;
  deleteModel: (userid: string, title: string) => void;
}

const ModelsMap = ({ closeMap, openModel, deleteModel }: ModelsMapProps) => {
  const language = useStore(Selector.language);
  const user = useStore.getState().user;
  const setCommonStore = useStore(Selector.set);
  const addUndoable = useStore(Selector.addUndoable);
  const modelsMapLatitude = useStore(Selector.modelsMapLatitude);
  const latitude = modelsMapLatitude !== undefined ? modelsMapLatitude : 42.2844063;
  const modelsMapLongitude = useStore(Selector.modelsMapLongitude);
  const longitude = modelsMapLongitude !== undefined ? modelsMapLongitude : -71.3488548;
  const mapZoom = useStore(Selector.modelsMapZoom) ?? DEFAULT_MODEL_MAP_ZOOM;
  const mapTilt = useStore(Selector.modelsMapTilt) ?? 0;
  const mapType = useStore(Selector.modelsMapType) ?? 'roadmap';
  const weatherData = useStore(Selector.weatherData);
  const mapWeatherStations = usePrimitiveStore(Selector.modelsMapWeatherStations);
  const externalSites = useStore(Selector.modelSites);

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [selectedSite, setSelectedSite] = useState<ModelSite | null>(null);
  const [internal, setInternal] = useState<boolean>(false);
  const previousSiteRef = useRef<ModelSite | null>(null);
  const markersRef = useRef<Array<Marker | null>>([]);
  const selectedMarkerIndexRef = useRef<number>(-1);
  const cities = useRef<google.maps.LatLng[]>([]);

  const lang = { lng: language };

  const loadCities = () => {
    cities.current.length = 0;
    for (const x in weatherData) {
      if (weatherData.hasOwnProperty(x)) {
        const w = weatherData[x];
        const pos = new google.maps.LatLng(w.latitude, w.longitude);
        cities.current.push(pos);
      }
    }
  };

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
    loadCities();
    map.setMapTypeId(mapType); // for some reason, we have to do this again
  }, []);

  const onUnmount = useCallback(function callback() {
    setMap(null);
  }, []);

  // FIXME: Undo doesn't work unless the focus is returned to the main window
  const onCenterChanged = () => {
    if (map) {
      const center = map.getCenter();
      if (center) {
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
                state.modelsMapLatitude = undoableChangeLocation.oldLatitude;
                state.modelsMapLongitude = undoableChangeLocation.oldLongitude;
              });
            },
            redo: () => {
              setCommonStore((state) => {
                state.modelsMapLatitude = undoableChangeLocation.newLatitude;
                state.modelsMapLongitude = undoableChangeLocation.newLongitude;
              });
            },
          } as UndoableChangeLocation;
          addUndoable(undoableChangeLocation);
          setCommonStore((state) => {
            state.modelsMapLatitude = lat;
            state.modelsMapLongitude = lng;
          });
        }
      }
    }
  };

  const onZoomChanged = () => {
    if (map) {
      const z = map.getZoom();
      if (z !== undefined && z !== mapZoom) {
        const undoableChange = {
          name: 'Zoom Model Map',
          timestamp: Date.now(),
          oldValue: mapZoom,
          newValue: z,
          undo: () => {
            setCommonStore((state) => {
              state.modelsMapZoom = undoableChange.oldValue as number;
            });
          },
          redo: () => {
            setCommonStore((state) => {
              state.modelsMapZoom = undoableChange.newValue as number;
            });
          },
        } as UndoableChange;
        addUndoable(undoableChange);
        setCommonStore((state) => {
          state.modelsMapZoom = z;
        });
      }
    }
  };

  const onTiltChanged = () => {
    if (map) {
      const t = map.getTilt();
      if (t !== undefined && t !== mapTilt) {
        const undoableChange = {
          name: 'Tilt Model Map',
          timestamp: Date.now(),
          oldValue: mapTilt,
          newValue: t,
          undo: () => {
            setCommonStore((state) => {
              state.modelsMapTilt = undoableChange.oldValue as number;
            });
          },
          redo: () => {
            setCommonStore((state) => {
              state.modelsMapTilt = undoableChange.newValue as number;
            });
          },
        } as UndoableChange;
        addUndoable(undoableChange);
        setCommonStore((state) => {
          state.modelsMapTilt = t;
        });
      }
    }
  };

  const onMapTypeIdChanged = () => {
    if (map) {
      const typeId = map.getMapTypeId();
      if (typeId !== undefined && typeId !== mapType) {
        const undoableChange = {
          name: 'Change Model Map Type',
          timestamp: Date.now(),
          oldValue: mapType,
          newValue: typeId,
          undo: () => {
            setCommonStore((state) => {
              state.modelsMapType = undoableChange.oldValue as string;
            });
          },
          redo: () => {
            setCommonStore((state) => {
              state.modelsMapType = undoableChange.newValue as string;
            });
          },
        } as UndoableChange;
        addUndoable(undoableChange);
        setCommonStore((state) => {
          state.modelsMapType = typeId;
        });
      }
    }
  };

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

  const openSite = (site: ModelSite) => {
    if (site.userid && site.title) {
      openModel(site.userid, site.title);
      closeMap();
    } else {
      showError(i18n.t('message.ModelNotFound', lang));
    }
  };

  const deleteSite = (site: ModelSite) => {
    if (site) {
      Modal.confirm({
        title: i18n.t('message.DoYouWantToDeleteModelFromMap', lang),
        icon: <ExclamationCircleOutlined />,
        onOk: () => {
          deleteModel(site.userid, site.title);
          markersRef.current[selectedMarkerIndexRef.current]?.marker?.setMap(null);
          setSelectedSite(null);
        },
        onCancel: () => {},
        okText: i18n.t('word.Yes', lang),
        cancelText: i18n.t('word.No', lang),
      });
    }
  };

  const getIconUrl = (site: ModelSite) => {
    switch (site.type) {
      case ModelType.PHOTOVOLTAIC:
        return SolarPanelIcon;
      case ModelType.PARABOLIC_DISH:
        return ParabolicDishIcon;
      case ModelType.PARABOLIC_TROUGH:
        return ParabolicTroughIcon;
      case ModelType.FRESNEL_REFLECTOR:
        return FresnelReflectorIcon;
      case ModelType.SOLAR_POWER_TOWER:
        return PowerTowerIcon;
      case ModelType.BUILDING:
        return BuildingIcon;
    }
    return undefined;
  };

  return (
    <GoogleMap
      mapContainerStyle={{
        border: '1px solid',
        width: '100%',
        height: '100%',
      }}
      mapTypeId={mapType}
      options={options}
      center={{ lat: latitude, lng: longitude }}
      zoom={mapZoom}
      tilt={mapTilt}
      onLoad={onLoad}
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
        {selectedSite && (
          <InfoWindow position={{ lat: selectedSite.latitude, lng: selectedSite.longitude }}>
            <div>
              <label>{selectedSite.label}</label>
              <br />
              <label style={{ fontSize: '11px' }}>{selectedSite.address ?? 'Unknown'}</label>
              <hr />
              <label>by {selectedSite.author ?? i18n.t('word.Anonymous', { lng: language })}</label>
              <div style={{ marginTop: '10px' }}>
                <button onClick={() => openSite(selectedSite)}>{i18n.t('word.Open', { lng: language })}</button>
                {!internal && selectedSite.userid === user.uid && (
                  <button style={{ marginLeft: '5px' }} onClick={() => deleteSite(selectedSite)}>
                    {i18n.t('word.Delete', { lng: language })}
                  </button>
                )}
              </div>
            </div>
          </InfoWindow>
        )}
        {
          <MarkerClusterer>
            {(clusterer) => (
              <div>
                {internalSites.map((site: ModelSite, index: number) => {
                  const iconUrl = getIconUrl(site);
                  const scaledSize = Math.min(32, 3 * mapZoom);
                  return (
                    <Marker
                      key={index}
                      clusterer={clusterer}
                      icon={
                        iconUrl
                          ? {
                              url: iconUrl,
                              scaledSize: new google.maps.Size(scaledSize, scaledSize),
                            }
                          : undefined
                      }
                      position={{ lat: site.latitude, lng: site.longitude }}
                      onClick={() => openSite(site)}
                      onMouseOver={(e) => {
                        previousSiteRef.current = selectedSite;
                        setSelectedSite(site);
                        setInternal(true);
                      }}
                      onMouseOut={(e) => {
                        if (selectedSite === previousSiteRef.current) setSelectedSite(null);
                      }}
                    />
                  );
                })}
                {externalSites.map((site: ModelSite, index: number) => {
                  const iconUrl = getIconUrl(site);
                  const scaledSize = Math.min(32, 3 * mapZoom);
                  return (
                    <Marker
                      key={index}
                      ref={(e) => (markersRef.current[index] = e)}
                      clusterer={clusterer}
                      icon={
                        iconUrl
                          ? {
                              url: iconUrl,
                              scaledSize: new google.maps.Size(scaledSize, scaledSize),
                            }
                          : undefined
                      }
                      position={{ lat: site.latitude, lng: site.longitude }}
                      onClick={() => openSite(site)}
                      onMouseOver={(e) => {
                        previousSiteRef.current = selectedSite;
                        selectedMarkerIndexRef.current = index;
                        setInternal(false);
                        setSelectedSite(site);
                      }}
                      onMouseOut={(e) => {
                        if (selectedSite === previousSiteRef.current) setSelectedSite(null);
                      }}
                    />
                  );
                })}
              </div>
            )}
          </MarkerClusterer>
        }
      </>
    </GoogleMap>
  );
};

export default React.memo(ModelsMap);
