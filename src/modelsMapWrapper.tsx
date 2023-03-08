/*
 * @Copyright 2023. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useMemo, useRef } from 'react';
import styled from 'styled-components';
import { useStore } from './stores/common';
import * as Selector from './stores/selector';
import i18n from './i18n/i18n';
import { Libraries } from '@react-google-maps/api/dist/utils/make-load-script-url';
import { StandaloneSearchBox, useJsApiLoader } from '@react-google-maps/api';
import Spinner from './components/spinner';
import { Checkbox, Space } from 'antd';
import ModelsMap from './components/modelsMap';
import { UndoableChangeLocation } from './undo/UndoableChangeLocation';
import { DEFAULT_ADDRESS } from './constants';
import { usePrimitiveStore } from './stores/commonPrimitive';
import { ModelSite } from './types';
import ReactCountryFlag from 'react-country-flag';
import { UserOutlined } from '@ant-design/icons';

const libraries = ['places'] as Libraries;

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
  deleteModelFromMap: (model: ModelSite, successCallback?: Function) => void;
  likeModelFromMap: (model: ModelSite, like: boolean, successCallback?: Function) => void;
  pinModelFromMap: (model: ModelSite, pinned: boolean, successCallback?: Function) => void;
}

const ModelsMapWrapper = ({
  openCloudFile,
  deleteModelFromMap,
  likeModelFromMap,
  pinModelFromMap,
}: ModelsMapWrapperProps) => {
  const user = useStore(Selector.user);
  const language = useStore(Selector.language);
  const setCommonStore = useStore(Selector.set);
  const addUndoable = useStore(Selector.addUndoable);
  const modelsMapLatitude = useStore(Selector.modelsMapLatitude);
  const latitude = modelsMapLatitude !== undefined ? modelsMapLatitude : 42.2844063;
  const modelsMapLongitude = useStore(Selector.modelsMapLongitude);
  const longitude = modelsMapLongitude !== undefined ? modelsMapLongitude : -71.3488548;
  const address = useStore.getState().modelsMapAddress ?? DEFAULT_ADDRESS;
  const mapWeatherStations = usePrimitiveStore(Selector.modelsMapWeatherStations);
  const scoreboardFlag = usePrimitiveStore(Selector.scoreboardFlag);
  const latestModelSite = useStore(Selector.latestModelSite);
  const modelSites = useStore(Selector.modelSites);
  const contributors = useStore(Selector.modelsMapContributors);

  const searchBox = useRef<google.maps.places.SearchBox>();
  const containerRef = useRef<HTMLDivElement>(null);

  const lang = { lng: language };

  useEffect(() => {
    // TODO: This doesn't seem to work
    containerRef.current?.focus();
  }, []);

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.REACT_APP_MAPS_API_KEY as string,
    libraries: libraries,
  });

  const close = () => {
    setCommonStore((state) => {
      state.openModelsMap = false;
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
            });
          },
          redo: () => {
            setCommonStore((state) => {
              state.modelsMapLatitude = undoableChangeLocation.newLatitude;
              state.modelsMapLongitude = undoableChangeLocation.newLongitude;
              state.modelsMapAddress = undoableChangeLocation.newAddress;
            });
          },
        } as UndoableChangeLocation;
        addUndoable(undoableChangeLocation);
        setCommonStore((state) => {
          if (geometry.location) {
            state.modelsMapLatitude = geometry.location.lat();
            state.modelsMapLongitude = geometry.location.lng();
          }
          state.modelsMapAddress = places[0].formatted_address as string;
        });
      }
    }
  };

  const ifiUser = user.email?.endsWith('@intofuture.org');

  const modelSitesCount = useMemo(() => {
    if (!modelSites || !modelSites.size) return 0;
    let count = 0;
    for (const value of modelSites.values()) {
      count += value.size ?? 0;
    }
    return count;
  }, [modelSites]);

  return (
    <Container
      ref={containerRef}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          close();
        }
      }}
    >
      {isLoaded && (
        <Space>
          <div
            style={{
              position: 'absolute',
              fontSize: 'medium',
              color: 'black',
              cursor: 'pointer',
              top: '-40px',
              left: '40%',
              width: '20%',
              height: '28px',
              background: 'white',
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
                  fontSize: `14px`,
                  paddingLeft: '8px',
                  paddingRight: '8px',
                  outline: `none`,
                  textOverflow: `ellipses`,
                  position: 'relative',
                }}
              />
            </StandaloneSearchBox>
          </div>
        </Space>
      )}
      {isLoaded ? (
        <ModelsMap
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
        {scoreboardFlag && (
          <div
            style={{
              position: 'absolute',
              fontSize: '10px',
              color: 'black',
              bottom: '33px',
              left: '5px',
              width: '100px',
              height: '100px',
              overflowY: 'auto',
              padding: '6px 6px 6px 6px',
              background: 'whitesmoke',
              boxShadow: '1px 1px 1px 1px gray',
              textAlign: 'left',
            }}
          >
            <table>
              {[...contributors.keys()]
                .sort((a, b) => {
                  const countA = contributors.get(a);
                  const countB = contributors.get(b);
                  return (countB ? countB.length : 0) - (countA ? countA.length : 0);
                })
                .map((key: string, index: number) => {
                  return (
                    <tr
                      style={{ width: '100px', background: index % 2 === 0 ? 'lightgoldenrodyellow' : 'lavenderblush' }}
                    >
                      <td style={{ width: '80px' }}>
                        <UserOutlined style={{ marginRight: '2px', fontSize: '10px' }} />
                        {key}
                      </td>
                      <td>{contributors.get(key)?.length}</td>
                    </tr>
                  );
                })}
            </table>
          </div>
        )}
        <Space>
          <div
            title={i18n.t('word.Total', lang) + ': ' + modelSitesCount}
            style={{
              position: 'absolute',
              fontSize: '14px',
              color: 'black',
              bottom: '6px',
              left: '5px',
              width: '100px',
              height: '25px',
              paddingTop: '2px',
              background: 'whitesmoke',
              boxShadow: '1px 1px 1px 1px gray',
              cursor: 'pointer',
            }}
            onClick={() => {
              usePrimitiveStore.setState((state) => {
                state.scoreboardFlag = !state.scoreboardFlag;
              });
            }}
          >
            {i18n.t('word.Scoreboard', lang)}
          </div>
        </Space>
        {latestModelSite && (
          <Space>
            <div
              style={{
                position: 'absolute',
                fontSize: '10px',
                color: 'black',
                bottom: '6px',
                left: '108px',
                height: '25x',
                padding: '6px 6px 2px 6px',
                background: 'whitesmoke',
                boxShadow: '1px 1px 1px 1px gray',
                cursor: 'pointer',
              }}
              onClick={() => {
                setCommonStore((state) => {
                  if (latestModelSite) {
                    state.modelsMapLatitude = latestModelSite.latitude;
                    state.modelsMapLongitude = latestModelSite.longitude;
                    state.modelsMapZoom = 20;
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
              fontSize: 'medium',
              color: 'black',
              cursor: 'pointer',
              top: '-52px',
              right: user.uid ? '60px' : '100px',
              width: '64px',
              height: '28px',
              background: 'orange',
              boxShadow: '1px 1px 1px 1px gray',
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
                usePrimitiveStore.setState((state) => {
                  state.modelsMapWeatherStations = !state.modelsMapWeatherStations;
                });
              }}
            >
              {mapWeatherStations ? (
                <label title={i18n.t('mapPanel.WeatherStationsNote', lang)}>
                  {i18n.t('mapPanel.WeatherStations', lang)}
                </label>
              ) : (
                <label>{i18n.t('mapPanel.WeatherStations', lang)}</label>
              )}
            </Checkbox>
          </Space>
        )}
      </>
    </Container>
  );
};

export default React.memo(ModelsMapWrapper);