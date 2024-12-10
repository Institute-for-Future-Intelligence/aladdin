/*
 * @Copyright 2023-2024. Institute for Future Intelligence, Inc.
 */

import EmptyHeartIcon from '../assets/empty_heart.png';
import RedHeartIcon from '../assets/red_heart.png';
import OpenFileIcon from '../assets/open_file.png';
import DeleteIcon from '../assets/delete.png';
import ExportLinkIcon from '../assets/export_link.png';
import ClickCountIcon from '../assets/click_count.png';

import React, { MutableRefObject, useCallback, useRef, useState } from 'react';
import { GoogleMap, Marker, GoogleMapProps, InfoWindow, MarkerClusterer } from '@react-google-maps/api';
import { useStore } from '../stores/common';
import * as Selector from '../stores/selector';
import { UndoableChange } from '../undo/UndoableChange';
import { UndoableChangeLocation } from '../undo/UndoableChangeLocation';
import { DEFAULT_MODEL_MAP_ZOOM, HOME_URL, LAT_LNG_FRACTION_DIGITS } from '../constants';
import { showError, showSuccess } from '../helpers';
import i18n from '../i18n/i18n';
import { ModelSite } from '../types';
import { usePrimitiveStore } from '../stores/commonPrimitive';
import { Modal, Collapse, Space } from 'antd';
import {
  ExclamationCircleOutlined,
  UpCircleOutlined,
  DownCircleOutlined,
  PushpinOutlined,
  PushpinFilled,
} from '@ant-design/icons';
import ReactTimeago from 'react-timeago';
import ReactCountryFlag from 'react-country-flag';
import { Util } from '../Util';
import { useLanguage } from '../hooks';
import { getIconUrl } from './mapUtils';
import Point = google.maps.Point;

const { Panel } = Collapse;

export interface ModelsMapProps {
  latRef: MutableRefObject<number>;
  lngRef: MutableRefObject<number>;
  selectAuthor: (author: string | undefined) => void;
  closeMap: () => void;
  openModel: (model: ModelSite) => void;
  deleteModel: (model: ModelSite, successCallback?: () => void) => void;
  likeModel: (model: ModelSite, like: boolean, successCallback?: () => void) => void;
  pinModel: (model: ModelSite, pinned: boolean, successCallback?: () => void) => void;
}

