/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import React from 'react';
import CookieConsent from 'react-cookie-consent';
import i18n from './i18n/i18n';
import { useStore } from './stores/common';
import * as Selector from './stores/selector';

const AcceptCookie = () => {
  const language = useStore(Selector.language);
  const lang = { lng: language };
  return (
    <CookieConsent
      location="bottom"
      buttonText={i18n.t('cookie.Accept', lang)}
      cookieName="AladdinCookieName"
      style={{ background: '#2B373B', textAlign: 'center', zIndex: 99999 }}
      buttonStyle={{ color: '#4e503b', fontSize: '12px' }}
      expires={150}
    >
      {i18n.t('cookie.Statement', lang)}
    </CookieConsent>
  );
};

export default AcceptCookie;
