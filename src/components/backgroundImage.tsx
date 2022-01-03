/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import React from 'react';
import styled from 'styled-components';
import { Overlay } from './blurredImage';

const Background = styled.img`
  filter: opacity(15%);
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: 1;
`;

const Container = styled.div`
  overflow: hidden;
`;

export interface BackgroundProps {
  image: string;
  overlay: boolean;

  [key: string]: any;
}

const BackgroundImage = ({ image, overlay, ...rest }: BackgroundProps) => {
  if (overlay) {
    return (
      <Container {...rest}>
        <Background src={`${image}`} />
        <Overlay />
      </Container>
    );
  } else {
    return (
      <Container {...rest}>
        <Background src={`${image}`} />
      </Container>
    );
  }
};

export default BackgroundImage;