const ModelsMap = React.memo(
  ({ latRef, lngRef, selectAuthor, closeMap, openModel, deleteModel, likeModel, pinModel }: ModelsMapProps) => {
    const user = useStore.getState().user;
    const setCommonStore = useStore(Selector.set);
    const addUndoable = useStore(Selector.addUndoable);
    const mapZoom = useStore(Selector.modelsMapZoom) ?? DEFAULT_MODEL_MAP_ZOOM;
    const mapTilt = useStore(Selector.modelsMapTilt) ?? 0;
    const mapType = useStore(Selector.modelsMapType) ?? 'roadmap';
    const weatherData = useStore(Selector.weatherData);
    const mapWeatherStations = usePrimitiveStore(Selector.modelsMapWeatherStations);
    const modelSites = useStore(Selector.modelSites);

    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [selectedSite, setSelectedSite] = useState<Map<string, ModelSite> | null>(null);
    const [selectedLocation, setSelectedLocation] = useState<google.maps.LatLng | null>(null);
    const [ascendingOrder, setAscendingOrder] = useState<boolean>(true);
    const [updateFlag, setUpdateFlag] = useState<boolean>(false);
    const previousSiteRef = useRef<Map<string, ModelSite> | null>(null);
    const markersRef = useRef<Array<Marker | null>>([]);
    const selectedMarkerIndexRef = useRef<number>(-1);
    const cities = useRef<google.maps.LatLng[]>([]);

    const lang = useLanguage();
    const imageSize = 14;
    const ifiUser = user.email?.endsWith('@intofuture.org');

    const loadCities = () => {
      cities.current.length = 0;
      for (const x in weatherData) {
        if (Object.hasOwn(weatherData, x)) {
          const w = weatherData[x];
          const pos = new google.maps.LatLng(w.latitude, w.longitude);
          cities.current.push(pos);
        }
      }
    };

    const onLoad = useCallback(
      (map: google.maps.Map) => {
        setMap(map);
        loadCities();
        map.setMapTypeId(mapType); // for some reason, we have to do this again
      },
      [mapType],
    );

    const onUnmount = useCallback(function callback() {
      setMap(null);
    }, []);

    const onCenterChanged = () => {
      if (map) {
        const center = map.getCenter();
        if (center) {
          latRef.current = center.lat();
          lngRef.current = center.lng();
        }
      }
    };

    const onZoomChanged = () => {
      if (map) {
        const z = map.getZoom();
        if (z !== undefined && z !== mapZoom) {
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

    const openModelSite = (model: ModelSite) => {
      if (model.userid && model.title) {
        openModel(model);
        closeMap();
      } else {
        showError(i18n.t('message.ModelNotFound', lang));
      }
    };

    const shareModelSite = (model: ModelSite) => {
      if (model.userid && model.title) {
        const url = HOME_URL + '?client=web&userid=' + model.userid + '&title=' + encodeURIComponent(model.title);
        navigator.clipboard
          .writeText(url)
          .then(() => showSuccess(i18n.t('cloudFilePanel.LinkGeneratedInClipBoard', lang) + '.'));
      } else {
        showError(i18n.t('message.ModelNotFound', lang));
      }
    };

    const deleteModelSite = (model: ModelSite) => {
      Modal.confirm({
        title: i18n.t('message.DoYouWantToDeleteModelFromMap', lang),
        icon: <ExclamationCircleOutlined />,
        onOk: () => {
          deleteModel(model, () => {
            // also remove from the cached records
            setCommonStore((state) => {
              if (state.modelSites) {
                const modelsOfSite = state.modelSites.get(Util.getLatLngKey(model.latitude, model.longitude));
                if (modelsOfSite) {
                  let key = undefined;
                  for (const [k, v] of modelsOfSite) {
                    if (v.userid === model.userid && v.title === model.title) {
                      key = k;
                      break;
                    }
                  }
                  if (key) {
                    modelsOfSite.delete(key);
                    // if there is no more model, remove the marker from the map
                    if (modelsOfSite.size === 0) {
                      markersRef.current[selectedMarkerIndexRef.current]?.marker?.setMap(null);
                    }
                  }
                }
              }
            });
            setSelectedSite(null);
            setSelectedLocation(null);
          });
        },
        onCancel: () => {},
        okText: i18n.t('word.Yes', lang),
        cancelText: i18n.t('word.No', lang),
      });
    };

    const likeModelSite = (model: ModelSite) => {
      if (model.userid && model.title) {
        const modelKey = Util.getModelKey(model);
        const liked = !!user.likes?.includes(modelKey);
        likeModel(model, !liked, () => {
          // update the cached record
          setCommonStore((state) => {
            if (state.user) {
              if (!state.user.likes) state.user.likes = [];
              if (state.user.likes.includes(modelKey)) {
                const index = state.user.likes.indexOf(modelKey);
                if (index >= 0) {
                  state.user.likes.splice(index, 1);
                }
              } else {
                state.user.likes.push(modelKey);
              }
            }
            if (state.modelSites) {
              const modelsOfSite = state.modelSites.get(Util.getLatLngKey(model.latitude, model.longitude));
              if (modelsOfSite) {
                for (const v of modelsOfSite.values()) {
                  if (v.userid === model.userid && v.title === model.title) {
                    if (v.likeCount === undefined) v.likeCount = 0;
                    v.likeCount += liked ? -1 : 1;
                    break;
                  }
                }
              }
            }
          });
          setUpdateFlag(!updateFlag);
        });
      }
    };

    const getLikeCount = (model: ModelSite) => {
      const modelsOfSite = useStore.getState().modelSites.get(Util.getLatLngKey(model.latitude, model.longitude));
      if (modelsOfSite) {
        for (const v of modelsOfSite.values()) {
          if (v.userid === model.userid && v.title === model.title) {
            return v.likeCount ?? 0;
          }
        }
      }
      return 0;
    };

    const getClickCount = (model: ModelSite) => {
      const modelsOfSite = useStore.getState().modelSites.get(Util.getLatLngKey(model.latitude, model.longitude));
      if (modelsOfSite) {
        for (const v of modelsOfSite.values()) {
          if (v.userid === model.userid && v.title === model.title) {
            return v.clickCount ?? 0;
          }
        }
      }
      return 0;
    };

    const isPinned = (model: ModelSite) => {
      const modelsOfSite = useStore.getState().modelSites.get(Util.getLatLngKey(model.latitude, model.longitude));
      if (modelsOfSite) {
        for (const v of modelsOfSite.values()) {
          if (v.userid === model.userid && v.title === model.title) {
            return v.pinned;
          }
        }
      }
      return false;
    };

    const pinModelSite = (model: ModelSite, pinned: boolean) => {
      if (model.userid && model.title) {
        pinModel(model, pinned, () => {
          // update the cached record
          setCommonStore((state) => {
            if (state.modelSites) {
              const modelsOfSite = state.modelSites.get(Util.getLatLngKey(model.latitude, model.longitude));
              if (modelsOfSite) {
                for (const v of modelsOfSite.values()) {
                  if (v.userid === model.userid && v.title === model.title) {
                    v.pinned = pinned;
                    setUpdateFlag(!updateFlag);
                    break;
                  }
                }
              }
            }
          });
        });
      }
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
        center={{ lat: latRef.current, lng: lngRef.current }}
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
          {selectedSite && selectedSite.size && selectedLocation && (
            <InfoWindow position={{ lat: selectedLocation.lat(), lng: selectedLocation.lng() }}>
              <div
                style={{ border: '2px solid gainsboro', maxHeight: '400px', overflowY: 'auto' }}
                onMouseLeave={() => {
                  setSelectedSite(null);
                  setSelectedLocation(null);
                }}
              >
                {selectedSite.size > 1 ? (
                  <div
                    style={{
                      background: '#dddddd',
                      textAlign: 'left',
                      borderBottom: '1px solid gainsboro',
                      paddingBottom: '4px',
                      marginBottom: '4px',
                    }}
                  >
                    {ascendingOrder ? (
                      <DownCircleOutlined
                        title={i18n.t('modelsMap.SortFromNewestToOldest', lang)}
                        style={{ cursor: 'pointer', marginLeft: '2px', marginRight: '6px' }}
                        onClick={() => {
                          setAscendingOrder(false);
                        }}
                      />
                    ) : (
                      <UpCircleOutlined
                        title={i18n.t('modelsMap.SortFromOldestToNewest', lang)}
                        style={{ cursor: 'pointer', marginLeft: '2px', marginRight: '6px' }}
                        onClick={() => {
                          setAscendingOrder(true);
                        }}
                      />
                    )}
                    <span style={{ fontSize: '10px' }}>
                      {selectedSite.size} {i18n.t('modelsMap.ModelsFoundOnThisSite', lang)}
                    </span>
                    {selectedLocation && (
                      <span style={{ fontSize: '10px' }}>
                        &nbsp;&mdash;{' '}
                        {i18n.t('word.Coordinates', lang) +
                          ': (' +
                          selectedLocation.lat().toFixed(LAT_LNG_FRACTION_DIGITS) +
                          '°, ' +
                          selectedLocation.lng().toFixed(LAT_LNG_FRACTION_DIGITS) +
                          '°)'}
                      </span>
                    )}
                  </div>
                ) : (
                  ''
                )}
                {[...selectedSite.keys()]
                  .sort((a, b) => {
                    const modelA = selectedSite.get(a);
                    const modelB = selectedSite.get(b);
                    if (modelA?.pinned && !modelB?.pinned) return -1;
                    if (modelB?.pinned && !modelA?.pinned) return 1;
                    return (ascendingOrder ? 1 : -1) * ((modelA?.timeCreated ?? 0) - (modelB?.timeCreated ?? 0));
                  })
                  .map((key: string, index: number) => {
                    const m = selectedSite.get(key);
                    if (!m) return null;
                    return (
                      <div
                        key={index}
                        style={{
                          padding: selectedSite?.size > 1 ? '5px 5px 20px 5px' : '5px',
                          background: index % 2 === 0 ? 'white' : '#eeeeee',
                        }}
                      >
                        {index === 0 && (
                          <div style={{ fontSize: '12px', display: 'block', paddingBottom: '6px' }}>
                            {m.countryCode && (
                              <ReactCountryFlag
                                countryCode={m.countryCode}
                                style={{ marginRight: '6px', width: '20px' }}
                                svg
                              />
                            )}
                            {m.address ?? 'Unknown'}
                            {selectedSite.size === 1 && (
                              <span style={{ fontSize: '10px', display: 'block', paddingTop: '10px' }}>
                                {i18n.t('word.Coordinates', lang) +
                                  ': (' +
                                  selectedLocation.lat().toFixed(LAT_LNG_FRACTION_DIGITS) +
                                  '°, ' +
                                  selectedLocation.lng().toFixed(LAT_LNG_FRACTION_DIGITS) +
                                  '°)'}
                              </span>
                            )}
                          </div>
                        )}
                        <Collapse
                          style={{
                            background: isPinned(m) ? '#FEF9EC' : index % 2 === 0 ? 'white' : '#eeeeee',
                            width: '400px',
                          }}
                          bordered={false}
                          ghost={true}
                          defaultActiveKey={['0']}
                        >
                          <Panel
                            header={
                              <>
                                {m.label}
                                {isPinned(m) && <PushpinOutlined style={{ marginLeft: '8px' }} />}
                              </>
                            }
                            key={index}
                            style={{ fontSize: '12px' }}
                          >
                            <div style={{ fontSize: '10px', display: 'block', textAlign: 'left' }}>
                              <Space align={'start'}>
                                {m.thumbnailUrl && (
                                  <img
                                    alt={m.label}
                                    title={i18n.t('word.Open', lang)}
                                    src={m.thumbnailUrl}
                                    style={{ border: '1px solid #222', cursor: 'pointer' }}
                                    onClick={() => openModelSite(m)}
                                  />
                                )}
                                <div>
                                  {m.description && m.description.trim() !== '' ? m.description : ''}
                                  &nbsp;&mdash;&nbsp; By{' '}
                                  <span
                                    style={{ cursor: 'pointer' }}
                                    title={i18n.t('modelsMap.ShowModelsPublishedByThisAuthor', lang)}
                                    onClick={() => {
                                      selectAuthor(m.author);
                                    }}
                                  >
                                    {!m.author || m.author === '' ? i18n.t('word.Anonymous', lang) : m.author}
                                  </span>
                                  ,&nbsp;
                                  {m.timeCreated && <ReactTimeago date={new Date(m.timeCreated)} />}
                                </div>
                              </Space>
                            </div>
                          </Panel>
                        </Collapse>
                        <div style={{ marginTop: '10px', fontSize: '11px' }}>
                          {ifiUser && (
                            <>
                              {isPinned(m) ? (
                                <PushpinFilled
                                  style={{ cursor: 'pointer' }}
                                  title={i18n.t('word.Unpin', lang)}
                                  onClick={() => pinModelSite(m, false)}
                                />
                              ) : (
                                <PushpinOutlined
                                  style={{ cursor: 'pointer' }}
                                  title={i18n.t('word.Pin', lang)}
                                  onClick={() => pinModelSite(m, true)}
                                />
                              )}
                            </>
                          )}
                          <img
                            alt={'Open'}
                            onClick={() => openModelSite(m)}
                            style={{ marginLeft: '10px', cursor: 'pointer' }}
                            title={i18n.t('word.Open', lang)}
                            src={OpenFileIcon}
                            height={imageSize}
                            width={imageSize}
                          />
                          <img
                            alt={'Export link'}
                            onClick={() => shareModelSite(m)}
                            style={{ marginLeft: '5px', cursor: 'pointer' }}
                            title={i18n.t('word.Share', lang)}
                            src={ExportLinkIcon}
                            height={imageSize}
                            width={imageSize}
                          />
                          {m.userid === user.uid && (
                            <img
                              alt={'Delete'}
                              onClick={() => deleteModelSite(m)}
                              style={{ marginLeft: '5px', cursor: 'pointer' }}
                              title={i18n.t('word.Delete', lang)}
                              src={DeleteIcon}
                              height={imageSize}
                              width={imageSize}
                            />
                          )}
                          {user.uid ? (
                            <>
                              {user.likes && user.likes.includes(Util.getModelKey(m)) ? (
                                <img
                                  alt={'Like'}
                                  onClick={() => likeModelSite(m)}
                                  style={{ marginLeft: '10px', cursor: 'pointer' }}
                                  title={i18n.t('word.AlreadyLike', lang)}
                                  src={RedHeartIcon}
                                  height={imageSize}
                                  width={imageSize}
                                />
                              ) : (
                                <img
                                  alt={'Like'}
                                  onClick={() => likeModelSite(m)}
                                  style={{ marginLeft: '10px', cursor: 'pointer' }}
                                  title={i18n.t('word.Like', lang)}
                                  src={EmptyHeartIcon}
                                  height={imageSize}
                                  width={imageSize}
                                />
                              )}
                            </>
                          ) : (
                            <>
                              <img
                                alt={'Like'}
                                style={{ marginLeft: '10px', opacity: 0.5 }}
                                title={i18n.t('word.MustLogInToLike', lang)}
                                src={EmptyHeartIcon}
                                height={imageSize}
                                width={imageSize}
                              />
                            </>
                          )}
                          &nbsp;&nbsp;&nbsp;{getLikeCount(m)}
                          <img
                            alt={'Click counter'}
                            style={{ marginLeft: '10px' }}
                            title={i18n.t('word.ClickCount', lang)}
                            src={ClickCountIcon}
                            height={imageSize}
                            width={imageSize}
                          />
                          &nbsp;&nbsp;&nbsp;{getClickCount(m)}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </InfoWindow>
          )}
          {!!modelSites && !!modelSites.size && (
            <MarkerClusterer>
              {(clusterer) => (
                <div>
                  {[...modelSites.keys()].map((key: string, index: number) => {
                    const m = modelSites.get(key);
                    if (!m || !m.size) return null;
                    const keys = [...m.keys()].sort((a, b) => {
                      const modelA = m.get(a);
                      const modelB = m.get(b);
                      if (modelA?.pinned && !modelB?.pinned) return -1;
                      if (modelB?.pinned && !modelA?.pinned) return 1;
                      return (ascendingOrder ? 1 : -1) * ((modelA?.timeCreated ?? 0) - (modelB?.timeCreated ?? 0));
                    });
                    const model = m.get(keys[0]);
                    if (!model) return null;
                    const iconUrl = getIconUrl(model);
                    const selectedModelSite = usePrimitiveStore.getState().modelsMapSelectedSite;
                    let selected = false;
                    for (const [k, v] of m) {
                      if (v.title === selectedModelSite?.title) {
                        selected = true;
                        break;
                      }
                    }
                    return (
                      <Marker
                        label={
                          selected
                            ? {
                                text: '⇧',
                                color: 'red',
                                fontSize: '24px',
                                fontWeight: 'bold',
                              }
                            : undefined
                        }
                        key={index}
                        ref={(e) => (markersRef.current[index] = e)}
                        clusterer={clusterer}
                        icon={iconUrl ? { url: iconUrl, labelOrigin: { x: 15, y: 42 } as Point } : undefined}
                        position={{ lat: model.latitude, lng: model.longitude }}
                        onClick={() => openModelSite(model)}
                        onMouseOver={() => {
                          previousSiteRef.current = selectedSite;
                          selectedMarkerIndexRef.current = index;
                          setSelectedSite(m);
                          const c = key.split(', ');
                          setSelectedLocation(new google.maps.LatLng(Number.parseFloat(c[0]), Number.parseFloat(c[1])));
                        }}
                        onMouseOut={() => {
                          if (selectedSite === previousSiteRef.current) {
                            setSelectedSite(null);
                            setSelectedLocation(null);
                          }
                        }}
                      />
                    );
                  })}
                </div>
              )}
            </MarkerClusterer>
          )}
        </>
      </GoogleMap>
    );
  },
);

export default ModelsMap;
