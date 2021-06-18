/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React from 'react';
import styled from 'styled-components';

const Blurred = styled.img`
  filter: blur(12px);
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: 1;
`;

const Container = styled.div`
  overflow: hidden;
`;

export const Overlay = styled.div`
  position: absolute;
  background-color: rgba(0, 0, 0, 0.7);
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
`;

export interface BlurredImgProps {
    image: string;

    [key: string]: any;
}

const BlurredImage = ({image, ...rest}: BlurredImgProps) => {
    return (
        <Container {...rest}>
            <Blurred src={`data:image/jpeg;base64,${image}`}/>
            <Overlay/>
        </Container>
    );
};

export default BlurredImage;
