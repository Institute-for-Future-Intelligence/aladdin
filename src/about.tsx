/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React from 'react';
import styled from 'styled-components';
import Team from './team';

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
  return (
    <Container>
      <Team top={10} color={'antiquewhite'} />
      <div
        style={{
          position: 'absolute',
          fontSize: 'medium',
          color: 'antiquewhite',
          cursor: 'pointer',
          bottom: '10px',
        }}
        onMouseDown={() => {
          openAboutUs(false);
        }}
      >
        Close
      </div>
    </Container>
  );
};

export default React.memo(About);
