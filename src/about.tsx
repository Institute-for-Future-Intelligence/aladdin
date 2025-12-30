/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 */

import React from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import Team from './team';

const Container = styled.div`
  position: absolute;
  top: 80px;
  left: 10px;
  display: flex;
  width: 600px;
  height: 320px;
  flex-direction: column;
  align-items: center;
  z-index: 1001;
  border-radius: 10px;
  background: dimgray;
  box-shadow: 3px 3px 3px 3px black;
`;

const CloseButton = styled.div`
  position: absolute;
  bottom: 10px;
  font-size: small;
  color: antiquewhite;
  cursor: pointer;

  &:hover {
    opacity: 0.8;
  }
`;

const About = React.memo(({ close }: { close: () => void }) => {
  const { t } = useTranslation();

  return (
    <Container>
      <Team top={10} color={'antiquewhite'} />
      <CloseButton onClick={close}>{t('word.Close')}</CloseButton>
    </Container>
  );
});

About.displayName = 'About';

export default About;
