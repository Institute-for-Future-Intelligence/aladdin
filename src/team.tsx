/*
 * @Copyright 2021-2025. Institute for Future Intelligence, Inc.
 */

import React from 'react';
import styled from 'styled-components';
import { Language } from './types';
import { useStore } from './stores/common';
import * as Selector from './stores/selector';
import i18n from './i18n/i18n';

export interface TeamProps {
  top: number;
  height?: number;
  color?: string;
}

const Container = styled.div<{ $top: number; $height: number }>`
  position: absolute;
  border-radius: 20px;
  border: thin;
  text-align: center;
  left: 5%;
  right: 5%;
  top: ${(props) => props.$top}px;
  height: ${(props) => props.$height}px;
`;

const Title = styled.h2<{ $color?: string }>`
  margin-top: 20px;
  color: ${(props) => props.$color};
`;

const Authors = styled.p<{ $color?: string }>`
  font-size: 16px;
  color: ${(props) => props.$color};
`;

const Content = styled.div<{ $color?: string }>`
  position: absolute;
  margin-top: 20px;
  font-size: 12px;
  text-align: justify;
  color: ${(props) => props.$color};
`;

const Divider = styled.hr<{ $color?: string }>`
  width: 100%;
  margin-top: 20px;
  color: ${(props) => props.$color};
`;

const Footer = styled.p<{ $color?: string }>`
  text-align: center;
  padding-top: 6px;
  font-size: 12px;
  color: ${(props) => props.$color};
`;

const FooterLink = styled.a<{ $color?: string }>`
  color: ${(props) => props.$color};
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;

const Team = React.memo(({ top, height = 300, color = 'inherit' }: TeamProps) => {
  const language = useStore(Selector.language);

  return (
    <Container $top={top} $height={height}>
      <Title $color={color}>{i18n.t('aboutUs.ProductBroughtToYouBy', { lng: language })}</Title>
      <Authors $color={color}>Charles Xie and Xiaotong Ding</Authors>
      <Content $color={color}>
        {i18n.t('aboutUs.Translators', { lng: language })}: {Language.Ukrainian} (Andriy Kashyrskyy), {Language.Spanish}{' '}
        (Alex Barco), {Language.Turkish} (Hasan Bircan)
        <br />
        <br />
        {i18n.t('aboutUs.Acknowledgment', { lng: language })}: {i18n.t('aboutUs.FundingInformation', { lng: language })}{' '}
        {i18n.t('aboutUs.Contact', { lng: language })}
        <Divider $color={color} />
        <Footer $color={color}>
          <FooterLink
            $color={color}
            target="_blank"
            rel="noopener noreferrer"
            href="https://intofuture.org/aladdin-terms.html"
          >
            {i18n.t('aboutUs.TermsOfService', { lng: language })}
          </FooterLink>
          &nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;
          <FooterLink
            $color={color}
            target="_blank"
            rel="noopener noreferrer"
            href="https://intofuture.org/aladdin-privacy.html"
          >
            {i18n.t('aboutUs.PrivacyPolicy', { lng: language })}
          </FooterLink>
        </Footer>
      </Content>
    </Container>
  );
});

Team.displayName = 'Team';

export default Team;
