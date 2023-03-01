/*
 * @Copyright 2023. Institute for Future Intelligence, Inc.
 */

import UnderConstructionIcon from '../assets/map-under-construction.png';
import BuildingIcon from '../assets/map-building.png';
import SolarPanelIcon from '../assets/map-solar-panel.png';
import ParabolicDishIcon from '../assets/map-parabolic-dish.png';
import ParabolicTroughIcon from '../assets/map-parabolic-trough.png';
import FresnelReflectorIcon from '../assets/map-fresnel-reflector.png';
import PowerTowerIcon from '../assets/map-power-tower.png';
import EmptyHeartIcon from '../assets/empty_heart.png';
import RedHeartIcon from '../assets/red_heart.png';
import OpenFileIcon from '../assets/open_file.png';
import DeleteIcon from '../assets/delete.png';
import ExportLinkIcon from '../assets/export_link.png';
import ClickCountIcon from '../assets/click_count.png';

import React, { useCallback, useRef, useState } from 'react';
import { GoogleMap, Marker, GoogleMapProps, InfoWindow, MarkerClusterer } from '@react-google-maps/api';
import { useStore } from '../stores/common';
import * as Selector from '../stores/selector';
import { UndoableChange } from '../undo/UndoableChange';
import { UndoableChangeLocation } from '../undo/UndoableChangeLocation';
import { DEFAULT_MODEL_MAP_ZOOM, HOME_URL } from '../constants';
import { copyTextToClipboard, showError, showSuccess } from '../helpers';
import i18n from '../i18n/i18n';
import { ModelSite, ModelType } from '../types';
import { usePrimitiveStore } from '../stores/commonPrimitive';
import { Modal } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import ReactTimeago from 'react-timeago';

export interface ModelsMapProps {
  closeMap: () => void;
  openModel: (userid: string, title: string, fromMap?: boolean) => void;
  deleteModel: (userid: string, title: string) => void;
  likeModel: (userid: string, title: string, like: boolean) => void;
}

