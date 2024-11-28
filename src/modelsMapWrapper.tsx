/*
 * @Copyright 2023-2024. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import { useStore } from './stores/common';
import * as Selector from './stores/selector';
import i18n from './i18n/i18n';
import { Libraries } from '@react-google-maps/api/dist/utils/make-load-script-url';
import { StandaloneSearchBox, useJsApiLoader } from '@react-google-maps/api';
import Spinner from './components/spinner';
import { Checkbox, DatePicker, Empty, Input, Space, Tag } from 'antd';
import ModelsMap from './components/modelsMap';
import { UndoableChangeLocation } from './undo/UndoableChangeLocation';
import { DEFAULT_ADDRESS } from './constants';
import { usePrimitiveStore } from './stores/commonPrimitive';
import { ModelSite } from './types';
import ReactCountryFlag from 'react-country-flag';
import { VerticalAlignBottomOutlined, VerticalAlignTopOutlined, UserOutlined, SearchOutlined } from '@ant-design/icons';
import ModelsGallery from './modelsGallery';
import { useLanguage } from './hooks';
import dayjs from 'dayjs';
import { RangePickerProps } from 'antd/lib/date-picker';

const libraries = ['places'] as Libraries;

const { RangePicker } = DatePicker;

const Container = styled.div`
  position: absolute;
  top: 70px;
  left: 0;
  display: flex;
  width: 100%;
  height: calc(100% - 70px);
  flex-direction: column;
  align-items: center;
  z-index: 999;
  tab-index: 0;
  background: white;
`;

export interface ModelsMapWrapperProps {
  openCloudFile: (model: ModelSite) => void;
  deleteModelFromMap: (model: ModelSite, successCallback?: () => void) => void;
  likeModelFromMap: (model: ModelSite, like: boolean, successCallback?: () => void) => void;
  pinModelFromMap: (model: ModelSite, pinned: boolean, successCallback?: () => void) => void;
}

const ModelsMapWrapper = React.memo(
  ({ openCloudFile, deleteModelFromMap, likeModelFromMap, pinModelFromMap }: ModelsMapWrapperProps) => {
    const user = useStore(Selector.user);
    const setCommonStore = useStore(Selector.set);
    const setPrimitiveStore = usePrimitiveStore(Selector.setPrimitiveStore);
    const addUndoable = useStore(Selector.addUndoable);
    const modelsMapType = useStore(Selector.modelsMapType);
    const modelsMapLatitude = useStore(Selector.modelsMapLatitude);
    const latitude = modelsMapLatitude !== undefined ? modelsMapLatitude : 42.2844063;
    const modelsMapLongitude = useStore(Selector.modelsMapLongitude);
    const longitude = modelsMapLongitude !== undefined ? modelsMapLongitude : -71.3488548;
    const address = useStore.getState().modelsMapAddress ?? DEFAULT_ADDRESS;
    const mapWeatherStations = usePrimitiveStore(Selector.modelsMapWeatherStations);
    const showModelsAllTime = useStore(Selector.showModelsAllTime);
    const showModelsFromDate = useStore(Selector.showModelsFromDate);
    const showModelsToDate = useStore(Selector.showModelsToDate);
    const showLeaderboard = usePrimitiveStore(Selector.showLeaderboard);
    const latestModelSite = useStore(Selector.latestModelSite);
    const modelSites = useStore(Selector.modelSites);
    const allModelSites = useStore(Selector.allModelSites);
    const peopleModels = useStore(Selector.peopleModels);
    const allPeopleModels = useStore(Selector.allPeopleModels);

    // make an editable copy because models is not mutable
    const peopleModelsRef = useRef<Map<string, Map<string, ModelSite>>>(
      peopleModels ? new Map(peopleModels) : new Map(),
    );
    const [selectedAuthor, setSelectedAuthor] = useState<string | undefined>();
    const [updateFlag, setUpdateFlag] = useState<boolean>(false);
    const authorModelsRef = useRef<Map<string, ModelSite>>();
    const searchBox = useRef<google.maps.places.SearchBox>();
    const latRef = useRef<number>(latitude);
    const lngRef = useRef<number>(longitude);

    const lang = useLanguage();

    const { Search } = Input;

    useEffect(() => {
      peopleModelsRef.current = peopleModels ? new Map(peopleModels) : new Map();
      if (selectedAuthor) {
        authorModelsRef.current = peopleModels.get(selectedAuthor);
      }
      setUpdateFlag(!updateFlag);
    }, [peopleModels, selectedAuthor]);

    const selectAuthor = (author: string | undefined) => {
      setSelectedAuthor(author);
      usePrimitiveStore.getState().set((state) => {
        if (!state.showLeaderboard) state.leaderboardFlag = true;
        if (author) authorModelsRef.current = peopleModelsRef.current.get(author);
      });
    };

    const { isLoaded, loadError } = useJsApiLoader({
      id: 'google-map-script',
      googleMapsApiKey: import.meta.env.VITE_MAPS_API_KEY as string,
      libraries: libraries,
    });

    const close = () => {
      usePrimitiveStore.getState().set((state) => {
        state.openModelsMap = false;
      });
      setCommonStore((state) => {
        state.modelsMapLatitude = latRef.current;
        state.modelsMapLongitude = lngRef.current;
      });
    };

    const onLoad = (s: google.maps.places.SearchBox) => {
      searchBox.current = s;
    };

    // FIXME: Undo doesn't change the value of the input field
    const onPlacesChanged = () => {
      const places = searchBox.current?.getPlaces();
      if (places && places.length > 0) {
        const geometry = places[0].geometry;
        if (geometry && geometry.location) {
          const undoableChangeLocation = {
            name: 'Set Model Map Location',
            timestamp: Date.now(),
            oldLatitude: latitude,
            newLatitude: geometry.location.lat(),
            oldLongitude: longitude,
            newLongitude: geometry.location.lng(),
            oldAddress: address,
            newAddress: places[0].formatted_address as string,
            undo: () => {
              setCommonStore((state) => {
                state.modelsMapLatitude = undoableChangeLocation.oldLatitude;
                state.modelsMapLongitude = undoableChangeLocation.oldLongitude;
                state.modelsMapAddress = undoableChangeLocation.oldAddress;
                latRef.current = state.modelsMapLatitude;
                lngRef.current = state.modelsMapLongitude;
              });
            },
            redo: () => {
              setCommonStore((state) => {
                state.modelsMapLatitude = undoableChangeLocation.newLatitude;
                state.modelsMapLongitude = undoableChangeLocation.newLongitude;
                state.modelsMapAddress = undoableChangeLocation.newAddress;
                latRef.current = state.modelsMapLatitude;
                lngRef.current = state.modelsMapLongitude;
              });
            },
          } as UndoableChangeLocation;
          addUndoable(undoableChangeLocation);
          setCommonStore((state) => {
            if (geometry.location) {
              state.modelsMapLatitude = geometry.location.lat();
              state.modelsMapLongitude = geometry.location.lng();
              latRef.current = state.modelsMapLatitude;
              lngRef.current = state.modelsMapLongitude;
            }
            state.modelsMapAddress = places[0].formatted_address as string;
          });
        }
      }
    };

    const ifiUser = user.email?.endsWith('@intofuture.org');

    const allModelSitesCount = useMemo(() => {
      if (!allModelSites || !allModelSites.size) return 0;
      let count = 0;
      for (const value of allModelSites.values()) {
        count += value.size ?? 0;
      }
      return count;
    }, [allModelSites]);

    const selectedModelSitesCount = useMemo(() => {
      if (!modelSites || !modelSites.size) return 0;
      let count = 0;
      for (const value of modelSites.values()) {
        count += value.size ?? 0;
      }
      return count;
    }, [modelSites]);

    const selectPeopleModelsBetweenDates = (start: number, end: number) => {
      const newPeopleModels = new Map<string, Map<string, ModelSite>>();
      for (const [key, entries] of allPeopleModels) {
        const newEntries = new Map<string, ModelSite>();
        for (const [k, p] of entries) {
          if (p.timeCreated && p.timeCreated >= start && p.timeCreated <= end) {
            newEntries.set(k, p);
          }
        }
        if (newEntries.size > 0) newPeopleModels.set(key, newEntries);
      }
      setCommonStore((state) => {
        state.peopleModels = newPeopleModels;
      });
    };

    return (
      <Container
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            close();
          }
        }}
      >
        {isLoaded && (
          <Space
            style={{
              position: 'absolute',
              fontSize: 'medium',
              color: 'black',
              top: '-40px',
              left: '240px',
              width: '300px',
              height: '28px',
              background: 'white',
              borderRadius: '5px',
              boxShadow: '1px 1px 1px 1px gray',
            }}
          >
            <StandaloneSearchBox onLoad={onLoad} onPlacesChanged={onPlacesChanged}>
              <input
                type="text"
                placeholder={address}
                style={{
                  boxSizing: `border-box`,
                  border: `1px solid transparent`,
                  width: `100%`,
                  height: `100%`,
                  fontSize: `12px`,
                  paddingLeft: '8px',
                  paddingRight: '8px',
                  outline: `none`,
                  textOverflow: `ellipses`,
                  position: 'relative',
                }}
              />
            </StandaloneSearchBox>
            <SearchOutlined style={{ marginLeft: '100px' }} />
          </Space>
        )}
        {isLoaded && (
          <Space
            style={{
              position: 'absolute',
              fontSize: 'medium',
              color: 'black',
              top: '-40px',
              left: '540px',
              width: '400px',
              height: '28px',
              paddingLeft: '12px',
            }}
          >
            <Checkbox
              checked={showModelsAllTime}
              onChange={(e) => {
                const checked = e.target.checked;
                setCommonStore((state) => {
                  state.showModelsAllTime = checked;
                });
                if (checked) {
                  setCommonStore((state) => {
                    state.peopleModels = new Map<string, Map<string, ModelSite>>(state.allPeopleModels);
                  });
                } else {
                  const start: number = dayjs(showModelsFromDate).toDate().getTime();
                  const end: number = dayjs(showModelsToDate).toDate().getTime();
                  selectPeopleModelsBetweenDates(start, end);
                }
                usePrimitiveStore.getState().set((state) => {
                  state.modelsMapFlag = true;
                });
              }}
            >
              {i18n.t('modelsMap.AllTime', lang)}
            </Checkbox>
            {!showModelsAllTime && (
              <RangePicker
                format="YYYY-MM-DD"
                size={'small'}
                allowClear={false}
                needConfirm={true}
                value={[dayjs(showModelsFromDate), dayjs(showModelsToDate)]}
                onOk={(value: RangePickerProps['value']) => {
                  if (!value) return;
                  const dateString: string[] = ['2021-01-01', '2025-12-31'];
                  if (value[0]) dateString[0] = value[0].toISOString();
                  if (value[1]) dateString[1] = value[1].toISOString();
                  const start: number = dayjs(dateString[0]).toDate().getTime();
                  const end: number = dayjs(dateString[1]).toDate().getTime();
                  const newModelSites = new Map<string, Map<string, ModelSite>>();
                  for (const [location, entries] of allModelSites) {
                    const newEntries = new Map<string, ModelSite>();
                    for (const [key, prop] of entries) {
                      if (prop.timeCreated && prop.timeCreated >= start && prop.timeCreated <= end) {
                        newEntries.set(key, prop);
                      }
                    }
                    if (newEntries.size > 0) newModelSites.set(location, newEntries);
                  }
                  setCommonStore((state) => {
                    state.showModelsFromDate = dateString[0];
                    state.showModelsToDate = dateString[1];
                    state.modelSites = newModelSites;
                  });
                  if (showLeaderboard) {
                    selectPeopleModelsBetweenDates(start, end);
                  }
                }}
              />
            )}
          </Space>
        )}
        {isLoaded ? (
          <ModelsMap
            latRef={latRef}
            lngRef={lngRef}
            selectAuthor={selectAuthor}
            closeMap={close}
            openModel={openCloudFile}
            deleteModel={deleteModelFromMap}
            likeModel={likeModelFromMap}
            pinModel={pinModelFromMap}
          />
        ) : (
          <Spinner />
        )}
        {loadError && (
          <Space>
            <div>Map cannot be loaded right now, sorry.</div>
          </Space>
        )}
        <>
          {selectedAuthor && (
            <ModelsGallery
              latRef={latRef}
              lngRef={lngRef}
              author={selectedAuthor}
              models={authorModelsRef.current}
              closeCallback={() => {
                setSelectedAuthor(undefined);
                setPrimitiveStore('modelsMapSelectedSite', undefined);
                authorModelsRef.current = undefined;
              }}
            />
          )}
          {showLeaderboard && !selectedAuthor && (
            <div
              style={{
                position: 'absolute',
                fontSize: '10px',
                color: 'black',
                bottom: '33px',
                left: '5px',
                width: '180px',
                height: '360px',
                overflowY: 'auto',
                padding: '6px 6px 6px 6px',
                background: 'whitesmoke',
                boxShadow: '1px 1px 1px 1px gray',
                textAlign: 'left',
              }}
            >
              <Space direction={'vertical'}>
                <Search
                  title={i18n.t('modelsMap.SearchByPublisher', lang)}
                  allowClear
                  size={'small'}
                  enterButton
                  onSearch={(s) => {
                    if (!peopleModels) return;
                    peopleModelsRef.current.clear();
                    for (const [k, v] of peopleModels) {
                      if (k.toLowerCase().includes(s.toLowerCase())) {
                        peopleModelsRef.current.set(k, v);
                      }
                    }
                    setUpdateFlag(!updateFlag);
                  }}
                />
                {peopleModelsRef.current.size === 0 ? (
                  <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
                ) : (
                  <table>
                    <tbody>
                      {[...peopleModelsRef.current.keys()]
                        .sort((a, b) => {
                          const countA = peopleModelsRef.current.get(a);
                          const countB = peopleModelsRef.current.get(b);
                          return (countB ? countB.size : 0) - (countA ? countA.size : 0);
                        })
                        .map((key: string, index: number) => {
                          if (index > 50) return null;
                          const a = peopleModelsRef.current.get(key);
                          if (a?.size === undefined || a?.size === 0) return null;
                          return (
                            <tr key={index} style={{ width: '180px' }}>
                              <td style={{ width: '150px' }}>
                                <Tag
                                  icon={<UserOutlined />}
                                  color={
                                    a?.size > 10 ? 'gold' : a?.size > 5 ? 'lime' : a?.size > 1 ? 'blue' : 'magenta'
                                  }
                                  style={{ cursor: 'pointer', fontSize: '10px', fontWeight: 'bold', width: '130px' }}
                                  onClick={() => setSelectedAuthor(key)}
                                  title={key}
                                >
                                  {key.length > 16 ? key.substring(0, 15) + '...' : key}
                                </Tag>
                              </td>
                              <td>{a?.size}</td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                )}
              </Space>
            </div>
          )}
          <Space>
            <div
              title={
                i18n.t('modelsMap.TotalNumberOfUserPublishedModelsInSelectedPeriod', lang) +
                ': ' +
                selectedModelSitesCount +
                '\n' +
                i18n.t('modelsMap.AllTimeTotal', lang) +
                ': ' +
                allModelSitesCount
              }
              style={{
                position: 'absolute',
                fontSize: '14px',
                color: 'black',
                bottom: '6px',
                left: '5px',
                width: '180px',
                height: '25px',
                paddingTop: '4px',
                background: 'whitesmoke',
                boxShadow: '1px 1px 1px 1px gray',
                cursor: 'pointer',
                userSelect: 'none',
              }}
              onClick={() => {
                usePrimitiveStore.getState().set((state) => {
                  if (!state.showLeaderboard) state.leaderboardFlag = true;
                  state.showLeaderboard = !state.showLeaderboard;
                });
              }}
            >
              {showLeaderboard ? (
                <VerticalAlignBottomOutlined title={i18n.t('word.Close', lang)} style={{ marginRight: '8px' }} />
              ) : (
                <VerticalAlignTopOutlined title={i18n.t('word.Open', lang)} style={{ marginRight: '8px' }} />
              )}
              {i18n.t('word.Leaderboard', lang)}
            </div>
          </Space>
          {latestModelSite && (
            <Space>
              <div
                style={{
                  position: 'absolute',
                  fontSize: '10px',
                  color: modelsMapType === 'roadmap' ? 'black' : 'white',
                  bottom: '6px',
                  left: '188px',
                  height: '25x',
                  padding: '6px 6px 2px 6px',
                  cursor: 'pointer',
                }}
                onClick={() => {
                  setCommonStore((state) => {
                    if (latestModelSite) {
                      state.modelsMapLatitude = latestModelSite.latitude;
                      state.modelsMapLongitude = latestModelSite.longitude;
                      state.modelsMapZoom = 20;
                      latRef.current = state.modelsMapLatitude;
                      lngRef.current = state.modelsMapLongitude;
                    }
                  });
                }}
              >
                {i18n.t('word.Latest', lang) + ': '}
                {latestModelSite.countryCode && (
                  <ReactCountryFlag
                    countryCode={latestModelSite.countryCode}
                    style={{ marginLeft: '2px', marginRight: '4px', width: '20px' }}
                    svg
                  />
                )}
                {latestModelSite.title + ', by ' + latestModelSite.author}
              </div>
            </Space>
          )}
          <Space>
            <div
              style={{
                position: 'absolute',
                fontSize: '12px',
                color: modelsMapType === 'roadmap' ? 'black' : 'white',
                top: '6px',
                height: '25x',
                padding: '6px 6px 2px 6px',
              }}
            >
              {modelSites.size + ' ' + i18n.t('modelsMap.SitesFound', lang)}
            </div>
          </Space>
          <Space>
            <div
              style={{
                position: 'absolute',
                fontSize: 'medium',
                color: 'black',
                cursor: 'pointer',
                top: '-52px',
                right: user.uid ? '60px' : '100px',
                width: '64px',
                height: '28px',
                background: 'orange',
                boxShadow: '1px 1px 1px 1px gray',
                paddingTop: '4px',
              }}
              onMouseDown={() => {
                close();
              }}
            >
              {i18n.t('word.Close', lang)}
            </div>
          </Space>
          {ifiUser && (
            <Space>
              <Checkbox
                checked={mapWeatherStations}
                style={{
                  position: 'absolute',
                  fontSize: 'medium',
                  color: 'black',
                  cursor: 'pointer',
                  top: '-52px',
                  right: '130px',
                  width: '160px',
                  height: '28px',
                  background: 'white',
                  boxShadow: '1px 1px 1px 1px gray',
                  paddingLeft: '4px',
                }}
                onChange={() => {
                  usePrimitiveStore.getState().set((state) => {
                    state.modelsMapWeatherStations = !state.modelsMapWeatherStations;
                  });
                }}
              >
                {mapWeatherStations ? (
                  <span title={i18n.t('mapPanel.WeatherStationsNote', lang)}>
                    {i18n.t('mapPanel.WeatherStations', lang)}
                  </span>
                ) : (
                  <span>{i18n.t('mapPanel.WeatherStations', lang)}</span>
                )}
              </Checkbox>
            </Space>
          )}
        </>
      </Container>
    );
  },
);

export default ModelsMapWrapper;
