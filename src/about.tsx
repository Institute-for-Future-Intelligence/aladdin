/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import React from 'react';
import styled from 'styled-components';
import Team from './team';
import { useStore } from './stores/common';
import * as Selector from './stores/selector';
import i18n from './i18n/i18n';

const Container = styled.div`
  position: absolute;
  top: 80px;
  left: 10px;
  display: flex;
  width: 600px;
  height: 400px;
  flex-direction: column;
  align-items: center;
  z-index: 99;
  border-radius: 10px;
  background: dimgray;
  box-shadow: 3px 3px 3px 3px black;
`;

export interface AboutProps {
  openAboutUs: (on: boolean) => void;
}

const About = ({ openAboutUs }: AboutProps) => {
  const language = useStore(Selector.language);
  return (
    <Container>
      <Team top={10} color={'antiquewhite'} />
      <div
        style={{
          position: 'absolute',
          fontSize: 'small',
          color: 'antiquewhite',
          cursor: 'pointer',
          bottom: '10px',
        }}
        onMouseDown={() => {
          openAboutUs(false);
        }}
      >
        {i18n.t('word.Close', { lng: language })}
      </div>
    </Container>
  );
};

export default React.memo(About);