const ModelsMap = ({ closeMap, openModel, deleteModel, likeModel }: ModelsMapProps) => {
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
  const modelSites = useStore(Selector.modelSites);

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [selectedSite, setSelectedSite] = useState<ModelSite | null>(null);
  const [updateFlag, setUpdateFlag] = useState<boolean>(false);
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
      openModel(site.userid, site.title, true);
      closeMap();
    } else {
      showError(i18n.t('message.ModelNotFound', lang));
    }
  };

  const shareSite = (site: ModelSite) => {
    if (site.userid && site.title) {
      const url = HOME_URL + '?client=web&userid=' + site.userid + '&title=' + encodeURIComponent(site.title);
      copyTextToClipboard(url);
      showSuccess(i18n.t('cloudFilePanel.LinkGeneratedInClipBoard', lang) + '.');
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
          // also remove from the cached sites
          setCommonStore((state) => {
            if (state.modelSites) {
              let index = -1;
              for (const [i, m] of state.modelSites.entries()) {
                if (m.userid === site.userid && m.title === site.title) {
                  index = i;
                  break;
                }
              }
              if (index >= 0) {
                state.modelSites.splice(index, 1);
              }
            }
          });
          setSelectedSite(null);
        },
        onCancel: () => {},
        okText: i18n.t('word.Yes', lang),
        cancelText: i18n.t('word.No', lang),
      });
    }
  };

  const likeSite = (site: ModelSite) => {
    if (site.userid && site.title) {
      const id = site.title + ' - ' + site.userid;
      const liked = !!user.likes?.includes(id);
      likeModel(site.userid, site.title, !liked);
      setCommonStore((state) => {
        if (state.user) {
          if (!state.user.likes) state.user.likes = [];
          if (state.user.likes.includes(id)) {
            const index = state.user.likes.indexOf(id);
            if (index >= 0) {
              state.user.likes.splice(index, 1);
            }
          } else {
            state.user.likes.push(id);
          }
        }
        if (state.modelSites) {
          for (const m of state.modelSites) {
            if (m.userid === site.userid && m.title === site.title) {
              if (m.likeCount === undefined) m.likeCount = 0;
              m.likeCount += liked ? -1 : 1;
            }
          }
        }
      });
      setUpdateFlag(!updateFlag);
    }
  };

  const getLikeCount = () => {
    if (!selectedSite) return 0;
    for (const m of useStore.getState().modelSites) {
      if (m.userid === selectedSite.userid && m.title === selectedSite.title) {
        return m.likeCount;
      }
    }
    return 0;
  };

  const getClickCount = () => {
    if (!selectedSite) return 0;
    for (const m of useStore.getState().modelSites) {
      if (m.userid === selectedSite.userid && m.title === selectedSite.title) {
        return m.clickCount;
      }
    }
    return 0;
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
      case ModelType.UNDER_CONSTRUCTION:
        return UnderConstructionIcon;
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
            <div onMouseLeave={() => setSelectedSite(null)}>
              <label>{selectedSite.label}</label>
              <br />
              <label style={{ fontSize: '10px' }}>{selectedSite.address ?? 'Unknown'}</label>
              <br />
              <br />
              <label>
                by {selectedSite.author ?? i18n.t('word.Anonymous', { lng: language })}
                &nbsp;&nbsp;&nbsp;
                {selectedSite.timeCreated && <ReactTimeago date={new Date(selectedSite.timeCreated)} />}
              </label>
              <hr />
              <div style={{ marginTop: '10px', fontSize: '14px' }}>
                <img
                  alt={'Open'}
                  onClick={() => {
                    openSite(selectedSite);
                  }}
                  style={{ marginLeft: '10px' }}
                  title={i18n.t('word.Open', { lng: language })}
                  src={OpenFileIcon}
                  height={16}
                  width={16}
                />
                <img
                  alt={'Export link'}
                  onClick={() => {
                    shareSite(selectedSite);
                  }}
                  style={{ marginLeft: '5px' }}
                  title={i18n.t('word.Share', { lng: language })}
                  src={ExportLinkIcon}
                  height={16}
                  width={16}
                />
                {selectedSite.userid === user.uid && (
                  <img
                    alt={'Delete'}
                    onClick={() => {
                      deleteSite(selectedSite);
                    }}
                    style={{ marginLeft: '5px' }}
                    title={i18n.t('word.Delete', { lng: language })}
                    src={DeleteIcon}
                    height={16}
                    width={16}
                  />
                )}
                {user.uid ? (
                  <>
                    {user.likes && user.likes.includes(selectedSite.title + ' - ' + selectedSite.userid) ? (
                      <img
                        alt={'Like'}
                        onClick={() => {
                          likeSite(selectedSite);
                        }}
                        style={{ marginLeft: '10px' }}
                        title={i18n.t('word.AlreadyLike', { lng: language })}
                        src={RedHeartIcon}
                        height={16}
                        width={16}
                      />
                    ) : (
                      <img
                        alt={'Like'}
                        onClick={() => {
                          likeSite(selectedSite);
                        }}
                        style={{ marginLeft: '10px' }}
                        title={i18n.t('word.Like', { lng: language })}
                        src={EmptyHeartIcon}
                        height={16}
                        width={16}
                      />
                    )}
                  </>
                ) : (
                  <>
                    <img
                      alt={'Like'}
                      style={{ marginLeft: '10px' }}
                      title={i18n.t('word.Like', { lng: language })}
                      src={EmptyHeartIcon}
                      height={16}
                      width={16}
                    />
                  </>
                )}
                &nbsp;&nbsp;&nbsp;{getLikeCount()}
                <img
                  alt={'Click counter'}
                  style={{ marginLeft: '10px' }}
                  title={i18n.t('word.ClickCount', { lng: language })}
                  src={ClickCountIcon}
                  height={16}
                  width={16}
                />
                &nbsp;&nbsp;&nbsp;{getClickCount()}
              </div>
            </div>
          </InfoWindow>
        )}
        {
          <MarkerClusterer>
            {(clusterer) => (
              <div>
                {modelSites.map((site: ModelSite, index: number) => {
                  const iconUrl = getIconUrl(site);
                  return (
                    <Marker
                      key={index}
                      ref={(e) => (markersRef.current[index] = e)}
                      clusterer={clusterer}
                      icon={iconUrl ? { url: iconUrl } : undefined}
                      position={{ lat: site.latitude, lng: site.longitude }}
                      onClick={() => openSite(site)}
                      onMouseOver={(e) => {
                        previousSiteRef.current = selectedSite;
                        selectedMarkerIndexRef.current = index;
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