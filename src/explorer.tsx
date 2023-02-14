/*
 * @Copyright 2023. Institute for Future Intelligence, Inc.
 */

import React from 'react';
import styled from 'styled-components';
import { useStore } from './stores/common';
import * as Selector from './stores/selector';
import i18n from './i18n/i18n';
import { Libraries } from '@react-google-maps/api/dist/utils/make-load-script-url';
import { useJsApiLoader } from '@react-google-maps/api';
import Spinner from './components/spinner';
import { Checkbox, Space } from 'antd';
import ModelMap from './components/modelMap';

const libraries = ['places'] as Libraries;

const Container = styled.div`
  position: absolute;
  top: 80px;
  left: 10px;
  display: flex;
  width: calc(100% - 20px);
  height: calc(100% - 90px);
  flex-direction: column;
  align-items: center;
  z-index: 999;
  border-radius: 10px;
  background: white;
  box-shadow: 1px 1px 1px 1px gray;
`;

export interface ExplorerProps {
  openCloudFile: (userid: string, title: string) => void;
}

const Explorer = ({ openCloudFile }: ExplorerProps) => {
  const language = useStore(Selector.language);
  const setCommonStore = useStore(Selector.set);
  const mapWeatherStations = useStore(Selector.modelMapWeatherStations);

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.REACT_APP_MAPS_API_KEY as string,
    libraries: libraries,
  });

  const close = () => {
    setCommonStore((state) => {
      state.openModelMap = false;
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
      {isLoaded ? <ModelMap closeMap={close} openModel={openCloudFile} /> : <Spinner />}
      {loadError && (
        <Space>
          <div>Map cannot be loaded right now, sorry.</div>
        </Space>
      )}
      <>
        <Space>
          <div
            style={{
              position: 'absolute',
              fontSize: 'medium',
              color: 'black',
              cursor: 'pointer',
              bottom: '8px',
              left: '50%',
              width: '64px',
              height: '28px',
              background: 'orange',
              boxShadow: '1px 1px 1px 1px gray',
            }}
            onMouseDown={() => {
              close();
            }}
          >
            {i18n.t('word.Close', { lng: language })}
          </div>
        </Space>
        <Space>
          <Checkbox
            style={{
              position: 'absolute',
              fontSize: 'medium',
              color: 'black',
              cursor: 'pointer',
              bottom: '8px',
              left: 'calc(50% - 160px)',
              width: '160px',
              height: '28px',
              background: 'white',
              boxShadow: '1px 1px 1px 1px gray',
              paddingLeft: '4px',
            }}
            onChange={() => {
              setCommonStore((state) => {
                state.modelMapWeatherStations = !state.modelMapWeatherStations;
              });
            }}
          >
            {mapWeatherStations ? (
              <label title={i18n.t('mapPanel.WeatherStationsNote', { lng: language })}>
                {i18n.t('mapPanel.WeatherStations', { lng: language })}
              </label>
            ) : (
              <label>{i18n.t('mapPanel.WeatherStations', { lng: language })}</label>
            )}
          </Checkbox>
        </Space>
      </>
    </Container>
  );
};

export default React.memo(Explorer);
