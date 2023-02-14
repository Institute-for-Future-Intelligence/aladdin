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
import { Space } from 'antd';
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

const Explorer = ({ close }: { close: () => void }) => {
  const language = useStore(Selector.language);

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.REACT_APP_MAPS_API_KEY as string,
    libraries: libraries,
  });

  return (
    <Container
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          close();
        }
      }}
    >
      {isLoaded ? <ModelMap close={close} /> : <Spinner />}
      {loadError && (
        <Space>
          <div>Map cannot be loaded right now, sorry.</div>
        </Space>
      )}
      <div
        style={{
          position: 'absolute',
          fontSize: 'medium',
          color: 'black',
          cursor: 'pointer',
          bottom: '8px',
          width: '64px',
          height: '24px',
          background: 'orange',
          boxShadow: '1px 1px 1px 1px gray',
        }}
        onMouseDown={() => {
          close();
        }}
      >
        {i18n.t('word.Close', { lng: language })}
      </div>
    </Container>
  );
};

export default React.memo(Explorer);
